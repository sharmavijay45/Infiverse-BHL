const intelligentScreenCapture = require('../services/intelligentScreenCapture');

/**
 * Test script to demonstrate intelligent pre-screening
 */
async function testIntelligentMonitoring() {
  console.log('🧪 Testing Intelligent Pre-Screening System\n');
  
  const testEmployeeId = '683011a017ba6ac0f84fb39b'; // Replace with actual employee ID
  
  // Test cases for different types of applications/websites
  const testCases = [
    {
      name: 'VS Code (Work Tool)',
      applicationData: {
        name: 'Visual Studio Code',
        url: null
      },
      expectedResult: 'No screenshot (work-related)'
    },
    {
      name: 'GitHub (Whitelisted)',
      applicationData: {
        name: 'Chrome',
        url: 'https://github.com/user/repo'
      },
      expectedResult: 'No screenshot (whitelisted)'
    },
    {
      name: 'Stack Overflow (Whitelisted)',
      applicationData: {
        name: 'Chrome',
        url: 'https://stackoverflow.com/questions/12345'
      },
      expectedResult: 'No screenshot (whitelisted)'
    },
    {
      name: 'Facebook (Social Media)',
      applicationData: {
        name: 'Chrome',
        url: 'https://facebook.com'
      },
      expectedResult: 'Screenshot taken (non-work)'
    },
    {
      name: 'YouTube (Entertainment)',
      applicationData: {
        name: 'Chrome',
        url: 'https://youtube.com/watch?v=entertainment'
      },
      expectedResult: 'Screenshot taken (non-work)'
    },
    {
      name: 'AWS Console (Work)',
      applicationData: {
        name: 'Chrome',
        url: 'https://console.aws.amazon.com'
      },
      expectedResult: 'No screenshot (work-related)'
    },
    {
      name: 'Documentation Site (Work)',
      applicationData: {
        name: 'Chrome',
        url: 'https://docs.react.dev'
      },
      expectedResult: 'No screenshot (work-related)'
    },
    {
      name: 'Shopping Site (Personal)',
      applicationData: {
        name: 'Chrome',
        url: 'https://amazon.com/dp/product123'
      },
      expectedResult: 'Screenshot taken (non-work)'
    }
  ];
  
  console.log('Testing Pre-Screening Logic:\n');
  
  for (const testCase of testCases) {
    console.log(`📋 Testing: ${testCase.name}`);
    console.log(`   URL: ${testCase.applicationData.url || 'N/A'}`);
    console.log(`   App: ${testCase.applicationData.name}`);
    console.log(`   Expected: ${testCase.expectedResult}`);
    
    try {
      // Test the pre-screening logic
      const shouldMonitor = await intelligentScreenCapture.performPreScreening(
        testEmployeeId, 
        testCase.applicationData
      );
      
      const result = shouldMonitor ? 'Screenshot would be taken' : 'No screenshot needed';
      const status = shouldMonitor ? '🚨' : '✅';
      
      console.log(`   Result: ${status} ${result}\n`);
      
    } catch (error) {
      console.log(`   Error: ❌ ${error.message}\n`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('🎯 Test Summary:');
  console.log('✅ Work-related activities should NOT trigger screenshots');
  console.log('🚨 Non-work activities SHOULD trigger screenshots');
  console.log('📋 Whitelisted sites are checked before pre-screening');
  console.log('\n🔍 The system now intelligently decides BEFORE taking screenshots!');
}

// Run the test if this file is executed directly
if (require.main === module) {
  testIntelligentMonitoring().catch(console.error);
}

module.exports = { testIntelligentMonitoring };
