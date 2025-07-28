const mongoose = require('mongoose');

// Keystroke Analytics Schema
const keystrokeAnalyticsSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  session_id: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  application_name: String,
  window_title: String,
  keystroke_data: {
    total_keystrokes: { type: Number, default: 0 },
    typing_speed_wpm: { type: Number, default: 0 },
    typing_accuracy: { type: Number, default: 100 },
    backspace_count: { type: Number, default: 0 },
    delete_count: { type: Number, default: 0 },
    special_keys: {
      ctrl_combinations: { type: Number, default: 0 },
      alt_combinations: { type: Number, default: 0 },
      function_keys: { type: Number, default: 0 },
      arrow_keys: { type: Number, default: 0 }
    }
  },
  productivity_metrics: {
    active_typing_time: { type: Number, default: 0 }, // in seconds
    idle_time: { type: Number, default: 0 }, // in seconds
    productivity_score: { type: Number, default: 0 }, // 0-100
    focus_score: { type: Number, default: 0 }, // 0-100
    efficiency_rating: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
  },
  pattern_analysis: {
    burst_typing: { type: Boolean, default: false },
    consistent_pace: { type: Boolean, default: false },
    frequent_corrections: { type: Boolean, default: false },
    copy_paste_frequency: { type: Number, default: 0 },
    multitasking_detected: { type: Boolean, default: false }
  },
  content_analysis: {
    estimated_content_type: { 
      type: String, 
      enum: ['code', 'documentation', 'email', 'chat', 'search', 'form', 'other'],
      default: 'other'
    },
    programming_patterns: {
      bracket_usage: { type: Number, default: 0 },
      semicolon_usage: { type: Number, default: 0 },
      indentation_patterns: { type: Number, default: 0 },
      variable_naming: { type: Number, default: 0 }
    },
    language_indicators: [String] // detected programming languages
  },
  time_analysis: {
    hour_of_day: { type: Number, min: 0, max: 23 },
    day_of_week: { type: Number, min: 0, max: 6 },
    work_hours: { type: Boolean, default: true },
    peak_performance_time: { type: Boolean, default: false }
  }
});

// Add indexes for performance
keystrokeAnalyticsSchema.index({ employee: 1, timestamp: -1 });
keystrokeAnalyticsSchema.index({ session_id: 1, timestamp: -1 });
keystrokeAnalyticsSchema.index({ 'productivity_metrics.productivity_score': -1 });

const KeystrokeAnalytics = mongoose.model('KeystrokeAnalytics', keystrokeAnalyticsSchema);

class KeystrokeAnalyticsService {
  constructor() {
    this.activeKeystrokeSessions = new Map();
    this.keystrokeBuffer = new Map();
    this.analysisInterval = 60000; // Analyze every minute
    this.bufferFlushInterval = 300000; // Flush buffer every 5 minutes
    
    // Start periodic analysis
    this.startPeriodicAnalysis();
  }

  /**
   * Start keystroke tracking for an employee
   */
  startKeystrokeTracking(employeeId, sessionId) {
    if (this.activeKeystrokeSessions.has(employeeId)) {
      console.log(`Keystroke tracking already active for employee ${employeeId}`);
      return;
    }

    const sessionData = {
      employeeId,
      sessionId,
      startTime: new Date(),
      currentApplication: null,
      keystrokeBuffer: [],
      lastKeystroke: null,
      sessionStats: {
        totalKeystrokes: 0,
        totalTypingTime: 0,
        totalIdleTime: 0,
        applicationSwitches: 0
      }
    };

    this.activeKeystrokeSessions.set(employeeId, sessionData);
    
    if (!this.keystrokeBuffer.has(employeeId)) {
      this.keystrokeBuffer.set(employeeId, []);
    }

    console.log(`Started keystroke tracking for employee ${employeeId}`);
  }

