// Test script to verify question update functionality

const questionId = '12c24c83-7b31-45c7-84cf-31edb8a0a9d6'; // Replace with actual question ID

const testData = {
  type: 'single_choice',
  text: 'Test Question - Updated at ' + new Date().toISOString(),
  categoryId: '9b6b0a20-c5f7-4eb5-b07f-ee5b228b6bc2', // Replace with actual category ID
  difficulty: 'medium',
  points: 1,
  explanation: 'This is a test explanation',
  answers: [
    { text: 'Green', isCorrect: true, position: 0 },
    { text: 'Purple', isCorrect: false, position: 1 },
    { text: 'Pink', isCorrect: false, position: 2 },
    { text: 'Blue', isCorrect: false, position: 3 }
  ]
};

async function testUpdateQuestion() {
  console.log('Testing question update with data:', testData);
  
  try {
    const response = await fetch(`http://localhost:3000/api/admin/questions/${questionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    
    const result = await response.json();
    console.log('Response data:', result);
    
    if (response.ok) {
      console.log('✅ Question updated successfully!');
    } else {
      console.error('❌ Failed to update question:', result);
    }
  } catch (error) {
    console.error('❌ Error during update:', error);
  }
}

// Run the test
testUpdateQuestion();