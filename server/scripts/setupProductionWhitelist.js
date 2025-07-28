const mongoose = require('mongoose');
const WebsiteWhitelist = require('../models/WebsiteWhitelist');
require('dotenv').config();

// Production whitelist configuration
const productionWhitelist = [
  {
    domain: 'main-workflow.vercel.app',
    category: 'work_related',
    description: 'Main workflow application - primary work platform',
    trust_level: 'high',
    intelligent_monitoring: {
      enabled: false,
      screenshot_on_violation: false,
      max_screenshots_per_session: 0,
      ai_analysis_enabled: false
    },
    approval_status: 'approved',
    is_active: true
  },
  {
    domain: 'github.com',
    category: 'code_repositories',
    description: 'GitHub - Code repository and version control platform',
    trust_level: 'high',
    intelligent_monitoring: {
      enabled: false,
      screenshot_on_violation: false,
      max_screenshots_per_session: 0,
      ai_analysis_enabled: false
    },
    approval_status: 'approved',
    is_active: true
  },
  {
    domain: 'stackoverflow.com',
    category: 'development_tools',
    description: 'Stack Overflow - Programming Q&A and technical documentation',
    trust_level: 'high',
    intelligent_monitoring: {
      enabled: false,
      screenshot_on_violation: false,
      max_screenshots_per_session: 0,
      ai_analysis_enabled: false
    },
    approval_status: 'approved',
    is_active: true
  },
  {
    domain: 'render.com',
    category: 'cloud_services',
    description: 'Render - Cloud hosting and deployment platform',
    trust_level: 'high',
    intelligent_monitoring: {
      enabled: false,
      screenshot_on_violation: false,
      max_screenshots_per_session: 0,
      ai_analysis_enabled: false
    },
    approval_status: 'approved',
    is_active: true
  },
  {
    domain: 'vercel.com',
    category: 'cloud_services',
    description: 'Vercel - Frontend deployment and hosting platform',
    trust_level: 'high',
    intelligent_monitoring: {
      enabled: false,
      screenshot_on_violation: false,
      max_screenshots_per_session: 0,
      ai_analysis_enabled: false
    },
    approval_status: 'approved',
    is_active: true
  },
  {
    domain: 'chatgpt.com',
    category: 'productivity',
    description: 'ChatGPT - AI assistant for development and productivity',
    trust_level: 'medium',
    intelligent_monitoring: {
      enabled: true,
      screenshot_on_violation: false,
      max_screenshots_per_session: 1,
      ai_analysis_enabled: true
    },
    time_restrictions: {
      allowed_hours: { start: '09:00', end: '18:00' },
      allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      timezone: 'UTC'
    },
    usage_limits: {
      max_daily_minutes: 120,
      max_session_minutes: 30,
      warning_threshold_minutes: 20
    },
    approval_status: 'approved',
    is_active: true
  },
  {
    domain: 'grok.com',
    category: 'productivity',
    description: 'Grok - AI assistant platform',
    trust_level: 'medium',
    intelligent_monitoring: {
      enabled: true,
      screenshot_on_violation: false,
      max_screenshots_per_session: 1,
      ai_analysis_enabled: true
    },
    time_restrictions: {
      allowed_hours: { start: '09:00', end: '18:00' },
      allowed_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      timezone: 'UTC'
    },
    usage_limits: {
      max_daily_minutes: 120,
      max_session_minutes: 30,
      warning_threshold_minutes: 20
    },
    approval_status: 'approved',
    is_active: true
  },
  // Additional common development tools
  {
    domain: 'npmjs.com',
    category: 'development_tools',
    description: 'NPM - Node.js package manager',
    trust_level: 'high',
    intelligent_monitoring: { enabled: false },
    approval_status: 'approved',
    is_active: true
  },
  {
    domain: 'developer.mozilla.org',
    category: 'documentation',
    description: 'MDN Web Docs - Web development documentation',
    trust_level: 'high',
    intelligent_monitoring: { enabled: false },
    approval_status: 'approved',
    is_active: true
  },
  {
    domain: 'docs.google.com',
    category: 'productivity',
    description: 'Google Docs - Document collaboration',
    trust_level: 'high',
    intelligent_monitoring: { enabled: false },
    approval_status: 'approved',
    is_active: true
  },
  {
    domain: 'slack.com',
    category: 'communication',
    description: 'Slack - Team communication platform',
    trust_level: 'high',
    intelligent_monitoring: { enabled: false },
    approval_status: 'approved',
    is_active: true
  },
  {
    domain: 'zoom.us',
    category: 'communication',
    description: 'Zoom - Video conferencing platform',
    trust_level: 'high',
    intelligent_monitoring: { enabled: false },
    approval_status: 'approved',
    is_active: true
  }
];

async function setupProductionWhitelist() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get or create admin user for added_by field
    const User = require('../models/User');
    let adminUser = await User.findOne({ role: 'Admin' });

    if (!adminUser) {
      // Create a system admin user if none exists
      adminUser = await User.create({
        name: 'System Admin',
        email: 'admin@system.local',
        password: 'temp_password_123',
        role: 'Admin',
        department: null
      });
      console.log('Created system admin user for whitelist management');
    }

    // Clear existing whitelist (optional - remove this line to keep existing entries)
    // await WebsiteWhitelist.deleteMany({});
    // console.log('Cleared existing whitelist');

    // Insert production whitelist
    for (const entry of productionWhitelist) {
      try {
        // Check if entry already exists
        const existing = await WebsiteWhitelist.findOne({ domain: entry.domain });
        
        if (existing) {
          // Update existing entry
          await WebsiteWhitelist.findByIdAndUpdate(existing._id, {
            ...entry,
            added_by: adminUser._id,
            approved_by: adminUser._id
          });
          console.log(`Updated whitelist entry: ${entry.domain}`);
        } else {
          // Create new entry
          await WebsiteWhitelist.create({
            ...entry,
            added_by: adminUser._id,
            approved_by: adminUser._id
          });
          console.log(`Created whitelist entry: ${entry.domain}`);
        }
      } catch (error) {
        console.error(`Error processing ${entry.domain}:`, error.message);
      }
    }

    console.log('\n✅ Production whitelist setup completed successfully!');
    console.log(`📊 Total entries processed: ${productionWhitelist.length}`);
    
    // Display summary
    const summary = await WebsiteWhitelist.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log('\n📈 Whitelist Summary by Category:');
    summary.forEach(item => {
      console.log(`  ${item._id}: ${item.count} entries`);
    });

  } catch (error) {
    console.error('❌ Error setting up production whitelist:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the setup
if (require.main === module) {
  setupProductionWhitelist();
}

module.exports = { setupProductionWhitelist, productionWhitelist };