  /**
   * Stop keystroke tracking for an employee
   */
  stopKeystrokeTracking(employeeId) {
    const session = this.activeKeystrokeSessions.get(employeeId);
    if (session) {
      // Flush any remaining data
      this.flushKeystrokeBuffer(employeeId);
      
      this.activeKeystrokeSessions.delete(employeeId);
      this.keystrokeBuffer.delete(employeeId);
      
      console.log(`Stopped keystroke tracking for employee ${employeeId}`);
    }
  }

  /**
   * Record keystroke event
   */
  recordKeystroke(employeeId, keystrokeData) {
    const session = this.activeKeystrokeSessions.get(employeeId);
    if (!session) return;

    const now = new Date();
    const keystrokeEvent = {
      timestamp: now,
      key: keystrokeData.key,
      keyCode: keystrokeData.keyCode,
      isSpecialKey: this.isSpecialKey(keystrokeData.key),
      applicationName: keystrokeData.applicationName,
      windowTitle: keystrokeData.windowTitle,
      modifiers: keystrokeData.modifiers || {}
    };

    // Add to session buffer
    session.keystrokeBuffer.push(keystrokeEvent);
    session.sessionStats.totalKeystrokes++;
    session.lastKeystroke = now;

    // Check for application switch
    if (session.currentApplication !== keystrokeData.applicationName) {
      session.currentApplication = keystrokeData.applicationName;
      session.sessionStats.applicationSwitches++;
    }

    // Add to global buffer for batch processing
    const buffer = this.keystrokeBuffer.get(employeeId);
    buffer.push(keystrokeEvent);

    // Trigger analysis if buffer is large enough
    if (buffer.length >= 100) {
      this.analyzeKeystrokeBuffer(employeeId);
    }
  }

  /**
   * Analyze keystroke buffer and generate insights
   */
  async analyzeKeystrokeBuffer(employeeId) {
    const buffer = this.keystrokeBuffer.get(employeeId);
    if (!buffer || buffer.length === 0) return;

    try {
      const analysis = this.performKeystrokeAnalysis(buffer);
      
      // Save analysis to database
      await this.saveKeystrokeAnalysis(employeeId, analysis);
      
      // Clear buffer
      this.keystrokeBuffer.set(employeeId, []);
      
    } catch (error) {
      console.error(`Error analyzing keystrokes for employee ${employeeId}:`, error);
    }
  }

  /**
   * Perform detailed keystroke analysis
   */
  performKeystrokeAnalysis(keystrokeBuffer) {
    const analysis = {
      timestamp: new Date(),
      keystroke_data: {
        total_keystrokes: keystrokeBuffer.length,
        typing_speed_wpm: 0,
        typing_accuracy: 100,
        backspace_count: 0,
        delete_count: 0,
        special_keys: {
          ctrl_combinations: 0,
          alt_combinations: 0,
          function_keys: 0,
          arrow_keys: 0
        }
      },
      productivity_metrics: {
        active_typing_time: 0,
        idle_time: 0,
        productivity_score: 0,
        focus_score: 0,
        efficiency_rating: 'medium'
      },
      pattern_analysis: {
        burst_typing: false,
        consistent_pace: false,
        frequent_corrections: false,
        copy_paste_frequency: 0,
        multitasking_detected: false
      },
      content_analysis: {
        estimated_content_type: 'other',
        programming_patterns: {
          bracket_usage: 0,
          semicolon_usage: 0,
          indentation_patterns: 0,
          variable_naming: 0
        },
        language_indicators: []
      }
    };

    // Analyze keystroke patterns
    this.analyzeTypingSpeed(keystrokeBuffer, analysis);
    this.analyzeSpecialKeys(keystrokeBuffer, analysis);
    this.analyzeProductivityMetrics(keystrokeBuffer, analysis);
    this.analyzeContentType(keystrokeBuffer, analysis);
    this.analyzeProgrammingPatterns(keystrokeBuffer, analysis);
    this.analyzeTypingPatterns(keystrokeBuffer, analysis);

    return analysis;
  }

