const EmployeeActivity = require('../models/EmployeeActivity');
const MonitoringAlert = require('../models/MonitoringAlert');
const WebsiteWhitelist = require('../models/WebsiteWhitelist');
const screenCaptureService = require('./screenCapture');
const intelligentScreenCapture = require('./intelligentScreenCapture');
const { KeystrokeAnalyticsService } = require('./keystrokeAnalytics');

class ActivityTracker {
  constructor() {
    this.trackingInterval = parseInt(process.env.ACTIVITY_TRACKING_INTERVAL) || 60000; // 1 minute
    this.idleThreshold = parseInt(process.env.IDLE_THRESHOLD) || 900000; // 15 minutes
    this.activeSessions = new Map();
    this.activityBuffer = new Map(); // Buffer activities before saving
    this.bufferFlushInterval = 30000; // Flush buffer every 30 seconds
    this.keystrokeService = new KeystrokeAnalyticsService();

    // Start buffer flush interval
    setInterval(() => this.flushActivityBuffer(), this.bufferFlushInterval);
  }

  /**
   * Start activity tracking for an employee
   */
  startTracking(employeeId, sessionId, workHours = null, useIntelligentCapture = true) {
    if (this.activeSessions.has(employeeId)) {
      console.log(`Activity tracking already active for employee ${employeeId}`);
      return;
    }

    console.log(`Starting activity tracking for employee ${employeeId}`);

    const sessionData = {
      employeeId,
      sessionId,
      workHours,
      startTime: new Date(),
      lastActivity: new Date(),
      keystrokeCount: 0,
      mouseActivityScore: 0,
      currentApplication: null,
      idleStartTime: null,
      totalIdleTime: 0,
      intervalId: null,
      useIntelligentCapture
    };

    // Set up tracking interval
    sessionData.intervalId = setInterval(async () => {
      try {
        await this.recordActivity(sessionData);
      } catch (error) {
        console.error(`Activity tracking error for employee ${employeeId}:`, error);
      }
    }, this.trackingInterval);

    this.activeSessions.set(employeeId, sessionData);

    // Initialize activity buffer for this employee
    if (!this.activityBuffer.has(employeeId)) {
      this.activityBuffer.set(employeeId, []);
    }

    // Start intelligent screen capture if enabled
    if (useIntelligentCapture) {
      intelligentScreenCapture.startIntelligentMonitoring(employeeId, sessionId);
    }

    // Start keystroke tracking
    this.keystrokeService.startKeystrokeTracking(employeeId, sessionId);
  }

  /**
   * Stop activity tracking for an employee
   */
  stopTracking(employeeId) {
    const session = this.activeSessions.get(employeeId);
    if (session) {
      clearInterval(session.intervalId);

      // Flush any remaining buffered activities
      this.flushEmployeeBuffer(employeeId);

      // Stop intelligent screen capture if it was enabled
      if (session.useIntelligentCapture) {
        intelligentScreenCapture.stopIntelligentMonitoring(employeeId);
      }

      // Stop keystroke tracking
      this.keystrokeService.stopKeystrokeTracking(employeeId);

      this.activeSessions.delete(employeeId);
      this.activityBuffer.delete(employeeId);

      console.log(`Stopped activity tracking for employee ${employeeId}`);
    }
  }

  /**
   * Record keystroke activity
   */
  recordKeystroke(employeeId, count = 1) {
    const session = this.activeSessions.get(employeeId);
    if (session) {
      session.keystrokeCount += count;
      session.lastActivity = new Date();
      
      // Reset idle timer if was idle
      if (session.idleStartTime) {
        session.totalIdleTime += Date.now() - session.idleStartTime.getTime();
        session.idleStartTime = null;
      }
    }
  }

  /**
   * Record mouse activity
   */
  recordMouseActivity(employeeId, activityScore) {
    const session = this.activeSessions.get(employeeId);
    if (session) {
      // Update mouse activity score (weighted average)
      session.mouseActivityScore = Math.round(
        (session.mouseActivityScore * 0.7) + (activityScore * 0.3)
      );
      session.lastActivity = new Date();
      
      // Reset idle timer if was idle
      if (session.idleStartTime) {
        session.totalIdleTime += Date.now() - session.idleStartTime.getTime();
        session.idleStartTime = null;
      }
    }
  }

