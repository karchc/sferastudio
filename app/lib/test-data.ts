import { 
  Test, 
  Question, 
  Answer, 
  MatchItem, 
  SequenceItem, 
  DragDropItem, 
  Category,
  TestSession,
  UserAnswer,
  DashboardData,
  TestHistoryItem,
  InProgressTest,
  CategoryPerformance,
  AdminAnalytics
} from './types';

// Mock categories
export const mockCategories: Category[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Programming',
    description: 'Computer programming and software development topics'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Mathematics',
    description: 'Math concepts from basic to advanced'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Science',
    description: 'General science topics including physics, chemistry, and biology'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'History',
    description: 'Historical events and figures'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Languages',
    description: 'Foreign language learning and linguistics'
  }
];

// Mock tests
export const mockTests: Test[] = [
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    title: 'JavaScript Basics',
    description: 'Test your knowledge of basic JavaScript concepts',
    timeLimit: 900, // 15 minutes
    categoryIds: ['11111111-1111-1111-1111-111111111111'],
    categories: [mockCategories[0]],
    isActive: true,
    questionCount: 7,
    alreadyStarted: false
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    title: 'Advanced Algebra',
    description: 'Test covering advanced algebra concepts',
    timeLimit: 1200, // 20 minutes
    categoryIds: ['22222222-2222-2222-2222-222222222222'],
    categories: [mockCategories[1]],
    isActive: true,
    questionCount: 3,
    alreadyStarted: false
  },
  {
    id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    title: 'Basic Chemistry',
    description: 'Fundamentals of chemistry',
    timeLimit: 1500, // 25 minutes
    categoryIds: ['33333333-3333-3333-3333-333333333333'],
    categories: [mockCategories[2]],
    isActive: true,
    questionCount: 2,
    alreadyStarted: true,
    lastScore: 85
  }
];

