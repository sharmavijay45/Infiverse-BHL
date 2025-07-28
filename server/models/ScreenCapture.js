const mongoose = require('mongoose');

const screenCaptureSchema = new mongoose.Schema({
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
  file_path: {
    type: String,
    required: true
  },
  file_size: {
    type: Number,
    required: true
  },
  file_hash: {
    type: String,
    required: true,
    index: true
  },
  compression_ratio: {
    type: Number,
    default: 1.0
  },
  screen_resolution: {
    width: Number,
    height: Number
  },
  is_delta: {
    type: Boolean,
    default: false
  },
  previous_capture: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScreenCapture'
  },
  active_application: {
    name: String,
    title: String,
    url: String
  },
  session_id: {
    type: String,
    required: true,
    index: true
  },
  capture_trigger: {
    type: String,
    enum: ['scheduled', 'activity_change', 'unauthorized_site', 'unauthorized_access', 'manual'],
    default: 'scheduled'
  },
  is_flagged: {
    type: Boolean,
    default: false
  },
  flag_reason: {
    type: String,
    enum: ['unauthorized_website', 'unauthorized_website_access', 'suspicious_activity', 'manual_flag', 'idle_detection']
  },
  metadata: {
    blur_applied: { type: Boolean, default: false },
    privacy_level: { type: String, enum: ['full', 'blurred', 'metadata_only'], default: 'full' },
    encryption_key: String,
    // Intelligent monitoring metadata
    intelligent_capture: { type: Boolean, default: false },
    violation_session_id: String,
    screenshot_sequence: Number,
    max_screenshots: Number,
    ai_analysis: {
      activityType: String,
      activityDescription: String,
      taskRelevance: Number,
      alertReason: String,
      confidence: Number
    },
    ocr_analysis: {
      text: String,
      confidence: Number,
      extractedAt: Date
    }
  }
}, {
  timestamps: true,
  collection: 'screen_captures'
});

// Compound indexes for efficient queries
screenCaptureSchema.index({ employee: 1, timestamp: -1 });
screenCaptureSchema.index({ employee: 1, session_id: 1 });
screenCaptureSchema.index({ file_hash: 1 });
screenCaptureSchema.index({ is_flagged: 1, timestamp: -1 });
screenCaptureSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days retention

// Virtual for date grouping
screenCaptureSchema.virtual('date').get(function() {
  return this.timestamp.toISOString().split('T')[0];
});

// Virtual for file URL
screenCaptureSchema.virtual('file_url').get(function() {
  return `/api/monitoring/screenshots/${this._id}`;
});

// Static method to get captures by date range
screenCaptureSchema.statics.getCapturesByDateRange = async function(employeeId, startDate, endDate, flaggedOnly = false) {
  const query = {
    employee: mongoose.Types.ObjectId(employeeId),
    timestamp: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };
  
  if (flaggedOnly) {
    query.is_flagged = true;
  }
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .populate('employee', 'name email')
    .select('-metadata.encryption_key'); // Don't expose encryption keys
};

// Static method to get daily capture summary
screenCaptureSchema.statics.getDailySummary = async function(employeeId, date) {
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  
  return this.aggregate([
    {
      $match: {
        employee: new mongoose.Types.ObjectId(employeeId),
        timestamp: {
          $gte: startDate,
          $lt: endDate
        }
      }
    },
    {
      $group: {
        _id: null,
        totalCaptures: { $sum: 1 },
        flaggedCaptures: {
          $sum: { $cond: ["$is_flagged", 1, 0] }
        },
        totalFileSize: { $sum: "$file_size" },
        avgCompressionRatio: { $avg: "$compression_ratio" },
        capturesByHour: {
          $push: {
            hour: { $hour: "$timestamp" },
            timestamp: "$timestamp",
            is_flagged: "$is_flagged"
          }
        }
      }
    }
  ]);
};

// Instance method to check if capture is duplicate
screenCaptureSchema.methods.isDuplicate = async function() {
  const duplicate = await this.constructor.findOne({
    employee: this.employee,
    file_hash: this.file_hash,
    timestamp: {
      $gte: new Date(this.timestamp.getTime() - 300000), // 5 minutes before
      $lte: new Date(this.timestamp.getTime() + 300000)  // 5 minutes after
    }
  });
  
  return !!duplicate;
};

// Pre-save middleware to set delta flag
screenCaptureSchema.pre('save', async function(next) {
  if (this.isNew && this.previous_capture) {
    this.is_delta = true;
  }
  next();
});

module.exports = mongoose.model('ScreenCapture', screenCaptureSchema);
