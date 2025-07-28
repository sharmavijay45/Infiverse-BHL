const mongoose = require('mongoose');

const monitoringAlertSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  alert_type: {
    type: String,
    enum: [
      'idle_timeout',
      'unauthorized_website',
      'suspicious_activity',
      'productivity_drop',
      'extended_break',
      'after_hours_activity',
      'application_misuse'
    ],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
    default: 'active',
    index: true
  },
  data: {
    idle_duration: Number,
    website_url: String,
    application_name: String,
    productivity_score: Number,
    activity_data: mongoose.Schema.Types.Mixed,
    screenshot_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ScreenCapture'
    }
  },
  threshold_config: {
    idle_threshold: Number,
    productivity_threshold: Number,
    custom_rules: mongoose.Schema.Types.Mixed
  },
  acknowledged_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  acknowledged_at: Date,
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolved_at: Date,
  resolution_notes: String,
  auto_generated: {
    type: Boolean,
    default: true
  },
  notification_sent: {
    type: Boolean,
    default: false
  },
  notification_channels: [{
    type: String,
    enum: ['email', 'webhook', 'dashboard', 'sms']
  }],
  session_id: {
    type: String,
    index: true
  },
  related_task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }
}, {
  timestamps: true,
  collection: 'monitoring_alerts'
});

// Compound indexes for efficient queries
monitoringAlertSchema.index({ employee: 1, timestamp: -1 });
monitoringAlertSchema.index({ employee: 1, status: 1 });
monitoringAlertSchema.index({ alert_type: 1, severity: 1 });
monitoringAlertSchema.index({ status: 1, timestamp: -1 });
monitoringAlertSchema.index({ timestamp: 1 }, { expireAfterSeconds: 15552000 }); // 180 days retention

// Virtual for alert age
monitoringAlertSchema.virtual('age_minutes').get(function() {
  return Math.floor((Date.now() - this.timestamp.getTime()) / (1000 * 60));
});

// Static method to get active alerts
monitoringAlertSchema.statics.getActiveAlerts = async function(employeeId = null, severity = null) {
  const query = { status: 'active' };
  
  if (employeeId) {
    query.employee = mongoose.Types.ObjectId(employeeId);
  }
  
  if (severity) {
    query.severity = severity;
  }
  
  return this.find(query)
    .populate('employee', 'name email department')
    .populate('acknowledged_by', 'name email')
    .populate('data.screenshot_id')
    .sort({ timestamp: -1 });
};

// Static method to get alert statistics
monitoringAlertSchema.statics.getAlertStats = async function(employeeId, startDate, endDate) {
  const matchQuery = {
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (employeeId) {
    matchQuery.employee = mongoose.Types.ObjectId(employeeId);
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          type: "$alert_type",
          severity: "$severity"
        },
        count: { $sum: 1 },
        avgResolutionTime: {
          $avg: {
            $cond: [
              { $ne: ["$resolved_at", null] },
              { $subtract: ["$resolved_at", "$timestamp"] },
              null
            ]
          }
        }
      }
    },
    {
      $group: {
        _id: "$_id.type",
        severityBreakdown: {
          $push: {
            severity: "$_id.severity",
            count: "$count",
            avgResolutionTime: "$avgResolutionTime"
          }
        },
        totalCount: { $sum: "$count" }
      }
    }
  ]);
};

// Instance method to acknowledge alert
monitoringAlertSchema.methods.acknowledge = function(userId, notes = '') {
  this.status = 'acknowledged';
  this.acknowledged_by = userId;
  this.acknowledged_at = new Date();
  if (notes) {
    this.resolution_notes = notes;
  }
  return this.save();
};

// Instance method to resolve alert
monitoringAlertSchema.methods.resolve = function(userId, notes = '') {
  this.status = 'resolved';
  this.resolved_by = userId;
  this.resolved_at = new Date();
  if (notes) {
    this.resolution_notes = notes;
  }
  return this.save();
};

// Static method to create alert with duplicate check
monitoringAlertSchema.statics.createAlert = async function(alertData) {
  // Check for duplicate alerts in the last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const existingAlert = await this.findOne({
    employee: alertData.employee,
    alert_type: alertData.alert_type,
    status: 'active',
    timestamp: { $gte: fiveMinutesAgo }
  });
  
  if (existingAlert) {
    // Update existing alert instead of creating duplicate
    existingAlert.timestamp = new Date();
    existingAlert.data = { ...existingAlert.data, ...alertData.data };
    return existingAlert.save();
  }
  
  return this.create(alertData);
};

module.exports = mongoose.model('MonitoringAlert', monitoringAlertSchema);
