const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const screenshot = require('screenshot-desktop');
const ScreenCapture = require('../models/ScreenCapture');
const MonitoringAlert = require('../models/MonitoringAlert');
const WebsiteWhitelist = require('../models/WebsiteWhitelist');
const groqAIService = require('./groqAIService');
const ocrAnalysisService = require('./ocrAnalysisService');
const { uploadViolationScreenshot, uploadRegularScreenshot } = require('../utils/cloudinary');

class IntelligentScreenCaptureService {
  constructor() {
    this.compressionQuality = parseInt(process.env.COMPRESSION_QUALITY) || 80;
    this.maxFileSize = parseInt(process.env.MAX_SCREENSHOT_SIZE) || 5 * 1024 * 1024; // 5MB
    this.baseStoragePath = process.env.SCREENSHOT_STORAGE_PATH || './uploads/employee_data';
    this.activeSessions = new Map(); // Track active monitoring sessions
    this.violationSessions = new Map(); // Track violation sessions per employee
    this.maxScreenshotsPerViolation = 3;
    this.violationCooldown = 300000; // 5 minutes cooldown between violation sessions
  }

  /**
   * Start intelligent monitoring for an employee
   */
  async startIntelligentMonitoring(employeeId, sessionId) {
    if (this.activeSessions.has(employeeId)) {
      console.log(`Intelligent monitoring already active for employee ${employeeId}`);
      return;
    }

    console.log(`Starting intelligent monitoring for employee ${employeeId}`);
    
    const sessionData = {
      employeeId,
      sessionId,
      startTime: new Date(),
      violationCount: 0,
      lastViolationTime: null,
      currentViolationSession: null,
      whitelistCache: new Map(),
      lastActivity: new Date()
    };

    this.activeSessions.set(employeeId, sessionData);
    
    // Initialize violation tracking
    if (!this.violationSessions.has(employeeId)) {
      this.violationSessions.set(employeeId, []);
    }

    // Load and cache whitelist for this employee
    await this.refreshWhitelistCache(employeeId);
  }

  /**
   * Stop intelligent monitoring for an employee
   */
  stopIntelligentMonitoring(employeeId) {
    const session = this.activeSessions.get(employeeId);
    if (session) {
      // End any active violation session
      if (session.currentViolationSession) {
        this.endViolationSession(employeeId);
      }
      
      this.activeSessions.delete(employeeId);
      console.log(`Stopped intelligent monitoring for employee ${employeeId}`);
    }
  }

  /**
   * Handle application/website change event
   */
  async handleApplicationChange(employeeId, applicationData) {
    const session = this.activeSessions.get(employeeId);
    if (!session) return;

    session.lastActivity = new Date();

    // Check if the application/website is whitelisted
    const whitelistResult = await this.checkWhitelistStatus(employeeId, applicationData);
    
    if (!whitelistResult.isWhitelisted) {
      // Perform intelligent pre-screening before taking screenshot
      const shouldMonitor = await this.performPreScreening(employeeId, applicationData);

      if (shouldMonitor) {
        console.log(`Pre-screening determined monitoring needed for ${applicationData.url || applicationData.name}`);
        await this.handleUnauthorizedAccess(employeeId, applicationData, whitelistResult);
      } else {
        console.log(`Pre-screening determined no monitoring needed for ${applicationData.url || applicationData.name}`);
        // End any active violation session since this is determined to be work-related
        if (session.currentViolationSession) {
          await this.endViolationSession(employeeId);
        }
      }
    } else {
      // Authorized access - end any active violation session
      if (session.currentViolationSession) {
        await this.endViolationSession(employeeId);
      }
    }
  }

  /**
   * Perform intelligent pre-screening to determine if monitoring is needed
   */
  async performPreScreening(employeeId, applicationData) {
    try {
      // Get current employee task for context
      const currentTask = await this.getCurrentEmployeeTask(employeeId);

      // Analyze application/website context without screenshot
      const contextAnalysis = await this.analyzeApplicationContext(applicationData, currentTask);

      // Make intelligent decision based on context
      return this.shouldTakeScreenshot(contextAnalysis, applicationData, currentTask);

    } catch (error) {
      console.error('Error in pre-screening:', error);
      // Default to monitoring if analysis fails (conservative approach)
      return true;
    }
  }