// Mock questions for JavaScript test
export const mockJSQuestions: Question[] = [
  {
    id: 'q1111111-1111-1111-1111-111111111111',
    text: 'Which of the following is NOT a JavaScript data type?',
    type: 'multiple-choice',
    categoryId: '11111111-1111-1111-1111-111111111111',
    position: 1,
    answers: [
      { id: 'a1', questionId: 'q1111111-1111-1111-1111-111111111111', text: 'String', isCorrect: false },
      { id: 'a2', questionId: 'q1111111-1111-1111-1111-111111111111', text: 'Number', isCorrect: false },
      { id: 'a3', questionId: 'q1111111-1111-1111-1111-111111111111', text: 'Boolean', isCorrect: false },
      { id: 'a4', questionId: 'q1111111-1111-1111-1111-111111111111', text: 'Character', isCorrect: true }
    ]
  },
  {
    id: 'q2222222-2222-2222-2222-222222222222',
    text: 'Which of these methods modifies the original array?',
    type: 'multiple-choice',
    categoryId: '11111111-1111-1111-1111-111111111111',
    position: 2,
    answers: [
      { id: 'b1', questionId: 'q2222222-2222-2222-2222-222222222222', text: 'map()', isCorrect: false },
      { id: 'b2', questionId: 'q2222222-2222-2222-2222-222222222222', text: 'filter()', isCorrect: false },
      { id: 'b3', questionId: 'q2222222-2222-2222-2222-222222222222', text: 'push()', isCorrect: true },
      { id: 'b4', questionId: 'q2222222-2222-2222-2222-222222222222', text: 'reduce()', isCorrect: false }
    ]
  },
  {
    id: 'q3333333-3333-3333-3333-333333333333',
    text: 'What is the output of console.log(typeof null) in JavaScript?',
    type: 'single-choice',
    categoryId: '11111111-1111-1111-1111-111111111111',
    position: 3,
    answers: [
      { id: 'c1', questionId: 'q3333333-3333-3333-3333-333333333333', text: 'null', isCorrect: false },
      { id: 'c2', questionId: 'q3333333-3333-3333-3333-333333333333', text: 'undefined', isCorrect: false },
      { id: 'c3', questionId: 'q3333333-3333-3333-3333-333333333333', text: 'object', isCorrect: true },
      { id: 'c4', questionId: 'q3333333-3333-3333-3333-333333333333', text: 'string', isCorrect: false }
    ]
  },
  {
    id: 'q4444444-4444-4444-4444-444444444444',
    text: 'JavaScript is a statically typed language.',
    type: 'true-false',
    categoryId: '11111111-1111-1111-1111-111111111111',
    position: 4,
    answers: [
      { id: 'd1', questionId: 'q4444444-4444-4444-4444-444444444444', text: 'True', isCorrect: false },
      { id: 'd2', questionId: 'q4444444-4444-4444-4444-444444444444', text: 'False', isCorrect: true }
    ]
  },
  {
    id: 'q5555555-5555-5555-5555-555555555555',
    text: 'Match the JavaScript method with its purpose:',
    type: 'matching',
    categoryId: '11111111-1111-1111-1111-111111111111',
    position: 5,
    answers: [
      { 
        id: 'e1', 
        questionId: 'q5555555-5555-5555-5555-555555555555', 
        leftText: 'push()', 
        rightText: 'Add elements to the end of an array'
      } as unknown as MatchItem,
      { 
        id: 'e2', 
        questionId: 'q5555555-5555-5555-5555-555555555555', 
        leftText: 'pop()', 
        rightText: 'Remove the last element from an array'
      } as unknown as MatchItem,
      { 
        id: 'e3', 
        questionId: 'q5555555-5555-5555-5555-555555555555', 
        leftText: 'shift()', 
        rightText: 'Remove the first element from an array'
      } as unknown as MatchItem,
      { 
        id: 'e4', 
        questionId: 'q5555555-5555-5555-5555-555555555555', 
        leftText: 'unshift()', 
        rightText: 'Add elements to the beginning of an array'
      } as unknown as MatchItem
    ]
  },
  {
    id: 'q6666666-6666-6666-6666-666666666666',
    text: 'Arrange the following steps in the correct order to declare and use a JavaScript function:',
    type: 'sequence',
    categoryId: '11111111-1111-1111-1111-111111111111',
    position: 6,
    answers: [
      { 
        id: 'f1', 
        questionId: 'q6666666-6666-6666-6666-666666666666', 
        text: 'Write the function keyword', 
        correctPosition: 1
      } as unknown as SequenceItem,
      { 
        id: 'f2', 
        questionId: 'q6666666-6666-6666-6666-666666666666', 
        text: 'Define the function name', 
        correctPosition: 2
      } as unknown as SequenceItem,
      { 
        id: 'f3', 
        questionId: 'q6666666-6666-6666-6666-666666666666', 
        text: 'Define parameters in parentheses', 
        correctPosition: 3
      } as unknown as SequenceItem,
      { 
        id: 'f4', 
        questionId: 'q6666666-6666-6666-6666-666666666666', 
        text: 'Open curly braces', 
        correctPosition: 4
      } as unknown as SequenceItem
    ]
  },
  {
    id: 'q7777777-7777-7777-7777-777777777777',
    text: 'Categorize the following JavaScript features into their correct categories:',
    type: 'drag-drop',
    categoryId: '11111111-1111-1111-1111-111111111111',
    position: 7,
    answers: [
      { 
        id: 'g1', 
        questionId: 'q7777777-7777-7777-7777-777777777777', 
        content: 'let', 
        targetZone: 'ES6_Features'
      } as unknown as DragDropItem,
      { 
        id: 'g2', 
        questionId: 'q7777777-7777-7777-7777-777777777777', 
        content: 'const', 
        targetZone: 'ES6_Features'
      } as unknown as DragDropItem,
      { 
        id: 'g3', 
        questionId: 'q7777777-7777-7777-7777-777777777777', 
        content: 'var', 
        targetZone: 'Legacy_Features'
      } as unknown as DragDropItem,
      { 
        id: 'g4', 
        questionId: 'q7777777-7777-7777-7777-777777777777', 
        content: 'function', 
        targetZone: 'Legacy_Features'
      } as unknown as DragDropItem
    ]
  }
];

// Mock test session data for dashboard
export const mockTestHistory: TestHistoryItem[] = [
  {
    testId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    testTitle: 'JavaScript Basics',
    categoryName: 'Programming',
    status: 'completed',
    score: 85,
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 23), // 23 hours ago
    timeSpent: 3600 // 1 hour
  },
  {
    testId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    testTitle: 'Advanced Algebra',
    categoryName: 'Mathematics',
    status: 'completed',
    score: 70,
    startTime: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    endTime: new Date(Date.now() - 1000 * 60 * 60 * 47), // 47 hours ago
    timeSpent: 2700 // 45 minutes
  }
];

