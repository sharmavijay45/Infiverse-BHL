const WebsiteWhitelist = require('../models/WebsiteWhitelist');
const MonitoringAlert = require('../models/MonitoringAlert');
const activityTracker = require('./activityTracker');
const screenCaptureService = require('./screenCapture');

class WebsiteMonitor {
  constructor() {
    // Performance optimization: configurable intervals
    this.monitoringInterval = parseInt(process.env.WEBSITE_MONITORING_INTERVAL) || 8000; // 8 seconds default (optimized)
    this.browserCheckInterval = parseInt(process.env.BROWSER_CHECK_INTERVAL) || 5000; // 5 seconds for browser detection
    this.activityFlushInterval = parseInt(process.env.ACTIVITY_FLUSH_INTERVAL) || 30000; // 30 seconds for activity flushing

    this.activeSessions = new Map();
    this.urlHistory = new Map(); // Track URL history per employee
    this.suspiciousPatterns = [
      /facebook\.com/i,
      /twitter\.com/i,
      /instagram\.com/i,
      /youtube\.com\/watch/i,
      /reddit\.com/i,
      /tiktok\.com/i,
      /netflix\.com/i,
      /gaming/i,
      /entertainment/i
    ];

    // Cross-platform compatibility
    this.platform = process.platform;
    this.isWindows = this.platform === 'win32';
    this.isLinux = this.platform === 'linux';
    this.isMacOS = this.platform === 'darwin';

    // Whitelisted domains for work activities
    this.whitelistedDomains = [
      'main-workflow.vercel.app',
      'github.com',
      'stackoverflow.com',
      'render.com',
      'vercel.com',
      'chatgpt.com',
      'grok.com',
      'localhost'
    ];

    // Performance optimization: caching and rate limiting
    this.browserCache = new Map(); // Cache browser detection results
    this.cacheTimeout = 2000; // Cache results for 2 seconds
    this.lastBrowserCheck = new Map(); // Track last check time per employee
    this.rateLimitDelay = 1000; // Minimum 1 second between checks

    console.log(`🖥️ Platform: ${this.platform}, Monitoring interval: ${this.monitoringInterval}ms, Browser check: ${this.browserCheckInterval}ms`);
    console.log(`✅ Browser monitoring and screenshots: ENABLED (Cross-platform support with buildpacks)`);

    // Start cache cleanup process
    this.startCacheCleanup();
  }

  /**
   * Start website monitoring for an employee
   */
  startMonitoring(employeeId, sessionId) {
    if (this.activeSessions.has(employeeId)) {
      console.log(`Website monitoring already active for employee ${employeeId}`);
      return;
    }



    console.log(`Starting website monitoring for employee ${employeeId}`);

    const sessionData = {
      employeeId,
      sessionId,
      currentUrl: null,
      currentTitle: null,
      currentApplication: null,
      urlStartTime: null,
      dailyUsage: new Map(), // domain -> total time
      intervalId: null,
      lastCheck: new Date()
    };

    // Set up monitoring interval with performance optimization
    sessionData.intervalId = setInterval(async () => {
      try {
        await this.checkCurrentActivity(sessionData);
      } catch (error) {
        console.error(`Website monitoring error for employee ${employeeId}:`, error);
      }
    }, this.browserCheckInterval); // Use optimized browser check interval

    this.activeSessions.set(employeeId, sessionData);

    // Initialize URL history for this employee
    if (!this.urlHistory.has(employeeId)) {
      this.urlHistory.set(employeeId, []);
    }

    console.log(`🌐 Website monitoring enabled with real browser detection`);
  }

  /**
   * Stop website monitoring for an employee
   */
  stopMonitoring(employeeId) {
    const session = this.activeSessions.get(employeeId);
    if (session) {
      clearInterval(session.intervalId);

      // Record final URL session if active
      if (session.currentUrl && session.urlStartTime) {
        this.recordUrlSession(session);
      }

      // Clean up caches to prevent memory leaks
      this.cleanupEmployeeCache(employeeId);

      this.activeSessions.delete(employeeId);
      console.log(`Stopped website monitoring for employee ${employeeId}`);
    }
  }