  /**
   * Analyze application context using AI without screenshot
   */
  async analyzeApplicationContext(applicationData, currentTask) {
    try {
      const groqAIService = require('./groqAIService');

      if (!groqAIService.apiKey) {
        // If no AI available, use basic heuristics
        return this.performBasicContextAnalysis(applicationData, currentTask);
      }

      const prompt = this.buildContextAnalysisPrompt(applicationData, currentTask);

      const response = await groqAIService.callGroqAPIWithRetry({
        model: groqAIService.model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.2
      });

      const aiResponse = response.data.choices[0]?.message?.content;
      return this.parseContextAnalysis(aiResponse);

    } catch (error) {
      console.error('Error in AI context analysis:', error);
      return this.performBasicContextAnalysis(applicationData, currentTask);
    }
  }

  /**
   * Build prompt for context analysis
   */
  buildContextAnalysisPrompt(applicationData, currentTask) {
    const { url, name } = applicationData;

    let prompt = `Analyze if this application/website access should trigger employee monitoring.

APPLICATION/WEBSITE:
- URL: ${url || 'N/A'}
- Application: ${name || 'Unknown'}

CONTEXT:`;

    if (currentTask) {
      prompt += `
- Employee's Current Task: "${currentTask.title}"
- Task Description: "${currentTask.description}"
- Task Priority: ${currentTask.priority}`;
    } else {
      prompt += `
- Employee's Current Task: No active task assigned`;
    }

    prompt += `

ANALYSIS CRITERIA:
1. Is this likely work-related based on the URL/application name?
2. Does it relate to the employee's current task?
3. Could this be legitimate work activity?

Common work-related indicators:
- Development tools (VS Code, IDEs, terminals)
- Documentation sites (docs.*, developer.*, api.*)
- Cloud services (AWS, Azure, Google Cloud)
- Project management tools
- Communication tools (Slack, Teams, email)
- Code repositories and version control
- Technical learning resources

Common non-work indicators:
- Social media (Facebook, Instagram, Twitter)
- Entertainment (YouTube personal content, Netflix, gaming)
- Shopping sites
- Personal email
- News and gossip sites

Respond in JSON format:
{
  "isWorkRelated": true/false,
  "confidence": 0-100,
  "reasoning": "brief explanation",
  "shouldMonitor": true/false
}`;

    return prompt;
  }

