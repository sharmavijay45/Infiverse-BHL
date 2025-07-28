const axios = require('axios');

async function testScreenshotAPI() {
  try {
    const employeeId = '6884ca2ab6373ccd27d55317'; // John Doe
    const date = '2025-07-26'; // Today's date
    
    console.log('🧪 Testing Screenshot API...');
    console.log(`Employee ID: ${employeeId}`);
    console.log(`Date: ${date}`);
    
    const url = `http://localhost:5000/api/monitoring/employees/${employeeId}/screenshots?date=${date}`;
    console.log(`API URL: ${url}`);
    
    // Test without auth first to see the error
    try {
      const response = await axios.get(url);
      console.log('✅ Response:', response.data);
    } catch (error) {
      console.log('❌ Error (expected without auth):', error.response?.status, error.response?.data);
      
      // Now test with a dummy token to see if auth is the issue
      try {
        const authResponse = await axios.get(url, {
          headers: { Authorization: 'Bearer dummy-token' }
        });
        console.log('✅ Auth Response:', authResponse.data);
      } catch (authError) {
        console.log('❌ Auth Error:', authError.response?.status, authError.response?.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testScreenshotAPI();
