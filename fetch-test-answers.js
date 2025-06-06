// Script to fetch test and answers using the API endpoint
const https = require('https');

// Test ID to fetch
const testId = 'ee6d5721-45e0-4ceb-a024-d7d5eee8e145';

// Function to make API request
function fetchFromApi(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: endpoint,
      method: 'GET'
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function fetchTestData() {
  try {
    console.log(`Fetching test data, questions and answers for test ID: ${testId}`);
    
    // Use our debug API endpoint to get everything
    const apiEndpoint = `/api/diagnose/test-debug?testId=${testId}&includeQuestions=true&includeAnswers=true`;
    
    console.log(`API Endpoint: ${apiEndpoint}`);
    console.log('Note: This must be run with the NextJS app server running on localhost:3000');
    
    const data = await fetchFromApi(apiEndpoint);
    
    console.log('API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`\nTest: ${data.test.title}`);
      console.log(`Questions: ${data.questions?.length || 0}`);
      
      if (data.answers) {
        const answerCount = Object.values(data.answers).reduce((sum, arr) => sum + arr.length, 0);
        const questionsWithAnswers = Object.keys(data.answers).length;
        console.log(`Questions with answers: ${questionsWithAnswers}/${data.questions?.length || 0}`);
        console.log(`Total answers: ${answerCount}`);
      }
    } else {
      console.error('API call failed');
    }
  } catch (error) {
    console.error('Error fetching test data:', error);
  }
}

// Execute the function
fetchTestData();