  /**
   * Parse AI context analysis response
   */
  parseContextAnalysis(aiResponse) {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const analysis = JSON.parse(jsonMatch[0]);

      return {
        isWorkRelated: Boolean(analysis.isWorkRelated),
        confidence: Math.max(0, Math.min(100, analysis.confidence || 50)),
        reasoning: analysis.reasoning || 'No reasoning provided',
        shouldMonitor: Boolean(analysis.shouldMonitor),
        source: 'ai'
      };
    } catch (error) {
      console.error('Error parsing AI context analysis:', error);
      return {
        isWorkRelated: false,
        confidence: 30,
        reasoning: 'Failed to parse AI response',
        shouldMonitor: true,
        source: 'fallback'
      };
    }
  }

  /**
   * Perform basic context analysis using heuristics
   */
  performBasicContextAnalysis(applicationData, currentTask) {
    const { url, name } = applicationData;
    const urlLower = (url || '').toLowerCase();
    const nameLower = (name || '').toLowerCase();

    // Work-related keywords
    const workKeywords = [
      'github', 'gitlab', 'bitbucket', 'stackoverflow', 'docs.', 'developer.',
      'api.', 'console.', 'dashboard', 'admin', 'portal', 'workspace',
      'slack', 'teams', 'zoom', 'meet', 'calendar', 'mail', 'email',
      'aws', 'azure', 'google cloud', 'heroku', 'vercel', 'netlify',
      'vscode', 'code', 'terminal', 'cmd', 'powershell', 'bash',
      'jira', 'trello', 'asana', 'notion', 'confluence', 'figma',
      'localhost', '127.0.0.1', 'dev.', 'staging.', 'test.'
    ];

    // Non-work keywords
    const nonWorkKeywords = [
      'facebook', 'instagram', 'twitter', 'tiktok', 'snapchat',
      'youtube.com/watch', 'netflix', 'hulu', 'disney', 'twitch',
      'amazon.com/dp', 'ebay', 'shopping', 'cart', 'checkout',
      'reddit.com/r/', 'news', 'sports', 'entertainment', 'gossip',
      'game', 'gaming', 'casino', 'bet'
    ];

    const workMatches = workKeywords.filter(keyword =>
      urlLower.includes(keyword) || nameLower.includes(keyword)
    ).length;

    const nonWorkMatches = nonWorkKeywords.filter(keyword =>
      urlLower.includes(keyword) || nameLower.includes(keyword)
    ).length;

    const isWorkRelated = workMatches > nonWorkMatches;
    const confidence = Math.min(90, Math.max(40, (Math.abs(workMatches - nonWorkMatches) + 1) * 20));

    return {
      isWorkRelated,
      confidence,
      reasoning: `Heuristic analysis: ${workMatches} work indicators, ${nonWorkMatches} non-work indicators`,
      shouldMonitor: !isWorkRelated || nonWorkMatches > 0,
      source: 'heuristic'
    };
  }

  /**
   * Decide if screenshot should be taken based on analysis
   */
  shouldTakeScreenshot(contextAnalysis, applicationData, currentTask) {
    const { isWorkRelated, confidence, shouldMonitor } = contextAnalysis;

    // High confidence work-related activity - no screenshot needed
    if (isWorkRelated && confidence > 70) {
      console.log(`✅ High confidence work activity detected: ${contextAnalysis.reasoning}`);
      return false;
    }

    // Clear non-work activity - take screenshot
    if (!isWorkRelated && confidence > 60) {
      console.log(`🚨 Non-work activity detected: ${contextAnalysis.reasoning}`);
      return true;
    }

    // AI explicitly says to monitor
    if (shouldMonitor) {
      console.log(`🔍 AI recommends monitoring: ${contextAnalysis.reasoning}`);
      return true;
    }

    // Low confidence - err on the side of caution but log reasoning
    console.log(`⚠️ Low confidence decision (${confidence}%): ${contextAnalysis.reasoning}`);
    return confidence < 50; // Only monitor if we're really unsure
  }

  /**
   * Handle unauthorized access event (only called after pre-screening approval)
   */
  async handleUnauthorizedAccess(employeeId, applicationData, whitelistResult) {
    const session = this.activeSessions.get(employeeId);
    if (!session) return;

    const now = new Date();
    
    // Check if we're in cooldown period
    if (session.lastViolationTime && 
        (now.getTime() - session.lastViolationTime.getTime()) < this.violationCooldown) {
      console.log(`Employee ${employeeId} in violation cooldown, skipping capture`);
      return;
    }

    // Start new violation session if not already active
    if (!session.currentViolationSession) {
      session.currentViolationSession = {
        startTime: now,
        applicationData,
        screenshotCount: 0,
        screenshots: [],
        aiAnalysis: []
      };
    }

    const violationSession = session.currentViolationSession;

    // Capture screenshot if under limit
    if (violationSession.screenshotCount < this.maxScreenshotsPerViolation) {
      try {
        const screenshot = await this.captureViolationScreenshot(
          employeeId, 
          applicationData, 
          violationSession
        );

        if (screenshot) {
          violationSession.screenshots.push(screenshot);
          violationSession.screenshotCount++;

          // Perform OCR and AI analysis on the screenshot
          const ocrAnalysis = await this.performOCRAnalysis(screenshot, employeeId, applicationData);
          if (ocrAnalysis) {
            violationSession.aiAnalysis.push(ocrAnalysis);

            // Check if this is actually work-related based on OCR analysis
            if (ocrAnalysis.analysis.isWorkRelated && ocrAnalysis.analysis.taskRelevance > 50) {
              console.log(`Activity determined to be work-related for employee ${employeeId}, ending violation session`);
              await this.endViolationSession(employeeId);
              return screenshot;
            }
          }

          // Create alert after first screenshot with OCR analysis
          if (violationSession.screenshotCount === 1) {
            await this.createIntelligentAlert(employeeId, applicationData, ocrAnalysis, screenshot);
          }
        }
      } catch (error) {
        console.error(`Error capturing violation screenshot for employee ${employeeId}:`, error);
      }
    }

    // End violation session if max screenshots reached
    if (violationSession.screenshotCount >= this.maxScreenshotsPerViolation) {
      await this.endViolationSession(employeeId);
    }

    session.violationCount++;
    session.lastViolationTime = now;
  }

  /**
   * Capture screenshot for violation
   */
  async captureViolationScreenshot(employeeId, applicationData, violationSession) {
    try {
      // Take screenshot
      const screenshotBuffer = await screenshot({ format: 'png' });
      
      // Calculate hash for duplicate detection
      const currentHash = crypto.createHash('md5').update(screenshotBuffer).digest('hex');
      
      // Check for duplicate screenshots in current violation session
      const isDuplicateInSession = violationSession.screenshots.some(s => s.file_hash === currentHash);
      if (isDuplicateInSession) {
        console.log(`🔄 Duplicate screenshot detected in current session for employee ${employeeId}, skipping`);
        return null;
      }

      // Check for duplicate screenshots in recent database records (last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const recentDuplicate = await ScreenCapture.findOne({
        employee: employeeId,
        file_hash: currentHash,
        timestamp: { $gte: thirtyMinutesAgo },
        'metadata.intelligent_capture': true
      });

      if (recentDuplicate) {
        console.log(`🔄 Repetitive screenshot detected for employee ${employeeId} (matches screenshot from ${recentDuplicate.timestamp}), skipping`);
        return null;
      }

      // Compress image first
      const compressedBuffer = await this.compressImage(screenshotBuffer);
      const compressionRatio = screenshotBuffer.length / compressedBuffer.length;

      // Try Cloudinary upload first, fallback to local storage
      let cloudinaryResult = null;
      let filePath = null;

      try {
        // Upload to Cloudinary with metadata
        cloudinaryResult = await uploadViolationScreenshot(compressedBuffer, employeeId, {
          violationType: 'unauthorized-access',
          application: applicationData?.name || 'unknown',
          url: applicationData?.url || 'unknown',
          aiConfidence: 85 // Default confidence for intelligent capture
        });
        console.log(`📤 Violation screenshot uploaded to Cloudinary successfully`);
      } catch (cloudinaryError) {
        console.error('⚠️ Cloudinary upload failed, falling back to local storage:', cloudinaryError.message);
      }

      // Always save locally as backup or primary storage
      const storageDir = await this.createStorageDirectory(employeeId);
      const timestamp = new Date();
      const filename = `violation_${timestamp.getTime()}_${violationSession.screenshotCount + 1}.jpg`;
      filePath = path.join(storageDir, filename);
      await fs.writeFile(filePath, compressedBuffer);

      // Get file stats for database
      const stats = await fs.stat(filePath);

      // Get screen resolution
      const screenResolution = await this.getScreenResolution();

      // Save to database with both Cloudinary and local information
      const screenCapture = new ScreenCapture({
        employee: employeeId,
        timestamp,
        file_path: filePath, // Always use local path as primary
        file_size: stats.size,
        file_hash: currentHash,
        compression_ratio: compressionRatio,
        screen_resolution: screenResolution,
        is_delta: false,
        active_application: applicationData,
        session_id: this.activeSessions.get(employeeId)?.sessionId,
        capture_trigger: 'unauthorized_access',
        is_flagged: true,
        flag_reason: 'unauthorized_website_access',
        metadata: {
          violation_session_id: `${employeeId}_${violationSession.startTime.getTime()}`,
          screenshot_sequence: violationSession.screenshotCount + 1,
          max_screenshots: this.maxScreenshotsPerViolation,
          intelligent_capture: true,
          blur_applied: false,
          privacy_level: 'full',
          // Cloudinary metadata (if upload succeeded)
          ...(cloudinaryResult && {
            cloudinary_url: cloudinaryResult.cloudinary_url,
            cloudinary_public_id: cloudinaryResult.cloudinary_public_id,
            cloudinary_version: cloudinaryResult.cloudinary_version,
            storage_type: 'hybrid', // Both local and cloudinary
          }),
          // Local storage metadata
          local_storage_enabled: true,
          encryption_key: await this.generateEncryptionKey()
        }
      });

      await screenCapture.save();

      console.log(`Violation screenshot captured for employee ${employeeId}: ${filename}`);
      return screenCapture;

    } catch (error) {
      console.error('Violation screenshot capture error:', error);
      throw error;
    }
  }

  /**
   * Perform OCR and AI analysis on screenshot
   */
  async performOCRAnalysis(screenshot, employeeId, applicationData) {
    try {
      // Perform OCR analysis with work relevance detection
      const ocrAnalysis = await ocrAnalysisService.analyzeScreenshotWithOCR(
        screenshot.file_path,
        {
          employeeId,
          applicationData,
          timestamp: screenshot.timestamp
        }
      );

      // Update screenshot metadata with OCR results
      await ScreenCapture.findByIdAndUpdate(screenshot._id, {
        $set: {
          'metadata.ocr_analysis': ocrAnalysis.ocr,
          'metadata.ai_analysis': ocrAnalysis.analysis,
          'metadata.task_context': ocrAnalysis.task,
          'metadata.monitoring_decision': ocrAnalysis.decision
        }
      });

      return ocrAnalysis;
    } catch (error) {
      console.error('OCR analysis error:', error);
      return null;
    }
  }

  /**
   * Legacy AI analysis method (kept for compatibility)
   */
  async performAIAnalysis(screenshot, employeeId) {
    try {
      // Get employee's current task for context
      const currentTask = await this.getCurrentEmployeeTask(employeeId);

      // Analyze screenshot with Groq AI
      const analysis = await groqAIService.analyzeScreenshot(
        screenshot.file_path,
        {
          employeeId,
          currentTask,
          applicationData: screenshot.active_application,
          timestamp: screenshot.timestamp
        }
      );

      return analysis;
    } catch (error) {
      console.error('AI analysis error:', error);
      return null;
    }
  }

  /**
   * Create intelligent alert with OCR and AI insights
   */
  async createIntelligentAlert(employeeId, applicationData, ocrAnalysis, screenshot) {
    try {
      const session = this.activeSessions.get(employeeId);

      let alertTitle = 'Potential Policy Violation Detected';
      let alertDescription = `Employee accessed: ${applicationData.url || applicationData.name}`;
      let severity = 'medium';

      if (ocrAnalysis && ocrAnalysis.analysis) {
        const analysis = ocrAnalysis.analysis;

        alertTitle = `${analysis.activityType.toUpperCase()}: ${analysis.activityDescription}`;
        alertDescription = `Activity: ${analysis.activityDescription}\n`;

        if (ocrAnalysis.task) {
          alertDescription += `Task Relevance: ${analysis.taskRelevance}% (Current task: "${ocrAnalysis.task.title}")\n`;
        } else {
          alertDescription += `Task Relevance: ${analysis.taskRelevance}% (No active task assigned)\n`;
        }

        alertDescription += `Productivity Level: ${analysis.productivityLevel}\n`;
        alertDescription += `AI Confidence: ${analysis.confidence}%\n`;
        alertDescription += `Reasoning: ${analysis.reasoning}`;

        // Determine severity based on analysis
        if (!analysis.isWorkRelated && analysis.taskRelevance < 30) {
          severity = 'high';
        } else if (analysis.taskRelevance < 50) {
          severity = 'medium';
        } else {
          severity = 'low';
        }
      }

      // Only create alert if the decision says we should
      if (ocrAnalysis?.decision?.shouldAlert) {
        await MonitoringAlert.createAlert({
          employee: employeeId,
          alert_type: 'unauthorized_website',
          severity,
          title: alertTitle,
          description: alertDescription,
          data: {
            website_url: applicationData.url,
            application_name: applicationData.name,
            screenshot_id: screenshot._id,
            ocr_analysis: ocrAnalysis,
            extracted_text: ocrAnalysis?.ocr?.text,
            task_context: ocrAnalysis?.task,
            monitoring_decision: ocrAnalysis?.decision,
            violation_session_start: session.currentViolationSession?.startTime,
            intelligent_monitoring: true
          },
          session_id: session.sessionId
        });
      }

    } catch (error) {
      console.error('Error creating intelligent alert:', error);
    }
  }

  /**
   * Calculate alert severity based on AI analysis
   */
  calculateAlertSeverity(aiAnalysis) {
    if (!aiAnalysis) return 'medium';
    
    const taskRelevance = aiAnalysis.taskRelevance?.score || 0;
    const contentRisk = aiAnalysis.contentRisk?.level || 'medium';
    
    if (contentRisk === 'high' || taskRelevance < 20) return 'high';
    if (contentRisk === 'medium' || taskRelevance < 50) return 'medium';
    return 'low';
  }

  /**
   * End violation session
   */
  async endViolationSession(employeeId) {
    const session = this.activeSessions.get(employeeId);
    if (!session || !session.currentViolationSession) return;

    const violationSession = session.currentViolationSession;
    violationSession.endTime = new Date();
    
    // Store violation session for reporting
    const employeeViolations = this.violationSessions.get(employeeId);
    employeeViolations.push(violationSession);
    
    // Keep only last 50 violation sessions per employee
    if (employeeViolations.length > 50) {
      employeeViolations.shift();
    }
    
    session.currentViolationSession = null;
    
    console.log(`Ended violation session for employee ${employeeId}, captured ${violationSession.screenshotCount} screenshots`);
  }

  /**
   * Check whitelist status for application/website
   */
  async checkWhitelistStatus(employeeId, applicationData) {
    try {
      const session = this.activeSessions.get(employeeId);
      if (!session) return { isWhitelisted: false, reason: 'No active session' };

      // Check cache first
      const cacheKey = applicationData.url || applicationData.name || 'unknown';
      if (session.whitelistCache.has(cacheKey)) {
        return session.whitelistCache.get(cacheKey);
      }

      // Check database
      let whitelistResult = { isWhitelisted: false, reason: 'Not in whitelist' };

      if (applicationData.url) {
        const result = await WebsiteWhitelist.isWhitelisted(applicationData.url, employeeId);
        whitelistResult = {
          isWhitelisted: result.allowed,
          reason: result.reason,
          entry: result.entry
        };
      } else if (applicationData.name) {
        // Check for application name in whitelist
        const entry = await WebsiteWhitelist.findOne({
          $or: [
            { application_name: new RegExp(applicationData.name, 'i') },
            { application_executable: new RegExp(applicationData.name, 'i') }
          ],
          is_active: true,
          approval_status: 'approved'
        });

        if (entry) {
          whitelistResult = {
            isWhitelisted: true,
            reason: 'Application whitelisted',
            entry
          };
        }
      }

      // Cache result
      session.whitelistCache.set(cacheKey, whitelistResult);
      
      return whitelistResult;
    } catch (error) {
      console.error('Error checking whitelist status:', error);
      return { isWhitelisted: false, reason: 'Error checking whitelist' };
    }
  }

  /**
   * Refresh whitelist cache for employee
   */
  async refreshWhitelistCache(employeeId) {
    const session = this.activeSessions.get(employeeId);
    if (session) {
      session.whitelistCache.clear();
    }
  }

  /**
   * Get current employee task
   */
  async getCurrentEmployeeTask(employeeId) {
    try {
      const Task = require('../models/Task');
      const currentTask = await Task.findOne({
        assignedTo: employeeId,
        status: { $in: ['pending', 'in-progress'] }
      }).sort({ createdAt: -1 });

      return currentTask ? {
        title: currentTask.title,
        description: currentTask.description,
        priority: currentTask.priority,
        dueDate: currentTask.dueDate
      } : null;
    } catch (error) {
      console.error('Error getting current employee task:', error);
      return null;
    }
  }

  // Helper methods (same as original service)
  async createStorageDirectory(employeeId) {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    const dirPath = path.join(
      this.baseStoragePath,
      employeeId.toString(),
      'intelligent_captures',
      dateStr
    );

    await fs.mkdir(dirPath, { recursive: true });
    return dirPath;
  }

  async compressImage(buffer) {
    return await sharp(buffer)
      .jpeg({ 
        quality: this.compressionQuality,
        progressive: true,
        mozjpeg: true
      })
      .toBuffer();
  }

  async getScreenResolution() {
    try {
      return { width: 1920, height: 1080 };
    } catch (error) {
      return { width: 1920, height: 1080 };
    }
  }

  async generateEncryptionKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(employeeId) {
    const session = this.activeSessions.get(employeeId);
    const violations = this.violationSessions.get(employeeId) || [];
    
    return {
      isActive: !!session,
      sessionStart: session?.startTime,
      violationCount: session?.violationCount || 0,
      lastViolation: session?.lastViolationTime,
      totalViolationSessions: violations.length,
      currentViolationActive: !!session?.currentViolationSession,
      lastActivity: session?.lastActivity
    };
  }

  /**
   * Stop all monitoring sessions
   */
  stopAllMonitoring() {
    for (const [employeeId] of this.activeSessions) {
      this.stopIntelligentMonitoring(employeeId);
    }
    console.log('Stopped all intelligent monitoring sessions');
  }
}

module.exports = new IntelligentScreenCaptureService();
