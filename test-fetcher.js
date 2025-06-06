// Import the optimized test fetcher
const { fetchTestDataOptimized } = require('./app/lib/optimized-test-fetcher');

// Simulating the global performance object that's available in browser environments
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => {
      return process.hrtime.bigint() / BigInt(1000000);
    }
  };
}

// Set a test ID - this would be replaced with your actual test ID
const TEST_ID = 'test-1'; // Update this with a valid test ID from your database

// Function to run the test
async function runTest() {
  console.log('Starting test with optimized test fetcher...');
  console.log(`Fetching test with ID: ${TEST_ID}`);
  
  try {
    // Call the optimized test fetcher
    const result = await fetchTestDataOptimized(TEST_ID);
    
    // Check if the request was successful
    if (result.success && result.testData) {
      console.log('\n=== TEST DATA SUCCESSFULLY FETCHED ===');
      console.log(`Test Title: ${result.testData.title}`);
      console.log(`Description: ${result.testData.description}`);
      console.log(`Questions: ${result.testData.questions.length}`);
      console.log(`Time Limit: ${result.testData.timeLimit} seconds`);
      
      // Log a sample question
      if (result.testData.questions.length > 0) {
        const sampleQuestion = result.testData.questions[0];
        console.log('\nSample Question:');
        console.log(`- Text: ${sampleQuestion.text}`);
        console.log(`- Type: ${sampleQuestion.type}`);
        console.log(`- Answers: ${sampleQuestion.answers ? sampleQuestion.answers.length : 0}`);
      }
      
      // Log diagnostics
      console.log('\n=== PERFORMANCE DIAGNOSTICS ===');
      console.log(`Total Duration: ${result.diagnostics.totalDuration.toFixed(2)}ms`);
      console.log(`Question Count: ${result.diagnostics.questionCount || 0}`);
      console.log(`Errors: ${result.diagnostics.errorCount}`);
      console.log(`Warnings: ${result.diagnostics.warningCount}`);
      
      // Log detailed steps
      console.log('\nDetailed Steps:');
      result.diagnostics.steps.forEach(step => {
        console.log(`- ${step.name}: ${step.success ? 'Success' : 'Failed'}${step.duration ? ' (' + step.duration.toFixed(2) + 'ms)' : ''}`);
      });
      
      // Log any errors
      if (result.diagnostics.errors.length > 0) {
        console.log('\nErrors:');
        result.diagnostics.errors.forEach(error => {
          console.log(`- ${error.step}: ${error.error}`);
        });
      }
      
      // Log any warnings
      if (result.diagnostics.warnings.length > 0) {
        console.log('\nWarnings:');
        result.diagnostics.warnings.forEach(warning => {
          console.log(`- ${warning.message}`);
        });
      }
    } else {
      console.error('\n=== TEST DATA FETCH FAILED ===');
      console.error('Error:', result.error);
      console.error('Diagnostics:', JSON.stringify(result.diagnostics, null, 2));
    }
  } catch (error) {
    console.error('\n=== UNHANDLED EXCEPTION ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
runTest().then(() => {
  console.log('\nTest completed.');
}).catch(err => {
  console.error('Failed to run test:', err);
});