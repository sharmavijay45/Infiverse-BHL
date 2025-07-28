const express = require('express');
const router = express.Router();
const path = require('path');
const auth = require('../middleware/auth');
const EmployeeActivity = require('../models/EmployeeActivity');
const ScreenCapture = require('../models/ScreenCapture');
const MonitoringAlert = require('../models/MonitoringAlert');
const WebsiteWhitelist = require('../models/WebsiteWhitelist');
const activityTracker = require('../services/activityTracker');
const screenCaptureService = require('../services/screenCapture');
const websiteMonitor = require('../services/websiteMonitor');
const intelligentScreenCapture = require('../services/intelligentScreenCapture');
const groqAIService = require('../services/groqAIService');
const ocrAnalysisService = require('../services/ocrAnalysisService');
const { KeystrokeAnalyticsService } = require('../services/keystrokeAnalytics');
const reportGenerator = require('../services/reportGenerator');
const fs = require('fs').promises;
const { getViolationScreenshots, generateOptimizedScreenshotUrl } = require('../utils/cloudinary');

// Start monitoring session for an employee
router.post('/start/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { workHours, intelligentMode = true } = req.body;
    const sessionId = `session_${employeeId}_${Date.now()}`;

    // Start monitoring services based on mode
    if (intelligentMode) {
      // Start intelligent monitoring (event-driven screenshots)
      activityTracker.startTracking(employeeId, sessionId, workHours, true);
      websiteMonitor.startMonitoring(employeeId, sessionId);
      console.log('🌐 Website monitoring enabled with real browser detection');
    } else {
      // Start legacy monitoring (time-based screenshots)
      activityTracker.startTracking(employeeId, sessionId, workHours, false);
      await screenCaptureService.startCapture(employeeId, sessionId);
      websiteMonitor.startMonitoring(employeeId, sessionId);
      console.log('🌐 Website monitoring enabled with real browser detection');
    }

    res.json({
      success: true,
      message: `${intelligentMode ? 'Intelligent' : 'Legacy'} monitoring started successfully`,
      sessionId,
      employeeId,
      startTime: new Date(),
      mode: intelligentMode ? 'intelligent' : 'legacy'
    });
  } catch (error) {
    console.error('Error starting monitoring:', error);
    res.status(500).json({ error: 'Failed to start monitoring' });
  }
});

// Stop monitoring session for an employee
router.post('/stop/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;

    // Stop all monitoring services
    activityTracker.stopTracking(employeeId);
    screenCaptureService.stopCapture(employeeId);
    websiteMonitor.stopMonitoring(employeeId);

    res.json({
      success: true,
      message: 'Monitoring stopped successfully',
      employeeId,
      stopTime: new Date()
    });
  } catch (error) {
    console.error('Error stopping monitoring:', error);
    res.status(500).json({ error: 'Failed to stop monitoring' });
  }
});