  /**
   * Record application/website change
   */
  async recordApplicationChange(employeeId, applicationData) {
    const session = this.activeSessions.get(employeeId);
    if (session) {
      session.currentApplication = applicationData;
      session.lastActivity = new Date();

      // Use intelligent capture if enabled, otherwise fall back to old system
      if (session.useIntelligentCapture) {
        // Let intelligent screen capture handle the analysis and alerts
        await intelligentScreenCapture.handleApplicationChange(employeeId, applicationData);
      } else {
        // Legacy behavior for backward compatibility
        await this.handleLegacyApplicationChange(employeeId, applicationData, session);
      }
    }
  }

  /**
   * Legacy application change handling (for backward compatibility)
   */
  async handleLegacyApplicationChange(employeeId, applicationData, session) {
    // Check if website is whitelisted
    if (applicationData.url) {
      const whitelistCheck = await WebsiteWhitelist.isWhitelisted(
        applicationData.url,
        employeeId
      );

      if (!whitelistCheck.allowed) {
        // Create alert for unauthorized website
        await MonitoringAlert.createAlert({
          employee: employeeId,
          alert_type: 'unauthorized_website',
          severity: 'medium',
          title: 'Unauthorized Website Access',
          description: `Employee accessed non-whitelisted website: ${applicationData.url}`,
          data: {
            website_url: applicationData.url,
            application_name: applicationData.name,
            activity_data: applicationData
          },
          session_id: session.sessionId
        });

        // Trigger immediate screenshot
        await screenCaptureService.triggerCapture(
          employeeId,
          session.sessionId,
          'unauthorized_site',
          {
            active_application: applicationData,
            is_flagged: true,
            flag_reason: 'unauthorized_website'
          }
        );
      }
    }
  }

  /**
   * Main activity recording logic
   */
  async recordActivity(sessionData) {
    const now = new Date();
    const timeSinceLastActivity = now.getTime() - sessionData.lastActivity.getTime();

    // Check for idle state
    let idleDuration = 0;
    if (timeSinceLastActivity > this.idleThreshold) {
      if (!sessionData.idleStartTime) {
        sessionData.idleStartTime = sessionData.lastActivity;
        
        // Create idle alert
        await MonitoringAlert.createAlert({
          employee: sessionData.employeeId,
          alert_type: 'idle_timeout',
          severity: 'low',
          title: 'Employee Idle',
          description: `Employee has been idle for more than ${this.idleThreshold / 60000} minutes`,
          data: {
            idle_duration: timeSinceLastActivity / 1000,
            last_activity: sessionData.lastActivity
          },
          session_id: sessionData.sessionId
        });
      }
      
      idleDuration = timeSinceLastActivity / 1000; // Convert to seconds
    }

    // Create activity record
    const activityData = {
      employee: sessionData.employeeId,
      timestamp: now,
      keystroke_count: sessionData.keystrokeCount,
      mouse_activity_score: sessionData.mouseActivityScore,
      idle_duration: idleDuration,
      active_application: sessionData.currentApplication,
      session_id: sessionData.sessionId,
      work_hours: sessionData.workHours,
      metadata: {
        tracking_interval: this.trackingInterval,
        idle_threshold: this.idleThreshold
      }
    };

    // Calculate productivity score
    const activity = new EmployeeActivity(activityData);
    activity.calculateProductivityScore();
    activityData.productivity_score = activity.productivity_score;

    // Add to buffer instead of saving immediately
    this.activityBuffer.get(sessionData.employeeId).push(activityData);

    // Check for productivity drop
    if (activity.productivity_score < 30) {
      await MonitoringAlert.createAlert({
        employee: sessionData.employeeId,
        alert_type: 'productivity_drop',
        severity: 'medium',
        title: 'Low Productivity Detected',
        description: `Productivity score dropped to ${activity.productivity_score}%`,
        data: {
          productivity_score: activity.productivity_score,
          keystroke_count: sessionData.keystrokeCount,
          mouse_activity_score: sessionData.mouseActivityScore,
          idle_duration: idleDuration
        },
        session_id: sessionData.sessionId
      });
    }

    // Reset counters for next interval
    sessionData.keystrokeCount = 0;
    sessionData.mouseActivityScore = Math.max(0, sessionData.mouseActivityScore - 10); // Decay
  }