// Mock in-progress tests
export const mockInProgressTests: InProgressTest[] = [
  {
    testSessionId: 'ssssssss-1111-1111-1111-ssssssssssss',
    testId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
    testTitle: 'Basic Chemistry',
    categoryName: 'Science',
    startTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    timeSpent: 1800, // 30 minutes
    questionsAnswered: 1,
    totalQuestions: 2,
    timeRemaining: 900 // 15 minutes
  }
];

// Mock category performance
export const mockCategoryPerformance: CategoryPerformance[] = [
  {
    categoryId: '11111111-1111-1111-1111-111111111111',
    categoryName: 'Programming',
    testsTaken: 1,
    avgScore: 85,
    correctAnswers: 6,
    totalQuestions: 7,
    accuracyPercentage: 85.71
  },
  {
    categoryId: '22222222-2222-2222-2222-222222222222',
    categoryName: 'Mathematics',
    testsTaken: 1,
    avgScore: 70,
    correctAnswers: 2,
    totalQuestions: 3,
    accuracyPercentage: 66.67
  },
  {
    categoryId: '33333333-3333-3333-3333-333333333333',
    categoryName: 'Science',
    testsTaken: 0,
    avgScore: 0,
    correctAnswers: 0,
    totalQuestions: 0,
    accuracyPercentage: 0
  }
];

// Mock dashboard data
export const mockDashboardData: DashboardData = {
  userId: 'uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu',
  statistics: {
    testsTaken: 3,
    testsCompleted: 2,
    testsInProgress: 1,
    avgScore: 77.5,
    totalTimeSpent: 6300, // 1 hour 45 minutes
    strongestCategory: 'Programming',
    weakestCategory: 'Mathematics'
  },
  testHistory: mockTestHistory,
  inProgressTests: mockInProgressTests,
  categoryPerformance: mockCategoryPerformance
};

// Mock admin analytics
export const mockAdminAnalytics: AdminAnalytics = {
  summary: {
    userCount: 2,
    testCount: 3,
    questionCount: 12,
    testSessionsCount: 3,
    avgScore: 77.5
  },
  categoryStats: [
    {
      categoryName: 'Programming',
      testCount: 1,
      questionCount: 7,
      avgScore: 85
    },
    {
      categoryName: 'Mathematics',
      testCount: 1,
      questionCount: 3,
      avgScore: 70
    },
    {
      categoryName: 'Science',
      testCount: 1,
      questionCount: 2,
      avgScore: 0
    }
  ],
  popularTests: [
    {
      testId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      testTitle: 'JavaScript Basics',
      attemptCount: 1,
      avgScore: 85
    },
    {
      testId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      testTitle: 'Advanced Algebra',
      attemptCount: 1,
      avgScore: 70
    },
    {
      testId: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
      testTitle: 'Basic Chemistry',
      attemptCount: 1,
      avgScore: 0
    }
  ]
};

// Function to generate mock data for development
export function getMockData() {
  return {
    categories: mockCategories,
    tests: mockTests,
    questions: mockJSQuestions,
    dashboard: mockDashboardData,
    adminAnalytics: mockAdminAnalytics
  };
}

// Generate mock test session for testing
export function createMockTestSession(testId: string): TestSession {
  return {
    id: `session-${Date.now()}`,
    testId,
    userId: 'uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu',
    startTime: new Date(),
    status: 'in_progress',
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Generate mock test summary
export function createMockTestSummary(testId: string): any {
  return {
    testSessionId: `session-${Date.now()}`,
    testId,
    score: 85,
    timeSpent: 1800,
    correctAnswers: 6,
    totalQuestions: 7,
    completedAt: new Date()
  };
}

// Create a test with questions for preview
export const previewTest = {
  ...mockTests[0],  // Use JavaScript Basics test as the base
  questions: mockJSQuestions,  // Include all questions
  sessionId: `preview-session-${Date.now()}`,  // Generate a unique session ID for preview
  startTime: new Date(),
  timeLimit: mockTests[0].timeLimit,
  timeRemaining: mockTests[0].timeLimit
};