// Start monitoring for all employees
router.post('/start-all', async (req, res) => {
  try {
    const { intelligentMode = true, departmentFilter } = req.body;

    // Get all employees (filter by department if specified)
    const User = require('../models/User');
    let query = { role: { $ne: 'Admin' } }; // Don't monitor admins

    if (departmentFilter) {
      query.department = departmentFilter;
    }

    const employees = await User.find(query).select('_id name email department');

    const results = [];
    const errors = [];

    for (const employee of employees) {
      try {
        const sessionId = `bulk_session_${employee._id}_${Date.now()}`;

        if (intelligentMode) {
          activityTracker.startTracking(employee._id, sessionId, null, true);
        } else {
          activityTracker.startTracking(employee._id, sessionId, null, false);
          await screenCaptureService.startCapture(employee._id, sessionId);
        }

        websiteMonitor.startMonitoring(employee._id, sessionId);

        results.push({
          employeeId: employee._id,
          name: employee.name,
          sessionId,
          status: 'started'
        });

      } catch (error) {
        errors.push({
          employeeId: employee._id,
          name: employee.name,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk monitoring started for ${results.length} employees`,
      mode: intelligentMode ? 'intelligent' : 'legacy',
      results,
      errors,
      startTime: new Date()
    });

  } catch (error) {
    console.error('Error starting bulk monitoring:', error);
    res.status(500).json({ error: 'Failed to start bulk monitoring' });
  }
});

// Stop monitoring for all employees
router.post('/stop-all', async (req, res) => {
  try {
    // Stop all active monitoring sessions
    activityTracker.stopAllTracking();
    screenCaptureService.stopAllCaptures();
    websiteMonitor.stopAllMonitoring();
    intelligentScreenCapture.stopAllMonitoring();

    res.json({
      success: true,
      message: 'All monitoring sessions stopped',
      stopTime: new Date()
    });

  } catch (error) {
    console.error('Error stopping all monitoring:', error);
    res.status(500).json({ error: 'Failed to stop all monitoring' });
  }
});

// Get employee activity data
router.get('/employees/:id/activity', async (req, res) => {
  try {
    const { id: employeeId } = req.params;
    const { date, startDate, endDate, limit = 1000 } = req.query;

    let activities;
    if (date) {
      // Get activities for specific date
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      
      activities = await EmployeeActivity.find({
        employee: employeeId,
        timestamp: { $gte: start, $lt: end }
      })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('employee', 'name email');
    } else if (startDate && endDate) {
      // Get activities for date range
      activities = await activityTracker.getActivityLogs(
        employeeId, 
        startDate, 
        endDate, 
        parseInt(limit)
      );
    } else {
      // Get recent activities (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      activities = await EmployeeActivity.find({
        employee: employeeId,
        timestamp: { $gte: yesterday }
      })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('employee', 'name email');
    }

    // Get real-time status
    const realtimeStatus = activityTracker.getActivityStatus(employeeId);

    res.json({
      activities,
      realtimeStatus,
      totalCount: activities.length
    });
  } catch (error) {
    console.error('Error fetching employee activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity data' });
  }
});

// Get employee screenshots (only violation screenshots)
router.get('/employees/:id/screenshots', async (req, res) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  try {
    const { id: employeeId } = req.params;
    const { date, startDate, endDate, limit = 50 } = req.query;

    console.log(`🔍 API CALL: Fetching screenshots for employee ${employeeId}, date: ${date}`);
    console.log(`📡 Request headers:`, req.headers.authorization ? 'Auth present' : 'No auth');
    console.log(`📋 Query params:`, req.query);

    let screenshots;

    // ONLY show intelligent violation screenshots (not regular scheduled screenshots)
    const violationFilter = {
      'metadata.intelligent_capture': true,
      $or: [
        { capture_trigger: 'unauthorized_access' },
        { capture_trigger: 'unauthorized_site' }
      ],
      is_flagged: true
    };

    if (date) {
      // Parse the date and create start/end of day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(`📅 Searching for screenshots between ${startOfDay} and ${endOfDay}`);

      screenshots = await ScreenCapture.find({
        employee: employeeId,
        timestamp: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        ...violationFilter
      })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('employee', 'name email')
      .select('-metadata.encryption_key');
    } else if (startDate && endDate) {
      screenshots = await ScreenCapture.find({
        employee: employeeId,
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        },
        ...violationFilter
      })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('employee', 'name email')
      .select('-metadata.encryption_key');
    } else {
      // Get recent violation screenshots only (last 7 days)
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      screenshots = await ScreenCapture.find({
        employee: employeeId,
        timestamp: { $gte: lastWeek },
        ...violationFilter
      })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('employee', 'name email');
    }

    console.log(`📸 API RESPONSE: Returning ${screenshots?.length || 0} violation screenshots for employee ${employeeId}`);
    console.log(`📋 Screenshots found:`, screenshots?.map(s => s.active_application?.title) || []);

    const response = {
      screenshots: screenshots || [],
      totalCount: screenshots?.length || 0,
      message: 'Only violation screenshots are shown'
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching screenshots:', error);
    res.status(500).json({ error: 'Failed to fetch screenshots' });
  }
});

// Get specific screenshot file (supports both Cloudinary and local storage)
router.get('/screenshots/:screenshotId', async (req, res) => {
  try {
    const { screenshotId } = req.params;
    const { width, height, quality } = req.query;

    const screenshot = await ScreenCapture.findById(screenshotId);
    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot not found' });
    }

    // Check if screenshot is stored in Cloudinary
    if (screenshot.metadata?.cloudinary_url) {
      // Generate optimized Cloudinary URL if dimensions are provided
      if (width || height || quality) {
        const optimizedUrl = generateOptimizedScreenshotUrl(
          screenshot.metadata.cloudinary_public_id,
          {
            width: width ? parseInt(width) : undefined,
            height: height ? parseInt(height) : undefined,
            quality: quality || 'auto:good'
          }
        );
        return res.redirect(optimizedUrl);
      } else {
        // Redirect to original Cloudinary URL
        return res.redirect(screenshot.metadata.cloudinary_url);
      }
    }

    // Fallback to local file serving (for backward compatibility)
    const filePath = screenshot.file_path;
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({
        error: 'Screenshot file not found',
        message: 'Screenshot may have been moved to cloud storage'
      });
    }

    // Set appropriate headers for local files
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Disposition', `inline; filename="screenshot_${screenshot._id}.jpg"`);

    // Stream the local file
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Error serving screenshot:', error);
    res.status(500).json({ error: 'Failed to serve screenshot' });
  }
});

// Get violation screenshots from Cloudinary (optimized endpoint)
router.get('/cloudinary-screenshots/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date, limit = 50 } = req.query;

    console.log(`🔍 API CALL: Fetching Cloudinary screenshots for employee ${employeeId}, date: ${date}`);

    // Get violation screenshots from Cloudinary
    const cloudinaryScreenshots = await getViolationScreenshots(employeeId, {
      date,
      limit: parseInt(limit)
    });

    // Also get database records for additional metadata
    let dbQuery = {
      employee: employeeId,
      'metadata.intelligent_capture': true,
      is_flagged: true,
      $or: [
        { capture_trigger: 'unauthorized_access' },
        { capture_trigger: 'unauthorized_site' }
      ]
    };

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      dbQuery.timestamp = { $gte: startDate, $lt: endDate };
    }

    const dbScreenshots = await ScreenCapture.find(dbQuery)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('employee', 'name email')
      .select('-metadata.encryption_key');

    // Merge Cloudinary data with database metadata
    const mergedScreenshots = dbScreenshots.map(dbShot => {
      const cloudinaryShot = cloudinaryScreenshots.find(cs =>
        cs.cloudinary_public_id === dbShot.metadata?.cloudinary_public_id
      );

      return {
        _id: dbShot._id,
        employee: dbShot.employee,
        timestamp: dbShot.timestamp,
        file_size: dbShot.file_size,
        active_application: dbShot.active_application,
        capture_trigger: dbShot.capture_trigger,
        flag_reason: dbShot.flag_reason,
        metadata: {
          ...dbShot.metadata,
          cloudinary_optimized_url: cloudinaryShot ?
            generateOptimizedScreenshotUrl(cloudinaryShot.cloudinary_public_id, {
              width: 800,
              height: 600,
              quality: 'auto:good'
            }) : null
        }
      };
    });

    console.log(`📸 API RESPONSE: Returning ${mergedScreenshots.length} Cloudinary violation screenshots`);

    res.json({
      success: true,
      screenshots: mergedScreenshots,
      total: mergedScreenshots.length,
      storage_type: 'cloudinary',
      date: date || 'recent'
    });

  } catch (error) {
    console.error('Error fetching Cloudinary screenshots:', error);
    res.status(500).json({
      error: 'Failed to fetch Cloudinary screenshots',
      details: error.message
    });
  }
});

// Get monitoring alerts
router.get('/alerts', async (req, res) => {
  try {
    const { employeeId, severity, status = 'active', limit = 100 } = req.query;

    const query = {};
    if (employeeId) query.employee = employeeId;
    if (severity) query.severity = severity;
    if (status) query.status = status;

    const alerts = await MonitoringAlert.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('employee', 'name email department')
      .populate('acknowledged_by', 'name email')
      .populate('resolved_by', 'name email')
      .populate('data.screenshot_id');

    res.json({
      alerts,
      totalCount: alerts.length
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Acknowledge alert
router.put('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { notes } = req.body;

    const alert = await MonitoringAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await alert.acknowledge(null, notes);

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      alert
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Resolve alert
router.put('/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { notes } = req.body;

    const alert = await MonitoringAlert.findById(alertId);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    await alert.resolve(null, notes);

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      alert
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// Get website whitelist
router.get('/whitelist', async (req, res) => {
  try {
    const { category, status = 'approved', limit = 100 } = req.query;

    const query = { approval_status: status };
    if (category) query.category = category;

    const whitelist = await WebsiteWhitelist.find(query)
      .sort({ domain: 1 })
      .limit(parseInt(limit))
      .populate('added_by', 'name email')
      .populate('approved_by', 'name email');

    res.json({
      whitelist,
      totalCount: whitelist.length
    });
  } catch (error) {
    console.error('Error fetching whitelist:', error);
    res.status(500).json({ error: 'Failed to fetch whitelist' });
  }
});

// Add website to whitelist
router.post('/whitelist', async (req, res) => {
  try {
    const {
      domain,
      category,
      description,
      allowedPaths,
      timeRestrictions,
      usageLimits,
      monitoringLevel
    } = req.body;

    const whitelistEntry = new WebsiteWhitelist({
      domain: domain.toLowerCase(),
      category,
      description,
      allowed_paths: allowedPaths || [],
      time_restrictions: timeRestrictions || {},
      usage_limits: usageLimits || {},
      monitoring_level: monitoringLevel || 'basic',
      added_by: null,
      approval_status: 'approved'
    });

    whitelistEntry.approved_by = null;
    whitelistEntry.approval_date = new Date();

    await whitelistEntry.save();

    res.status(201).json({
      success: true,
      message: 'Website added to whitelist successfully',
      whitelistEntry
    });
  } catch (error) {
    console.error('Error adding to whitelist:', error);
    res.status(500).json({ error: 'Failed to add website to whitelist' });
  }
});

// Get monitoring reports
router.get('/reports/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Get activity summary
    const activitySummary = await activityTracker.getActivitySummary(employeeId, startDate, endDate);
    
    // Get daily metrics
    const dailyMetrics = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dateStr = date.toISOString().split('T')[0];
      const metrics = await activityTracker.calculateDailyMetrics(employeeId, dateStr);
      dailyMetrics.push({
        date: dateStr,
        ...metrics
      });
    }

    // Get alert statistics
    const alertStats = await MonitoringAlert.getAlertStats(employeeId, startDate, endDate);
    
    // Get screenshot summary
    const screenshots = await ScreenCapture.getCapturesByDateRange(employeeId, startDate, endDate);
    
    res.json({
      employeeId,
      reportPeriod: { startDate, endDate },
      activitySummary,
      dailyMetrics,
      alertStats,
      screenshots: {
        total: screenshots.length,
        flagged: screenshots.filter(s => s.is_flagged).length,
        byTrigger: screenshots.reduce((acc, s) => {
          acc[s.capture_trigger] = (acc[s.capture_trigger] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Get real-time monitoring status
router.get('/status/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;

    const activityStatus = activityTracker.getActivityStatus(employeeId);
    const websiteStatus = websiteMonitor.getMonitoringStatus(employeeId);
    
    res.json({
      employeeId,
      timestamp: new Date(),
      activity: activityStatus,
      website: websiteStatus,
      monitoring: {
        active: activityStatus.active && websiteStatus.active,
        services: {
          activityTracker: activityStatus.active,
          websiteMonitor: websiteStatus.active,
          screenCapture: activityStatus.active // Assuming same as activity tracker
        }
      }
    });
  } catch (error) {
    console.error('Error fetching monitoring status:', error);
    res.status(500).json({ error: 'Failed to fetch monitoring status' });
  }
});

// Get all employees monitoring status
router.get('/status/all', async (req, res) => {
  try {
    const User = require('../models/User');
    const employees = await User.find({ role: { $ne: 'Admin' } })
      .select('_id name email department')
      .populate('department', 'name');

    const statusList = employees.map(employee => {
      const activityStatus = activityTracker.getActivityStatus(employee._id);
      const websiteStatus = websiteMonitor.getMonitoringStatus(employee._id);
      const intelligentStats = intelligentScreenCapture.getMonitoringStats(employee._id);

      return {
        employee: {
          id: employee._id,
          name: employee.name,
          email: employee.email,
          department: employee.department?.name
        },
        monitoring: {
          isActive: activityStatus.active || websiteStatus.active,
          mode: intelligentStats.isActive ? 'intelligent' : 'legacy',
          lastActivity: activityStatus.lastActivity || websiteStatus.lastCheck,
          violationCount: intelligentStats.violationCount || 0,
          lastViolation: intelligentStats.lastViolation
        },
        activity: activityStatus,
        website: websiteStatus,
        intelligent: intelligentStats
      };
    });

    res.json({
      employees: statusList,
      summary: {
        total: statusList.length,
        active: statusList.filter(s => s.monitoring.isActive).length,
        intelligent: statusList.filter(s => s.monitoring.mode === 'intelligent').length,
        withViolations: statusList.filter(s => s.monitoring.violationCount > 0).length
      }
    });

  } catch (error) {
    console.error('Error fetching all monitoring status:', error);
    res.status(500).json({ error: 'Failed to fetch monitoring status' });
  }
});

// Test AI service connectivity
router.get('/ai/test', async (req, res) => {
  try {
    const testResult = await groqAIService.testConnection();
    res.json(testResult);
  } catch (error) {
    console.error('Error testing AI service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test AI service',
      details: error.message
    });
  }
});

// Get intelligent monitoring statistics
router.get('/intelligent/stats', async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    // Get violation sessions and AI analysis data
    const query = {
      capture_trigger: 'unauthorized_access',
      'metadata.intelligent_capture': true
    };

    if (employeeId) {
      query.employee = employeeId;
    }

    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const screenshots = await ScreenCapture.find(query)
      .populate('employee', 'name email')
      .sort({ timestamp: -1 });

    // Aggregate statistics
    const stats = {
      totalViolations: screenshots.length,
      uniqueEmployees: new Set(screenshots.map(s => s.employee._id.toString())).size,
      byEmployee: {},
      contentTypes: {},
      riskLevels: {},
      taskRelevanceScores: []
    };

    screenshots.forEach(screenshot => {
      const employeeName = screenshot.employee.name;
      const aiAnalysis = screenshot.metadata?.ai_analysis;

      // By employee
      if (!stats.byEmployee[employeeName]) {
        stats.byEmployee[employeeName] = 0;
      }
      stats.byEmployee[employeeName]++;

      // AI analysis stats
      if (aiAnalysis) {
        // Content types
        const contentType = aiAnalysis.contentType || 'Unknown';
        stats.contentTypes[contentType] = (stats.contentTypes[contentType] || 0) + 1;

        // Risk levels
        const riskLevel = aiAnalysis.contentRisk?.level || 'unknown';
        stats.riskLevels[riskLevel] = (stats.riskLevels[riskLevel] || 0) + 1;

        // Task relevance scores
        if (aiAnalysis.taskRelevance?.score !== undefined) {
          stats.taskRelevanceScores.push(aiAnalysis.taskRelevance.score);
        }
      }
    });

    // Calculate average task relevance
    if (stats.taskRelevanceScores.length > 0) {
      stats.avgTaskRelevance = Math.round(
        stats.taskRelevanceScores.reduce((sum, score) => sum + score, 0) /
        stats.taskRelevanceScores.length
      );
    }

    res.json(stats);

  } catch (error) {
    console.error('Error fetching intelligent monitoring stats:', error);
    res.status(500).json({ error: 'Failed to fetch intelligent monitoring statistics' });
  }
});

// Record keystroke event
router.post('/keystroke/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const keystrokeData = req.body;

    const keystrokeService = new KeystrokeAnalyticsService();
    keystrokeService.recordKeystroke(employeeId, keystrokeData);

    res.json({ success: true, message: 'Keystroke recorded' });
  } catch (error) {
    console.error('Error recording keystroke:', error);
    res.status(500).json({ error: 'Failed to record keystroke' });
  }
});

// Get keystroke analytics
router.get('/keystroke/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const keystrokeService = new KeystrokeAnalyticsService();
    const analytics = await keystrokeService.getKeystrokeAnalytics(
      employeeId,
      startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate || new Date()
    );

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching keystroke analytics:', error);
    res.status(500).json({ error: 'Failed to fetch keystroke analytics' });
  }
});

// Get productivity summary
router.get('/productivity/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;

    const keystrokeService = new KeystrokeAnalyticsService();
    const summary = await keystrokeService.getProductivitySummary(
      employeeId,
      startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate || new Date()
    );

    res.json({ summary });
  } catch (error) {
    console.error('Error fetching productivity summary:', error);
    res.status(500).json({ error: 'Failed to fetch productivity summary' });
  }
});

// Generate PDF report
router.post('/report/pdf/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, options } = req.body;

    const report = await reportGenerator.generateEmployeeReport(
      employeeId,
      startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate || new Date(),
      options || {}
    );

    res.json({
      success: true,
      report: {
        filename: report.filename,
        size: report.size,
        generatedAt: report.generatedAt,
        downloadUrl: `/api/monitoring/download/${report.filename}`
      }
    });
  } catch (error) {
    console.error('Error generating PDF report:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
  }
});

// Generate bulk reports
router.post('/report/bulk', async (req, res) => {
  try {
    const { employeeIds, startDate, endDate } = req.body;

    const reports = await reportGenerator.generateBulkReport(
      employeeIds,
      startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate || new Date()
    );

    res.json({
      success: true,
      reports: reports.map(report => ({
        filename: report.filename,
        size: report.size,
        generatedAt: report.generatedAt,
        downloadUrl: `/api/monitoring/download/${report.filename}`
      }))
    });
  } catch (error) {
    console.error('Error generating bulk reports:', error);
    res.status(500).json({ error: 'Failed to generate bulk reports' });
  }
});

// Export data to CSV
router.post('/export/csv/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, dataType } = req.body;

    const export_result = await reportGenerator.exportToCSV(
      employeeId,
      startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate || new Date(),
      dataType || 'all'
    );

    res.json({
      success: true,
      export: {
        filename: export_result.filename,
        generatedAt: export_result.generatedAt,
        downloadUrl: `/api/monitoring/download/${export_result.filename}`
      }
    });
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    res.status(500).json({ error: 'Failed to export to CSV' });
  }
});

// Download generated files
router.get('/download/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const reportsDir = process.env.REPORTS_STORAGE_PATH || './uploads/reports';
    const filepath = path.join(reportsDir, filename);

    // Check if file exists
    const fs = require('fs').promises;
    await fs.access(filepath);

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (ext === '.csv') {
      res.setHeader('Content-Type', 'text/csv');
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.download(filepath);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(404).json({ error: 'File not found' });
  }
});

// Test OCR analysis
router.post('/ocr/test', async (req, res) => {
  try {
    const { imagePath, employeeId } = req.body;

    const analysis = await ocrAnalysisService.analyzeScreenshotWithOCR(imagePath, {
      employeeId,
      applicationData: { name: 'Test Application' }
    });

    res.json({ analysis });
  } catch (error) {
    console.error('Error testing OCR analysis:', error);
    res.status(500).json({ error: 'Failed to test OCR analysis' });
  }
});

// Get OCR service status
router.get('/ocr/status', async (req, res) => {
  try {
    const stats = ocrAnalysisService.getOCRStats();
    res.json({ stats });
  } catch (error) {
    console.error('Error getting OCR status:', error);
    res.status(500).json({ error: 'Failed to get OCR status' });
  }
});

// Work Session Management Routes

// Get current work session
router.get('/work-session/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const WorkSession = require('../models/WorkSession');
    const session = await WorkSession.findOne({
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate('employee', 'name email');

    res.json(session);
  } catch (error) {
    console.error('Error fetching work session:', error);
    res.status(500).json({ error: 'Failed to fetch work session' });
  }
});

// Start work session
router.post('/work-session/start', async (req, res) => {
  try {
    const { employeeId, startTime, targetHours = 8 } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const WorkSession = require('../models/WorkSession');

    // Check if session already exists for today
    let session = await WorkSession.findOne({
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (session) {
      // Update existing session
      session.startTime = startTime;
      session.status = 'active';
      session.targetHours = targetHours;
    } else {
      // Create new session
      session = new WorkSession({
        employee: employeeId,
        date: today,
        startTime,
        targetHours,
        status: 'active'
      });
    }

    await session.save();
    await session.populate('employee', 'name email');

    console.log(`💼 Work session started for employee ${employeeId}`);
    res.json(session);
  } catch (error) {
    console.error('Error starting work session:', error);
    res.status(500).json({ error: 'Failed to start work session' });
  }
});

// Pause work session
router.post('/work-session/pause', async (req, res) => {
  try {
    const { employeeId } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const WorkSession = require('../models/WorkSession');
    const session = await WorkSession.findOne({
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (session) {
      session.status = 'paused';
      session.pausedAt = new Date();
      await session.save();
      console.log(`⏸️ Work session paused for employee ${employeeId}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error pausing work session:', error);
    res.status(500).json({ error: 'Failed to pause work session' });
  }
});

// Resume work session
router.post('/work-session/resume', async (req, res) => {
  try {
    const { employeeId } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const WorkSession = require('../models/WorkSession');
    const session = await WorkSession.findOne({
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (session) {
      session.status = 'active';
      session.resumedAt = new Date();
      await session.save();
      console.log(`▶️ Work session resumed for employee ${employeeId}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error resuming work session:', error);
    res.status(500).json({ error: 'Failed to resume work session' });
  }
});

// End work session
router.post('/work-session/end', async (req, res) => {
  try {
    const { employeeId } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const WorkSession = require('../models/WorkSession');
    const session = await WorkSession.findOne({
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (session) {
      session.status = 'completed';
      session.endTime = new Date();
      await session.save();
      console.log(`🏁 Work session ended for employee ${employeeId}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error ending work session:', error);
    res.status(500).json({ error: 'Failed to end work session' });
  }
});

module.exports = router;
