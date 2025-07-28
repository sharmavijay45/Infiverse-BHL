const mongoose = require('mongoose');
const ScreenCapture = require('../models/ScreenCapture');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/workflow-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

/**
 * Create test violation screenshots to demonstrate the system
 */
async function createTestViolations() {
  try {
    console.log('🧪 Creating test violation screenshots...\n');

    // Use the live monitoring employee ID
    const employeeId = '683011a017ba6ac0f84fb39b'; // Live monitoring employee
    console.log(`📋 Using live monitoring employee ID: ${employeeId}`);

    // Test violation scenarios
    const testViolations = [
      {
        employee: employeeId,
        session_id: 'test_session_' + Date.now(),
        timestamp: new Date('2025-07-26T18:15:00.000Z'),
        file_path: '/screenshots/test_facebook_violation.png',
        file_hash: 'fb_' + Math.random().toString(36).substring(7),
        file_size: 245760,
        screen_resolution: { width: 1920, height: 1080 },
        active_application: {
          name: 'Google Chrome',
          title: 'Facebook - Social Media',
          url: 'https://facebook.com/feed'
        },
        capture_trigger: 'unauthorized_access',
        is_flagged: true,
        metadata: {
          intelligent_capture: true,
          violation_session_id: `${employeeId}_${Date.now()}`,
          screenshot_sequence: 1,
          max_screenshots: 3,
          blur_applied: false,
          privacy_level: 'full',
          encryption_key: 'test_key_' + Math.random().toString(36).substring(7),
          ai_analysis: {
            activityType: 'Social Media',
            activityDescription: 'Employee browsing Facebook social media feed during work hours',
            taskRelevance: 5,
            alertReason: 'Non-work-related social media activity detected',
            confidence: 92
          },
          ocr_analysis: {
            text: 'Facebook\nNews Feed\nWhat\'s on your mind?\nLike Comment Share\nSocial media posts and updates',
            confidence: 88,
            extractedAt: new Date()
          }
        }
      },
      {
        employee: employeeId,
        session_id: 'test_session_' + (Date.now() - 30 * 60 * 1000),
        timestamp: new Date('2025-07-26T17:45:00.000Z'), // 30 minutes ago
        file_path: '/screenshots/test_youtube_violation.png',
        file_hash: 'yt_' + Math.random().toString(36).substring(7),
        file_size: 312450,
        screen_resolution: { width: 1920, height: 1080 },
        active_application: {
          name: 'Google Chrome',
          title: 'Funny Cat Videos - YouTube',
          url: 'https://youtube.com/watch?v=funny-cats-compilation'
        },
        capture_trigger: 'unauthorized_site',
        is_flagged: true,
        metadata: {
          intelligent_capture: true,
          violation_session_id: `${employeeId}_${Date.now() - 30 * 60 * 1000}`,
          screenshot_sequence: 1,
          max_screenshots: 3,
          blur_applied: false,
          privacy_level: 'full',
          encryption_key: 'test_key_' + Math.random().toString(36).substring(7),
          ai_analysis: {
            activityType: 'Entertainment',
            activityDescription: 'Employee watching entertainment videos on YouTube',
            taskRelevance: 8,
            alertReason: 'Personal entertainment content during work hours',
            confidence: 89
          },
          ocr_analysis: {
            text: 'YouTube\nFunny Cat Videos Compilation 2024\n👍 125K 👎 Subscribe\nComments: This is hilarious! 😂',
            confidence: 91,
            extractedAt: new Date()
          }
        }
      },
      {
        employee: employeeId,
        session_id: 'test_session_' + (Date.now() - 60 * 60 * 1000),
        timestamp: new Date('2025-07-26T17:15:00.000Z'), // 1 hour ago
        file_path: '/screenshots/test_shopping_violation.png',
        file_hash: 'shop_' + Math.random().toString(36).substring(7),
        file_size: 198340,
        screen_resolution: { width: 1920, height: 1080 },
        active_application: {
          name: 'Google Chrome',
          title: 'Amazon.com: Online Shopping',
          url: 'https://amazon.com/dp/B08N5WRWNW'
        },
        capture_trigger: 'unauthorized_access',
        is_flagged: true,
        metadata: {
          intelligent_capture: true,
          violation_session_id: `${employeeId}_${Date.now() - 60 * 60 * 1000}`,
          screenshot_sequence: 1,
          max_screenshots: 3,
          blur_applied: false,
          privacy_level: 'full',
          encryption_key: 'test_key_' + Math.random().toString(36).substring(7),
          ai_analysis: {
            activityType: 'Online Shopping',
            activityDescription: 'Employee browsing Amazon for personal shopping',
            taskRelevance: 2,
            alertReason: 'Personal shopping activity during work hours',
            confidence: 95
          },
          ocr_analysis: {
            text: 'Amazon.com\nAdd to Cart\nBuy Now\nPrice: $29.99\nFree shipping\nCustomer Reviews: 4.5 stars',
            confidence: 93,
            extractedAt: new Date()
          }
        }
      },
      {
        employee: employeeId,
        session_id: 'test_session_' + (Date.now() - 90 * 60 * 1000),
        timestamp: new Date('2025-07-26T16:45:00.000Z'), // 1.5 hours ago
        file_path: '/screenshots/test_news_violation.png',
        file_hash: 'news_' + Math.random().toString(36).substring(7),
        file_size: 267890,
        screen_resolution: { width: 1920, height: 1080 },
        active_application: {
          name: 'Google Chrome',
          title: 'Breaking News - Celebrity Gossip',
          url: 'https://entertainment-news.com/celebrity-gossip'
        },
        capture_trigger: 'unauthorized_site',
        is_flagged: true,
        metadata: {
          intelligent_capture: true,
          violation_session_id: `${employeeId}_${Date.now() - 90 * 60 * 1000}`,
          screenshot_sequence: 1,
          max_screenshots: 3,
          blur_applied: false,
          privacy_level: 'full',
          encryption_key: 'test_key_' + Math.random().toString(36).substring(7),
          ai_analysis: {
            activityType: 'Entertainment News',
            activityDescription: 'Employee reading celebrity gossip and entertainment news',
            taskRelevance: 0,
            alertReason: 'Non-work-related entertainment content',
            confidence: 87
          },
          ocr_analysis: {
            text: 'Entertainment News\nCelebrity Gossip\nBreaking: Celebrity spotted at...\nLatest fashion trends\nHollywood updates',
            confidence: 85,
            extractedAt: new Date()
          }
        }
      }
    ];

    // Create the test violations
    for (const violation of testViolations) {
      const screenshot = new ScreenCapture(violation);
      await screenshot.save();
      
      console.log(`✅ Created violation: ${violation.active_application.title}`);
      console.log(`   URL: ${violation.active_application.url}`);
      console.log(`   AI Analysis: ${violation.metadata.ai_analysis.activityDescription}`);
      console.log(`   Task Relevance: ${violation.metadata.ai_analysis.taskRelevance}%\n`);
    }

    console.log(`🎉 Successfully created ${testViolations.length} test violation screenshots!`);
    console.log('\n📋 These screenshots will now appear in the Employee Monitoring dashboard');
    console.log('🔍 Only violation screenshots are shown to admins');
    console.log('🧠 Each screenshot includes AI analysis explaining why it was flagged');
    
  } catch (error) {
    console.error('❌ Error creating test violations:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
if (require.main === module) {
  createTestViolations();
}

module.exports = { createTestViolations };