  /**
   * Flush activity buffer to database
   */
  async flushActivityBuffer() {
    for (const [employeeId, activities] of this.activityBuffer) {
      if (activities.length > 0) {
        await this.flushEmployeeBuffer(employeeId);
      }
    }
  }

  /**
   * Flush specific employee's activity buffer
   */
  async flushEmployeeBuffer(employeeId) {
    const activities = this.activityBuffer.get(employeeId);
    if (!activities || activities.length === 0) return;

    try {
      // Batch insert activities
      await EmployeeActivity.insertMany(activities);
      
      // Clear buffer
      this.activityBuffer.set(employeeId, []);
      
      console.log(`Flushed ${activities.length} activities for employee ${employeeId}`);
    } catch (error) {
      console.error(`Error flushing activities for employee ${employeeId}:`, error);
    }
  }

  /**
   * Get real-time activity status
   */
  getActivityStatus(employeeId) {
    const session = this.activeSessions.get(employeeId);
    if (!session) {
      return { active: false, message: 'Not tracking' };
    }

    const now = new Date();
    const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();
    const isIdle = timeSinceLastActivity > this.idleThreshold;

    return {
      active: true,
      isIdle,
      lastActivity: session.lastActivity,
      timeSinceLastActivity: Math.round(timeSinceLastActivity / 1000),
      currentApplication: session.currentApplication,
      sessionDuration: Math.round((now.getTime() - session.startTime.getTime()) / 1000),
      keystrokeCount: session.keystrokeCount,
      mouseActivityScore: session.mouseActivityScore
    };
  }

  /**
   * Get activity summary for date range
   */
  async getActivitySummary(employeeId, startDate, endDate) {
    return await EmployeeActivity.getActivitySummary(employeeId, startDate, endDate);
  }

  /**
   * Get detailed activity logs
   */
  async getActivityLogs(employeeId, startDate, endDate, limit = 1000) {
    return await EmployeeActivity.find({
      employee: employeeId,
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('employee', 'name email');
  }

  /**
   * Calculate daily productivity metrics
   */
  async calculateDailyMetrics(employeeId, date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const activities = await EmployeeActivity.find({
      employee: employeeId,
      timestamp: {
        $gte: startDate,
        $lt: endDate
      }
    });

    if (activities.length === 0) {
      return {
        totalActivities: 0,
        avgProductivityScore: 0,
        totalKeystroke: 0,
        avgMouseActivity: 0,
        totalIdleTime: 0,
        activeHours: 0
      };
    }

    const totalKeystroke = activities.reduce((sum, a) => sum + a.keystroke_count, 0);
    const avgMouseActivity = activities.reduce((sum, a) => sum + a.mouse_activity_score, 0) / activities.length;
    const totalIdleTime = activities.reduce((sum, a) => sum + a.idle_duration, 0);
    const avgProductivityScore = activities.reduce((sum, a) => sum + a.productivity_score, 0) / activities.length;
    
    // Calculate active hours (time between first and last activity minus idle time)
    const firstActivity = activities[activities.length - 1].timestamp;
    const lastActivity = activities[0].timestamp;
    const totalSessionTime = (lastActivity.getTime() - firstActivity.getTime()) / 1000;
    const activeHours = Math.max(0, (totalSessionTime - totalIdleTime) / 3600);

    return {
      totalActivities: activities.length,
      avgProductivityScore: Math.round(avgProductivityScore),
      totalKeystroke,
      avgMouseActivity: Math.round(avgMouseActivity),
      totalIdleTime: Math.round(totalIdleTime),
      activeHours: Math.round(activeHours * 100) / 100
    };
  }

  /**
   * Stop all tracking sessions (for shutdown)
   */
  stopAllTracking() {
    for (const [employeeId, session] of this.activeSessions) {
      clearInterval(session.intervalId);
    }
    
    // Flush all remaining activities
    this.flushActivityBuffer();
    
    this.activeSessions.clear();
    this.activityBuffer.clear();
    
    console.log('Stopped all activity tracking sessions');
  }
}

module.exports = new ActivityTracker();