  /**
   * Clean up cache entries for a specific employee
   */
  cleanupEmployeeCache(employeeId) {
    const cacheKey = `browser_${employeeId}`;
    this.browserCache.delete(cacheKey);
    this.browserCache.delete(`${cacheKey}_last`);
    this.lastBrowserCheck.delete(employeeId);
  }

  /**
   * Periodic cache cleanup to prevent memory leaks
   */
  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      const expiredKeys = [];

      for (const [key, value] of this.browserCache.entries()) {
        if (value.timestamp && now - value.timestamp > this.cacheTimeout * 10) { // Keep for 10x cache timeout
          expiredKeys.push(key);
        }
      }

      expiredKeys.forEach(key => this.browserCache.delete(key));

      if (expiredKeys.length > 0) {
        console.log(`🧹 Cleaned up ${expiredKeys.length} expired cache entries`);
      }
    }, 60000); // Run cleanup every minute
  }

  /**
   * Check current browser/application activity with performance optimization
   */
  async checkCurrentActivity(sessionData) {
    try {
      // Use employee-specific caching for better performance
      const currentActivity = await this.getCurrentBrowserActivity(sessionData.employeeId);
      
      if (!currentActivity) return;

      const { url, title, application } = currentActivity;
      
      // Check if URL has changed
      if (url !== sessionData.currentUrl) {
        // Record previous URL session
        if (sessionData.currentUrl && sessionData.urlStartTime) {
          await this.recordUrlSession(sessionData);
        }
        
        // Start new URL session
        sessionData.currentUrl = url;
        sessionData.currentTitle = title;
        sessionData.currentApplication = application;
        sessionData.urlStartTime = new Date();
        
        // Add to URL history
        this.addToUrlHistory(sessionData.employeeId, {
          url,
          title,
          application,
          timestamp: new Date()
        });
        
        // Check whitelist and create alerts if needed
        await this.checkUrlCompliance(sessionData, url, title, application);
        
        // Notify activity tracker of application change
        await activityTracker.recordApplicationChange(sessionData.employeeId, {
          name: application,
          title,
          url
        });
      }
      
      sessionData.lastCheck = new Date();
      
    } catch (error) {
      console.error('Error checking current activity:', error);
    }
  }

  /**
   * Get current browser activity with performance optimization
   */
  async getCurrentBrowserActivity(employeeId = 'default') {
    try {
      const now = Date.now();
      const cacheKey = `browser_${employeeId}`;

      // Rate limiting: check if enough time has passed since last check
      const lastCheck = this.lastBrowserCheck.get(employeeId) || 0;
      if (now - lastCheck < this.rateLimitDelay) {
        // Return cached result if available
        const cached = this.browserCache.get(cacheKey);
        if (cached && now - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
        return null; // Skip check if too frequent
      }

      // Update last check time
      this.lastBrowserCheck.set(employeeId, now);

      // Get the active window information using cross-platform detection
      const activeWindow = await this.getActiveWindow();

      if (!activeWindow || !activeWindow.title) {
        // Cache null result
        this.browserCache.set(cacheKey, { data: null, timestamp: now });
        return null;
      }

      // Extract URL from browser windows
      const browserInfo = this.extractBrowserInfo(activeWindow);

      if (browserInfo) {
        // Cache successful result
        this.browserCache.set(cacheKey, { data: browserInfo, timestamp: now });

        // Log only significant changes to reduce noise
        const lastResult = this.browserCache.get(`${cacheKey}_last`);
        if (!lastResult || lastResult.url !== browserInfo.url || lastResult.title !== browserInfo.title) {
          console.log(`🌐 Browser activity: ${browserInfo.url || browserInfo.title} (${browserInfo.application})`);
          this.browserCache.set(`${cacheKey}_last`, browserInfo);
        }

        return browserInfo;
      }

      // Cache null result
      this.browserCache.set(cacheKey, { data: null, timestamp: now });
      return null;

    } catch (error) {
      console.error('Error getting current browser activity:', error);
      return null;
    }
  }



  /**
   * Get active window information with cross-platform support
   */
  async getActiveWindow() {
    try {
      if (this.isWindows) {
        return await this.getActiveWindowWindows();
      } else if (this.isLinux) {
        return await this.getActiveWindowLinux();
      } else if (this.isMacOS) {
        return await this.getActiveWindowMacOS();
      } else {
        console.warn(`⚠️ Unsupported platform: ${this.platform}, using fallback method`);
        return await this.getActiveWindowFallback();
      }
    } catch (error) {
      console.error('Error getting active window:', error);
      return await this.getActiveWindowFallback();
    }
  }

  /**
   * Windows-specific browser detection
   */
  async getActiveWindowWindows() {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      // Use tasklist to get running processes with window titles
      const { stdout } = await execAsync('tasklist /fo csv /v');
      const lines = stdout.split('\n');

      // Parse CSV output and find browser processes
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split('","').map(col => col.replace(/"/g, ''));
        if (columns.length >= 9) {
          const processName = columns[0];
          const windowTitle = columns[8];

          // Check if it's a browser process with a meaningful title
          if (this.isBrowserProcess(processName) && windowTitle && windowTitle !== 'N/A') {
            return {
              title: windowTitle,
              application: processName
            };
          }
        }
      }

      return null;

    } catch (error) {
      console.error('Error getting Windows active window:', error);
      return null;
    }
  }

  /**
   * Linux-specific browser detection
   */
  async getActiveWindowLinux() {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      // Try multiple Linux methods
      try {
        // Method 1: Use xdotool (if available)
        const { stdout: activeWindow } = await execAsync('xdotool getactivewindow getwindowname 2>/dev/null');
        const windowTitle = activeWindow.trim();

        if (windowTitle) {
          // Get process info
          const { stdout: processInfo } = await execAsync('ps aux | grep -E "(chrome|firefox|chromium)" | grep -v grep | head -1');
          const processName = this.extractProcessNameLinux(processInfo);

          if (this.isBrowserProcessLinux(processName)) {
            return {
              title: windowTitle,
              application: processName
            };
          }
        }
      } catch (xdotoolError) {
        // Method 2: Use wmctrl (fallback)
        try {
          const { stdout } = await execAsync('wmctrl -l | head -1');
          const windowInfo = stdout.trim().split(/\s+/).slice(3).join(' ');

          if (windowInfo && this.containsBrowserKeywords(windowInfo)) {
            return {
              title: windowInfo,
              application: 'browser'
            };
          }
        } catch (wmctrlError) {
          console.warn('⚠️ Neither xdotool nor wmctrl available on Linux system');
        }
      }

      return null;

    } catch (error) {
      console.error('Error getting Linux active window:', error);
      return null;
    }
  }

  /**
   * macOS-specific browser detection
   */
  async getActiveWindowMacOS() {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      // Use AppleScript to get active window
      const script = `
        tell application "System Events"
          set frontApp to name of first application process whose frontmost is true
          set frontWindow to name of front window of first application process whose frontmost is true
          return frontApp & "|" & frontWindow
        end tell
      `;

      const { stdout } = await execAsync(`osascript -e '${script}'`);
      const [appName, windowTitle] = stdout.trim().split('|');

      if (this.isBrowserProcessMacOS(appName) && windowTitle) {
        return {
          title: windowTitle,
          application: appName
        };
      }

      return null;

    } catch (error) {
      console.error('Error getting macOS active window:', error);
      return null;
    }
  }

  /**
   * Fallback method for unsupported platforms or when primary methods fail
   */
  async getActiveWindowFallback() {
    try {
      // Return null to disable browser monitoring on unsupported platforms
      // This prevents the system from crashing in production
      console.log('🔄 Using fallback method - browser monitoring disabled for this platform');
      return null;
    } catch (error) {
      console.error('Error in fallback method:', error);
      return null;
    }
  }

  /**
   * Check if process is a browser (Windows)
   */
  isBrowserProcess(processName) {
    const browserProcesses = ['chrome.exe', 'firefox.exe', 'msedge.exe', 'opera.exe', 'brave.exe', 'iexplore.exe'];
    return browserProcesses.some(browser => processName.toLowerCase().includes(browser.toLowerCase()));
  }

  /**
   * Check if process is a browser (Linux)
   */
  isBrowserProcessLinux(processName) {
    const browserProcesses = ['chrome', 'firefox', 'chromium', 'opera', 'brave'];
    return browserProcesses.some(browser => processName.toLowerCase().includes(browser));
  }

  /**
   * Check if process is a browser (macOS)
   */
  isBrowserProcessMacOS(appName) {
    const browserApps = ['Google Chrome', 'Firefox', 'Safari', 'Opera', 'Brave Browser', 'Microsoft Edge'];
    return browserApps.some(browser => appName.includes(browser));
  }

  /**
   * Extract process name from Linux ps output
   */
  extractProcessNameLinux(processInfo) {
    try {
      const parts = processInfo.trim().split(/\s+/);
      return parts[parts.length - 1] || '';
    } catch (error) {
      return '';
    }
  }

  /**
   * Check if window title contains browser keywords
   */
  containsBrowserKeywords(windowTitle) {
    const browserKeywords = ['chrome', 'firefox', 'browser', 'mozilla', 'safari', 'edge'];
    return browserKeywords.some(keyword => windowTitle.toLowerCase().includes(keyword));
  }

  /**
   * Extract browser information from window data
   */
  extractBrowserInfo(windowInfo) {
    try {
      const browserProcesses = ['chrome', 'firefox', 'msedge', 'opera', 'brave', 'iexplore'];
      const processName = windowInfo.application?.toLowerCase();
      const title = windowInfo.title || '';

      // Check if it's a browser process
      const isBrowser = browserProcesses.some(browser => processName?.includes(browser));

      if (!isBrowser) {
        return null;
      }

      // Extract URL or site information from browser title
      const siteInfo = this.extractSiteFromTitle(title, processName);

      return {
        url: siteInfo.url,
        title: siteInfo.cleanTitle,
        application: this.getBrowserDisplayName(processName)
      };

    } catch (error) {
      console.error('Error extracting browser info:', error);
      return null;
    }
  }

  /**
   * Extract site information from browser title
   */
  extractSiteFromTitle(title, processName) {
    try {
      // Remove browser suffix from title
      const cleanTitle = title
        .replace(/ - Google Chrome$/, '')
        .replace(/ - Mozilla Firefox$/, '')
        .replace(/ - Microsoft Edge$/, '')
        .replace(/ - Opera$/, '')
        .replace(/ - Brave$/, '')
        .replace(/ - Internet Explorer$/, '');

      // Check for direct URL in title (some sites show URLs)
      const urlMatch = title.match(/https?:\/\/[^\s\-]+/);
      if (urlMatch) {
        return {
          url: urlMatch[0],
          cleanTitle: cleanTitle
        };
      }

      // Map common site patterns to URLs
      const sitePatterns = {
        'facebook': 'https://facebook.com',
        'youtube': 'https://youtube.com',
        'github': 'https://github.com',
        'stack overflow': 'https://stackoverflow.com',
        'google docs': 'https://docs.google.com',
        'gmail': 'https://gmail.com',
        'linkedin': 'https://linkedin.com',
        'twitter': 'https://twitter.com',
        'instagram': 'https://instagram.com',
        'reddit': 'https://reddit.com',
        'amazon': 'https://amazon.com',
        'netflix': 'https://netflix.com',
        'discord': 'https://discord.com',
        'slack': 'https://slack.com',
        'teams': 'https://teams.microsoft.com',
        'zoom': 'https://zoom.us'
      };

      // Check if title contains any known site names
      const lowerTitle = cleanTitle.toLowerCase();
      for (const [siteName, siteUrl] of Object.entries(sitePatterns)) {
        if (lowerTitle.includes(siteName)) {
          return {
            url: siteUrl,
            cleanTitle: cleanTitle
          };
        }
      }

      // If no specific site detected, return generic info
      return {
        url: null,
        cleanTitle: cleanTitle
      };

    } catch (error) {
      console.error('Error extracting site from title:', error);
      return {
        url: null,
        cleanTitle: title
      };
    }
  }

  /**
   * Get display name for browser
   */
  getBrowserDisplayName(processName) {
    const browserNames = {
      'chrome': 'Google Chrome',
      'firefox': 'Mozilla Firefox',
      'msedge': 'Microsoft Edge',
      'opera': 'Opera',
      'brave': 'Brave Browser',
      'iexplore': 'Internet Explorer'
    };

    const lowerProcess = processName?.toLowerCase() || '';
    for (const [process, displayName] of Object.entries(browserNames)) {
      if (lowerProcess.includes(process)) {
        return displayName;
      }
    }

    return processName || 'Unknown Browser';
  }

  /**
   * Check URL compliance against whitelist
   */
  async checkUrlCompliance(sessionData, url, title, application) {
    try {
      const whitelistCheck = await WebsiteWhitelist.isWhitelisted(url, sessionData.employeeId);
      
      if (!whitelistCheck.allowed) {
        // Create alert for unauthorized website
        await MonitoringAlert.createAlert({
          employee: sessionData.employeeId,
          alert_type: 'unauthorized_website',
          severity: this.calculateSeverity(url),
          title: 'Unauthorized Website Access',
          description: `Employee accessed non-whitelisted website: ${url}`,
          data: {
            website_url: url,
            website_title: title,
            application_name: application,
            whitelist_reason: whitelistCheck.reason
          },
          session_id: sessionData.sessionId
        });

        // Trigger immediate screenshot for unauthorized sites
        await screenCaptureService.triggerCapture(
          sessionData.employeeId,
          sessionData.sessionId,
          'unauthorized_site',
          {
            active_application: { name: application, title, url },
            is_flagged: true,
            flag_reason: 'unauthorized_website'
          }
        );
      } else if (whitelistCheck.entry && whitelistCheck.entry.auto_screenshot) {
        // Take screenshot for monitored whitelisted sites
        await screenCaptureService.triggerCapture(
          sessionData.employeeId,
          sessionData.sessionId,
          'activity_change',
          {
            active_application: { name: application, title, url },
            monitoring_level: whitelistCheck.monitoring_level
          }
        );
      }
      
      // Check for suspicious patterns
      await this.checkSuspiciousPatterns(sessionData, url, title);
      
    } catch (error) {
      console.error('Error checking URL compliance:', error);
    }
  }

  /**
   * Check for suspicious URL patterns
   */
  async checkSuspiciousPatterns(sessionData, url, title) {
    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(url) || pattern.test(title)) {
        await MonitoringAlert.createAlert({
          employee: sessionData.employeeId,
          alert_type: 'suspicious_activity',
          severity: 'medium',
          title: 'Suspicious Website Pattern Detected',
          description: `Employee accessed website matching suspicious pattern: ${url}`,
          data: {
            website_url: url,
            website_title: title,
            pattern_matched: pattern.toString()
          },
          session_id: sessionData.sessionId
        });
        break;
      }
    }
  }

  /**
   * Calculate alert severity based on URL
   */
  calculateSeverity(url) {
    // High severity for known problematic sites
    const highRiskPatterns = [/gambling/i, /adult/i, /torrent/i, /piracy/i];
    const mediumRiskPatterns = [/social/i, /entertainment/i, /gaming/i];
    
    for (const pattern of highRiskPatterns) {
      if (pattern.test(url)) return 'high';
    }
    
    for (const pattern of mediumRiskPatterns) {
      if (pattern.test(url)) return 'medium';
    }
    
    return 'low';
  }

  /**
   * Record URL session duration
   */
  async recordUrlSession(sessionData) {
    if (!sessionData.urlStartTime) return;
    
    const sessionDuration = Date.now() - sessionData.urlStartTime.getTime();
    const domain = this.extractDomain(sessionData.currentUrl);
    
    // Update daily usage tracking
    const currentUsage = sessionData.dailyUsage.get(domain) || 0;
    sessionData.dailyUsage.set(domain, currentUsage + sessionDuration);
    
    // Check for excessive usage
    const totalDailyUsage = sessionData.dailyUsage.get(domain);
    const maxDailyUsage = 2 * 60 * 60 * 1000; // 2 hours
    
    if (totalDailyUsage > maxDailyUsage) {
      await MonitoringAlert.createAlert({
        employee: sessionData.employeeId,
        alert_type: 'application_misuse',
        severity: 'medium',
        title: 'Excessive Website Usage',
        description: `Employee spent more than 2 hours on ${domain} today`,
        data: {
          domain,
          total_usage_minutes: Math.round(totalDailyUsage / 60000),
          session_duration_minutes: Math.round(sessionDuration / 60000)
        },
        session_id: sessionData.sessionId
      });
    }
  }

  /**
   * Add URL to history tracking
   */
  addToUrlHistory(employeeId, urlData) {
    const history = this.urlHistory.get(employeeId);
    history.push(urlData);
    
    // Keep only last 100 URLs
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  }

  /**
   * Get URL history for employee
   */
  getUrlHistory(employeeId, limit = 50) {
    const history = this.urlHistory.get(employeeId) || [];
    return history.slice(-limit).reverse();
  }

  /**
   * Get daily usage statistics
   */
  getDailyUsage(employeeId) {
    const session = this.activeSessions.get(employeeId);
    if (!session) return {};
    
    const usage = {};
    for (const [domain, time] of session.dailyUsage) {
      usage[domain] = {
        total_minutes: Math.round(time / 60000),
        percentage: Math.round((time / (8 * 60 * 60 * 1000)) * 100) // Percentage of 8-hour workday
      };
    }
    
    return usage;
  }

  /**
   * Get current monitoring status
   */
  getMonitoringStatus(employeeId) {
    const session = this.activeSessions.get(employeeId);
    if (!session) {
      return { active: false, message: 'Not monitoring' };
    }
    
    return {
      active: true,
      currentUrl: session.currentUrl,
      currentTitle: session.currentTitle,
      currentApplication: session.currentApplication,
      sessionStartTime: session.urlStartTime,
      lastCheck: session.lastCheck,
      dailyUsage: this.getDailyUsage(employeeId)
    };
  }

  /**
   * Manually add website to whitelist
   */
  async addToWhitelist(domain, category, description, addedBy) {
    const whitelistEntry = new WebsiteWhitelist({
      domain: domain.toLowerCase(),
      category,
      description,
      added_by: addedBy,
      approval_status: 'pending'
    });
    
    return await whitelistEntry.save();
  }

  /**
   * Stop all monitoring sessions (for shutdown)
   */
  stopAllMonitoring() {
    for (const [employeeId, session] of this.activeSessions) {
      clearInterval(session.intervalId);
      
      // Record final URL session
      if (session.currentUrl && session.urlStartTime) {
        this.recordUrlSession(session);
      }
    }
    
    this.activeSessions.clear();
    this.urlHistory.clear();
    
    console.log('Stopped all website monitoring sessions');
  }
}

module.exports = new WebsiteMonitor();