  /**
   * Analyze typing speed and accuracy
   */
  analyzeTypingSpeed(buffer, analysis) {
    if (buffer.length < 2) return;

    const typingEvents = buffer.filter(event => !this.isSpecialKey(event.key));
    if (typingEvents.length < 2) return;

    // Calculate time span
    const startTime = typingEvents[0].timestamp;
    const endTime = typingEvents[typingEvents.length - 1].timestamp;
    const timeSpanMinutes = (endTime - startTime) / (1000 * 60);

    if (timeSpanMinutes > 0) {
      // Estimate words (average 5 characters per word)
      const estimatedWords = typingEvents.length / 5;
      analysis.keystroke_data.typing_speed_wpm = Math.round(estimatedWords / timeSpanMinutes);
    }

    // Calculate accuracy based on backspace/delete usage
    const corrections = analysis.keystroke_data.backspace_count + analysis.keystroke_data.delete_count;
    const totalChars = typingEvents.length;
    if (totalChars > 0) {
      analysis.keystroke_data.typing_accuracy = Math.max(0, Math.round(((totalChars - corrections) / totalChars) * 100));
    }
  }

  /**
   * Analyze special key usage
   */
  analyzeSpecialKeys(buffer, analysis) {
    buffer.forEach(event => {
      const key = event.key.toLowerCase();
      
      if (key === 'backspace') {
        analysis.keystroke_data.backspace_count++;
      } else if (key === 'delete') {
        analysis.keystroke_data.delete_count++;
      } else if (event.modifiers.ctrl) {
        analysis.keystroke_data.special_keys.ctrl_combinations++;
        if (key === 'c' || key === 'v') {
          analysis.pattern_analysis.copy_paste_frequency++;
        }
      } else if (event.modifiers.alt) {
        analysis.keystroke_data.special_keys.alt_combinations++;
      } else if (key.startsWith('f') && key.length <= 3) {
        analysis.keystroke_data.special_keys.function_keys++;
      } else if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        analysis.keystroke_data.special_keys.arrow_keys++;
      }
    });
  }

  /**
   * Analyze productivity metrics
   */
  analyzeProductivityMetrics(buffer, analysis) {
    if (buffer.length < 2) return;

    // Calculate active typing time
    let activeTime = 0;
    let idleTime = 0;
    
    for (let i = 1; i < buffer.length; i++) {
      const timeDiff = buffer[i].timestamp - buffer[i-1].timestamp;
      if (timeDiff < 5000) { // Less than 5 seconds = active typing
        activeTime += timeDiff;
      } else {
        idleTime += timeDiff;
      }
    }

    analysis.productivity_metrics.active_typing_time = Math.round(activeTime / 1000);
    analysis.productivity_metrics.idle_time = Math.round(idleTime / 1000);

    // Calculate productivity score
    const totalTime = activeTime + idleTime;
    if (totalTime > 0) {
      const activeRatio = activeTime / totalTime;
      const speedFactor = Math.min(analysis.keystroke_data.typing_speed_wpm / 40, 1); // 40 WPM baseline
      const accuracyFactor = analysis.keystroke_data.typing_accuracy / 100;
      
      analysis.productivity_metrics.productivity_score = Math.round(
        (activeRatio * 0.4 + speedFactor * 0.3 + accuracyFactor * 0.3) * 100
      );
    }

    // Calculate focus score based on application switches and consistency
    const uniqueApps = new Set(buffer.map(event => event.applicationName)).size;
    const focusScore = Math.max(0, 100 - (uniqueApps * 10));
    analysis.productivity_metrics.focus_score = focusScore;

    // Determine efficiency rating
    if (analysis.productivity_metrics.productivity_score >= 75) {
      analysis.productivity_metrics.efficiency_rating = 'high';
    } else if (analysis.productivity_metrics.productivity_score >= 50) {
      analysis.productivity_metrics.efficiency_rating = 'medium';
    } else {
      analysis.productivity_metrics.efficiency_rating = 'low';
    }
  }

  /**
   * Analyze content type based on keystroke patterns
   */
  analyzeContentType(buffer, analysis) {
    const keySequence = buffer.map(event => event.key.toLowerCase()).join('');
    
    // Programming indicators
    const codeIndicators = ['{', '}', '(', ')', '[', ']', ';', '=', '<', '>'];
    const codeScore = codeIndicators.reduce((score, char) => {
      return score + (keySequence.split(char).length - 1);
    }, 0);

    // Email/communication indicators
    const emailIndicators = ['@', '.com', '.org', 'dear', 'regards', 'sincerely'];
    const emailScore = emailIndicators.reduce((score, pattern) => {
      return score + (keySequence.split(pattern).length - 1);
    }, 0);

    // Documentation indicators
    const docIndicators = ['the', 'and', 'that', 'this', 'with', 'for'];
    const docScore = docIndicators.reduce((score, word) => {
      return score + (keySequence.split(word).length - 1);
    }, 0);

    // Determine content type
    if (codeScore > emailScore && codeScore > docScore) {
      analysis.content_analysis.estimated_content_type = 'code';
    } else if (emailScore > docScore) {
      analysis.content_analysis.estimated_content_type = 'email';
    } else if (docScore > 5) {
      analysis.content_analysis.estimated_content_type = 'documentation';
    }
  }

  /**
   * Analyze programming patterns
   */
  analyzeProgrammingPatterns(buffer, analysis) {
    const keySequence = buffer.map(event => event.key.toLowerCase()).join('');
    
    analysis.content_analysis.programming_patterns.bracket_usage = 
      (keySequence.split('{').length - 1) + (keySequence.split('[').length - 1) + (keySequence.split('(').length - 1);
    
    analysis.content_analysis.programming_patterns.semicolon_usage = 
      keySequence.split(';').length - 1;
    
    // Detect programming languages
    const languagePatterns = {
      javascript: ['function', 'const', 'let', 'var', '=>'],
      python: ['def', 'import', 'from', 'class', 'if __name__'],
      java: ['public', 'private', 'class', 'interface', 'extends'],
      css: ['{', '}', ':', ';', 'px', 'em', 'rem'],
      html: ['<', '>', 'div', 'span', 'class=', 'id=']
    };

    Object.entries(languagePatterns).forEach(([language, patterns]) => {
      const matches = patterns.filter(pattern => keySequence.includes(pattern)).length;
      if (matches >= 2) {
        analysis.content_analysis.language_indicators.push(language);
      }
    });
  }

  /**
   * Analyze typing patterns
   */
  analyzeTypingPatterns(buffer, analysis) {
    if (buffer.length < 10) return;

    // Detect burst typing (rapid keystrokes followed by pauses)
    const intervals = [];
    for (let i = 1; i < buffer.length; i++) {
      intervals.push(buffer[i].timestamp - buffer[i-1].timestamp);
    }

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const shortIntervals = intervals.filter(interval => interval < avgInterval / 2).length;
    const longIntervals = intervals.filter(interval => interval > avgInterval * 2).length;

    analysis.pattern_analysis.burst_typing = shortIntervals > intervals.length * 0.3;
    analysis.pattern_analysis.consistent_pace = longIntervals < intervals.length * 0.2;
    analysis.pattern_analysis.frequent_corrections = 
      (analysis.keystroke_data.backspace_count + analysis.keystroke_data.delete_count) > buffer.length * 0.1;

    // Detect multitasking (frequent application switches)
    const uniqueApps = new Set(buffer.map(event => event.applicationName)).size;
    analysis.pattern_analysis.multitasking_detected = uniqueApps > 3;
  }

  /**
   * Save keystroke analysis to database
   */
  async saveKeystrokeAnalysis(employeeId, analysis) {
    try {
      const session = this.activeKeystrokeSessions.get(employeeId);
      if (!session) return;

      const now = new Date();
      const keystrokeRecord = new KeystrokeAnalytics({
        employee: employeeId,
        session_id: session.sessionId,
        timestamp: analysis.timestamp,
        application_name: session.currentApplication,
        keystroke_data: analysis.keystroke_data,
        productivity_metrics: analysis.productivity_metrics,
        pattern_analysis: analysis.pattern_analysis,
        content_analysis: analysis.content_analysis,
        time_analysis: {
          hour_of_day: now.getHours(),
          day_of_week: now.getDay(),
          work_hours: this.isWorkHours(now),
          peak_performance_time: this.isPeakPerformanceTime(now)
        }
      });

      await keystrokeRecord.save();
    } catch (error) {
      console.error('Error saving keystroke analysis:', error);
    }
  }

  /**
   * Utility methods
   */
  isSpecialKey(key) {
    const specialKeys = [
      'shift', 'ctrl', 'alt', 'meta', 'tab', 'enter', 'escape', 'space',
      'backspace', 'delete', 'insert', 'home', 'end', 'pageup', 'pagedown',
      'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'capslock', 'numlock'
    ];
    return specialKeys.includes(key.toLowerCase()) || key.startsWith('f');
  }

  isWorkHours(date) {
    const hour = date.getHours();
    const day = date.getDay();
    return day >= 1 && day <= 5 && hour >= 9 && hour <= 17; // Monday-Friday, 9AM-5PM
  }

  isPeakPerformanceTime(date) {
    const hour = date.getHours();
    return hour >= 10 && hour <= 11 || hour >= 14 && hour <= 15; // 10-11AM or 2-3PM
  }

  /**
   * Flush keystroke buffer for an employee
   */
  async flushKeystrokeBuffer(employeeId) {
    await this.analyzeKeystrokeBuffer(employeeId);
  }

  /**
   * Start periodic analysis
   */
  startPeriodicAnalysis() {
    setInterval(async () => {
      for (const [employeeId] of this.activeKeystrokeSessions) {
        await this.analyzeKeystrokeBuffer(employeeId);
      }
    }, this.analysisInterval);

    setInterval(async () => {
      for (const [employeeId] of this.activeKeystrokeSessions) {
        await this.flushKeystrokeBuffer(employeeId);
      }
    }, this.bufferFlushInterval);
  }

  /**
   * Get keystroke analytics for an employee
   */
  async getKeystrokeAnalytics(employeeId, startDate, endDate) {
    try {
      return await KeystrokeAnalytics.find({
        employee: employeeId,
        timestamp: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }).sort({ timestamp: -1 });
    } catch (error) {
      console.error('Error fetching keystroke analytics:', error);
      return [];
    }
  }

  /**
   * Get productivity summary
   */
  async getProductivitySummary(employeeId, startDate, endDate) {
    try {
      const analytics = await KeystrokeAnalytics.aggregate([
        {
          $match: {
            employee: new mongoose.Types.ObjectId(employeeId),
            timestamp: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          }
        },
        {
          $group: {
            _id: null,
            avgProductivityScore: { $avg: '$productivity_metrics.productivity_score' },
            avgFocusScore: { $avg: '$productivity_metrics.focus_score' },
            totalKeystrokes: { $sum: '$keystroke_data.total_keystrokes' },
            avgTypingSpeed: { $avg: '$keystroke_data.typing_speed_wpm' },
            avgAccuracy: { $avg: '$keystroke_data.typing_accuracy' },
            totalActiveTime: { $sum: '$productivity_metrics.active_typing_time' },
            totalIdleTime: { $sum: '$productivity_metrics.idle_time' }
          }
        }
      ]);

      return analytics[0] || {};
    } catch (error) {
      console.error('Error generating productivity summary:', error);
      return {};
    }
  }

  /**
   * Stop all keystroke tracking
   */
  stopAllTracking() {
    for (const [employeeId] of this.activeKeystrokeSessions) {
      this.stopKeystrokeTracking(employeeId);
    }
    console.log('Stopped all keystroke tracking sessions');
  }
}

module.exports = { KeystrokeAnalyticsService, KeystrokeAnalytics };
