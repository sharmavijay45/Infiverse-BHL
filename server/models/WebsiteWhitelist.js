const mongoose = require('mongoose');

const websiteWhitelistSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  category: {
    type: String,
    enum: [
      'work_related',
      'development_tools',
      'communication',
      'documentation',
      'cloud_services',
      'productivity',
      'learning',
      'system_tools',
      'approved_social',
      'design_tools',
      'project_management',
      'code_repositories',
      'other'
    ],
    default: 'work_related'
  },
  application_name: {
    type: String,
    index: true
  },
  application_executable: {
    type: String,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  is_active: {
    type: Boolean,
    default: true,
    index: true
  },
  allowed_paths: [{
    path: String,
    description: String
  }],
  blocked_paths: [{
    path: String,
    reason: String
  }],
  time_restrictions: {
    allowed_hours: {
      start: String, // "09:00"
      end: String    // "17:00"
    },
    allowed_days: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  department_restrictions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  role_restrictions: [{
    type: String,
    enum: ['admin', 'manager', 'employee', 'intern', 'contractor']
  }],
  usage_limits: {
    max_daily_minutes: Number,
    max_session_minutes: Number,
    warning_threshold_minutes: Number
  },
  added_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approval_status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  approval_date: Date,
  rejection_reason: String,
  usage_stats: {
    total_visits: { type: Number, default: 0 },
    unique_users: { type: Number, default: 0 },
    avg_session_duration: { type: Number, default: 0 },
    last_accessed: Date
  },
  monitoring_level: {
    type: String,
    enum: ['none', 'basic', 'detailed', 'full'],
    default: 'none' // Whitelisted sites have no monitoring by default
  },
  auto_screenshot: {
    type: Boolean,
    default: false // No screenshots for whitelisted sites
  },
  intelligent_monitoring: {
    enabled: { type: Boolean, default: true },
    screenshot_on_violation: { type: Boolean, default: true },
    max_screenshots_per_session: { type: Number, default: 3 },
    ai_analysis_enabled: { type: Boolean, default: true },
    violation_threshold: { type: Number, default: 2 } // Number of violations before alert
  },
  keywords: [String], // For content filtering
  regex_patterns: [String], // For advanced URL matching
  trust_level: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'high' // High trust = no monitoring
  }
}, {
  timestamps: true,
  collection: 'website_whitelist'
});

// Indexes for efficient queries
websiteWhitelistSchema.index({ domain: 1, is_active: 1 });
websiteWhitelistSchema.index({ category: 1, is_active: 1 });
websiteWhitelistSchema.index({ approval_status: 1 });
websiteWhitelistSchema.index({ 'usage_stats.total_visits': -1 });

// Virtual for full domain with protocol
websiteWhitelistSchema.virtual('full_domain').get(function() {
  return this.domain.startsWith('http') ? this.domain : `https://${this.domain}`;
});

// Static method to check if URL is whitelisted
websiteWhitelistSchema.statics.isWhitelisted = async function(url, userId = null) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    const path = urlObj.pathname;
    
    // Find matching whitelist entry
    const whitelistEntry = await this.findOne({
      $or: [
        { domain: domain },
        { domain: { $regex: domain.replace(/\./g, '\\.'), $options: 'i' } },
        { regex_patterns: { $in: [new RegExp(domain, 'i')] } }
      ],
      is_active: true,
      approval_status: 'approved'
    }).populate('department_restrictions');
    
    if (!whitelistEntry) {
      return { allowed: false, reason: 'Domain not in whitelist' };
    }
    
    // Check path restrictions
    if (whitelistEntry.blocked_paths.length > 0) {
      const blockedPath = whitelistEntry.blocked_paths.find(bp => 
        path.startsWith(bp.path)
      );
      if (blockedPath) {
        return { 
          allowed: false, 
          reason: `Path blocked: ${blockedPath.reason}`,
          entry: whitelistEntry
        };
      }
    }
    
    if (whitelistEntry.allowed_paths.length > 0) {
      const allowedPath = whitelistEntry.allowed_paths.find(ap => 
        path.startsWith(ap.path)
      );
      if (!allowedPath) {
        return { 
          allowed: false, 
          reason: 'Path not in allowed paths',
          entry: whitelistEntry
        };
      }
    }
    
    // Check time restrictions
    if (whitelistEntry.time_restrictions.allowed_hours) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      
      const startTime = this.parseTime(whitelistEntry.time_restrictions.allowed_hours.start);
      const endTime = this.parseTime(whitelistEntry.time_restrictions.allowed_hours.end);
      
      if (currentTime < startTime || currentTime > endTime) {
        return { 
          allowed: false, 
          reason: 'Outside allowed hours',
          entry: whitelistEntry
        };
      }
    }
    
    // Update usage stats
    await this.updateUsageStats(whitelistEntry._id, userId);
    
    return { 
      allowed: true, 
      entry: whitelistEntry,
      monitoring_level: whitelistEntry.monitoring_level,
      auto_screenshot: whitelistEntry.auto_screenshot
    };
    
  } catch (error) {
    return { allowed: false, reason: 'Invalid URL format' };
  }
};

// Static method to parse time string
websiteWhitelistSchema.statics.parseTime = function(timeString) {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

// Static method to update usage statistics
websiteWhitelistSchema.statics.updateUsageStats = async function(entryId, userId) {
  const update = {
    $inc: { 'usage_stats.total_visits': 1 },
    $set: { 'usage_stats.last_accessed': new Date() }
  };
  
  if (userId) {
    // This would require a more complex aggregation to track unique users
    // For now, we'll just increment total visits
  }
  
  return this.findByIdAndUpdate(entryId, update);
};

// Static method to get popular domains
websiteWhitelistSchema.statics.getPopularDomains = async function(limit = 10) {
  return this.find({ is_active: true, approval_status: 'approved' })
    .sort({ 'usage_stats.total_visits': -1 })
    .limit(limit)
    .select('domain category usage_stats description');
};

// Instance method to approve whitelist entry
websiteWhitelistSchema.methods.approve = function(approvedBy, notes = '') {
  this.approval_status = 'approved';
  this.approved_by = approvedBy;
  this.approval_date = new Date();
  if (notes) {
    this.description += ` (Approved: ${notes})`;
  }
  return this.save();
};

// Instance method to reject whitelist entry
websiteWhitelistSchema.methods.reject = function(rejectedBy, reason) {
  this.approval_status = 'rejected';
  this.approved_by = rejectedBy;
  this.approval_date = new Date();
  this.rejection_reason = reason;
  this.is_active = false;
  return this.save();
};

module.exports = mongoose.model('WebsiteWhitelist', websiteWhitelistSchema);
