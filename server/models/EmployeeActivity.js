const mongoose = require('mongoose');

const employeeActivitySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  keystroke_count: {
    type: Number,
    default: 0
  },
  mouse_activity_score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  idle_duration: {
    type: Number, // in seconds
    default: 0
  },
  active_application: {
    name: String,
    title: String,
    url: String
  },
  productivity_score: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  session_id: {
    type: String,
    required: true,
    index: true
  },
  work_hours: {
    start: Date,
    end: Date
  },
  metadata: {
    screen_resolution: String,
    os_info: String,
    browser_info: String
  }
}, {
  timestamps: true,
  collection: 'employee_activities'
});

// Compound indexes for efficient queries
employeeActivitySchema.index({ employee: 1, timestamp: -1 });
employeeActivitySchema.index({ employee: 1, session_id: 1 });
employeeActivitySchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days retention

// Virtual for date grouping
employeeActivitySchema.virtual('date').get(function() {
  return this.timestamp.toISOString().split('T')[0];
});

// Static method to get activity summary
employeeActivitySchema.statics.getActivitySummary = async function(employeeId, startDate, endDate) {
  return this.aggregate([
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
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } }
        },
        totalKeystroke: { $sum: "$keystroke_count" },
        avgMouseActivity: { $avg: "$mouse_activity_score" },
        totalIdleTime: { $sum: "$idle_duration" },
        avgProductivityScore: { $avg: "$productivity_score" },
        activityCount: { $sum: 1 }
      }
    },
    {
      $sort: { "_id.date": 1 }
    }
  ]);
};

// Instance method to calculate productivity score
employeeActivitySchema.methods.calculateProductivityScore = function() {
  const keystrokeWeight = 0.3;
  const mouseWeight = 0.3;
  const idleWeight = 0.4;
  
  const keystrokeScore = Math.min(this.keystroke_count / 100, 1) * 100;
  const mouseScore = this.mouse_activity_score;
  const idleScore = Math.max(0, 100 - (this.idle_duration / 60)); // Penalize idle time
  
  this.productivity_score = Math.round(
    (keystrokeScore * keystrokeWeight) +
    (mouseScore * mouseWeight) +
    (idleScore * idleWeight)
  );
  
  return this.productivity_score;
};

module.exports = mongoose.model('EmployeeActivity', employeeActivitySchema);
