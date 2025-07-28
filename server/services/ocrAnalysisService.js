const Tesseract = require('tesseract.js');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

class OCRAnalysisService {
  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY;
    this.groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    this.groqModel = process.env.GROQ_MODEL || 'llama3-8b-8192';
    this.ocrWorker = null;
    this.initializeOCR();
  }

  /**
   * Initialize Tesseract OCR worker
   */
  async initializeOCR() {
    try {
      this.ocrWorker = await Tesseract.createWorker('eng');
      console.log('OCR worker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
    }
  }

  /**
   * Extract text from screenshot using OCR
   */
  async extractTextFromScreenshot(imagePath) {
    try {
      if (!this.ocrWorker) {
        await this.initializeOCR();
      }

      const { data: { text, confidence } } = await this.ocrWorker.recognize(imagePath);
      
      return {
        text: text.trim(),
        confidence: Math.round(confidence),
        extractedAt: new Date(),
        success: true
      };
    } catch (error) {
      console.error('OCR text extraction error:', error);
      return {
        text: '',
        confidence: 0,
        extractedAt: new Date(),
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze screenshot with OCR and AI for work relevance
   */
  async analyzeScreenshotWithOCR(imagePath, context = {}) {
    try {
      // Step 1: Extract text using OCR
      const ocrResult = await this.extractTextFromScreenshot(imagePath);
      
      // Step 2: Get current employee task
      const currentTask = await this.getCurrentEmployeeTask(context.employeeId);
      
      // Step 3: Analyze with AI for work relevance
      const aiAnalysis = await this.analyzeWorkRelevance(
        ocrResult.text, 
        context, 
        currentTask
      );

      // Step 4: Combine results
      const combinedAnalysis = {
        ocr: ocrResult,
        task: currentTask,
        analysis: aiAnalysis,
        decision: this.makeMonitoringDecision(aiAnalysis, currentTask),
        timestamp: new Date(),
        context
      };

      return combinedAnalysis;
    } catch (error) {
      console.error('Screenshot analysis error:', error);
      return this.createFallbackAnalysis(context);
    }
  }

  /**
   * Analyze work relevance using AI
   */
  async analyzeWorkRelevance(extractedText, context, currentTask) {
    if (!this.groqApiKey || !extractedText.trim()) {
      return this.createBasicAnalysis(extractedText, context, currentTask);
    }

    try {
      const prompt = this.buildWorkRelevancePrompt(extractedText, context, currentTask);
      
      const response = await axios.post(this.groqApiUrl, {
        model: this.groqModel,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.2
      }, {
        headers: {
          'Authorization': `Bearer ${this.groqApiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });

      const aiResponse = response.data.choices[0]?.message?.content;
      return this.parseAIAnalysis(aiResponse, extractedText, currentTask);
      
    } catch (error) {
      console.error('AI analysis error:', error);
      return this.createBasicAnalysis(extractedText, context, currentTask);
    }
  }

  /**
   * Build AI prompt for work relevance analysis
   */
  buildWorkRelevancePrompt(extractedText, context, currentTask) {
    const { applicationData, employeeId } = context;
    
    let prompt = `Analyze the following text extracted from an employee's computer screen to determine if the activity is work-related.

EXTRACTED TEXT:
"${extractedText}"

CONTEXT:
- Website/Application: ${applicationData?.url || applicationData?.name || 'Unknown'}
- Employee ID: ${employeeId}`;

    if (currentTask) {
      prompt += `
- Current Assigned Task: "${currentTask.title}"
- Task Description: "${currentTask.description}"
- Task Priority: ${currentTask.priority}
- Due Date: ${currentTask.dueDate ? new Date(currentTask.dueDate).toLocaleDateString() : 'Not set'}`;
    } else {
      prompt += `
- Current Assigned Task: No active task assigned`;
    }

    prompt += `

ANALYSIS REQUIREMENTS:
1. Determine if the content is work-related based on the extracted text
2. Calculate relevance to the assigned task (0-100%)
3. Identify the type of activity (coding, research, communication, entertainment, etc.)
4. Assess productivity level (high/medium/low)
5. Determine if monitoring alert should be triggered

Respond in this exact JSON format:
{
  "isWorkRelated": true/false,
  "taskRelevance": 0-100,
  "activityType": "coding/research/communication/entertainment/social_media/shopping/other",
  "activityDescription": "Brief description of what the user is doing",
  "productivityLevel": "high/medium/low",
  "shouldAlert": true/false,
  "alertReason": "Reason for alert or null if no alert",
  "keyIndicators": ["list", "of", "key", "words", "or", "phrases"],
  "confidence": 0-100,
  "reasoning": "Explanation of the analysis"
}`;

    return prompt;
  }

  /**
   * Parse AI analysis response
   */
  parseAIAnalysis(aiResponse, extractedText, currentTask) {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize
      return {
        isWorkRelated: Boolean(analysis.isWorkRelated),
        taskRelevance: Math.max(0, Math.min(100, analysis.taskRelevance || 0)),
        activityType: analysis.activityType || 'other',
        activityDescription: analysis.activityDescription || 'Unable to determine activity',
        productivityLevel: ['high', 'medium', 'low'].includes(analysis.productivityLevel) 
          ? analysis.productivityLevel : 'medium',
        shouldAlert: Boolean(analysis.shouldAlert),
        alertReason: analysis.alertReason || null,
        keyIndicators: Array.isArray(analysis.keyIndicators) 
          ? analysis.keyIndicators.slice(0, 10) : [],
        confidence: Math.max(0, Math.min(100, analysis.confidence || 50)),
        reasoning: analysis.reasoning || 'No reasoning provided',
        aiModel: this.groqModel,
        analyzedAt: new Date()
      };
    } catch (error) {
      console.error('Error parsing AI analysis:', error);
      return this.createBasicAnalysis(extractedText, {}, currentTask);
    }
  }

  /**
   * Create basic analysis when AI is unavailable
   */
  createBasicAnalysis(extractedText, context, currentTask) {
    const workKeywords = [
      'code', 'programming', 'development', 'bug', 'feature', 'project',
      'meeting', 'email', 'document', 'report', 'analysis', 'design',
      'database', 'api', 'frontend', 'backend', 'testing', 'deployment'
    ];

    const nonWorkKeywords = [
      'facebook', 'instagram', 'twitter', 'youtube', 'netflix', 'gaming',
      'shopping', 'cart', 'buy', 'purchase', 'entertainment', 'music',
      'video', 'movie', 'social', 'chat', 'personal'
    ];

    const text = extractedText.toLowerCase();
    const workMatches = workKeywords.filter(keyword => text.includes(keyword)).length;
    const nonWorkMatches = nonWorkKeywords.filter(keyword => text.includes(keyword)).length;

    const isWorkRelated = workMatches > nonWorkMatches;
    const taskRelevance = currentTask && isWorkRelated ? 60 : 20;

    return {
      isWorkRelated,
      taskRelevance,
      activityType: isWorkRelated ? 'work' : 'personal',
      activityDescription: `Activity detected with ${workMatches} work-related and ${nonWorkMatches} personal indicators`,
      productivityLevel: isWorkRelated ? 'medium' : 'low',
      shouldAlert: !isWorkRelated,
      alertReason: !isWorkRelated ? 'Non-work-related activity detected' : null,
      keyIndicators: [...workKeywords.filter(k => text.includes(k)), ...nonWorkKeywords.filter(k => text.includes(k))],
      confidence: 40,
      reasoning: 'Basic keyword-based analysis (AI unavailable)',
      aiModel: 'fallback',
      analyzedAt: new Date()
    };
  }

  /**
   * Make monitoring decision based on analysis
   */
  makeMonitoringDecision(analysis, currentTask) {
    const decision = {
      shouldCapture: false,
      shouldAlert: false,
      alertLevel: 'none', // none, low, medium, high
      reason: '',
      action: 'continue' // continue, warn, alert, block
    };

    if (!analysis.isWorkRelated) {
      decision.shouldCapture = true;
      decision.shouldAlert = true;
      decision.alertLevel = 'medium';
      decision.reason = 'Non-work-related activity detected';
      decision.action = 'alert';
    } else if (currentTask && analysis.taskRelevance < 30) {
      decision.shouldCapture = true;
      decision.shouldAlert = true;
      decision.alertLevel = 'low';
      decision.reason = 'Low relevance to assigned task';
      decision.action = 'warn';
    } else if (analysis.productivityLevel === 'low') {
      decision.shouldCapture = true;
      decision.shouldAlert = false;
      decision.alertLevel = 'low';
      decision.reason = 'Low productivity activity';
      decision.action = 'continue';
    }

    return decision;
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
        id: currentTask._id,
        title: currentTask.title,
        description: currentTask.description,
        priority: currentTask.priority,
        dueDate: currentTask.dueDate,
        status: currentTask.status,
        assignedAt: currentTask.createdAt
      } : null;
    } catch (error) {
      console.error('Error getting current employee task:', error);
      return null;
    }
  }

  /**
   * Create fallback analysis for errors
   */
  createFallbackAnalysis(context) {
    return {
      ocr: {
        text: '',
        confidence: 0,
        extractedAt: new Date(),
        success: false,
        error: 'OCR analysis failed'
      },
      task: null,
      analysis: {
        isWorkRelated: false,
        taskRelevance: 0,
        activityType: 'unknown',
        activityDescription: 'Unable to analyze activity',
        productivityLevel: 'medium',
        shouldAlert: true,
        alertReason: 'Analysis failed - manual review required',
        keyIndicators: [],
        confidence: 10,
        reasoning: 'Fallback analysis due to system error',
        aiModel: 'fallback',
        analyzedAt: new Date()
      },
      decision: {
        shouldCapture: true,
        shouldAlert: true,
        alertLevel: 'medium',
        reason: 'Analysis system unavailable',
        action: 'alert'
      },
      timestamp: new Date(),
      context
    };
  }

  /**
   * Cleanup OCR worker
   */
  async cleanup() {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
      console.log('OCR worker terminated');
    }
  }

  /**
   * Get OCR statistics
   */
  getOCRStats() {
    return {
      workerInitialized: !!this.ocrWorker,
      aiEnabled: !!this.groqApiKey,
      model: this.groqModel
    };
  }
}

module.exports = new OCRAnalysisService();
