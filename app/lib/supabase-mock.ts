// Mock data for development
import { 
  TestData, 
  Question, 
  Category,
  MatchItem,
  SequenceItem,
  DragDropItem
} from './types';
import { v4 as uuidv4 } from 'uuid';

// Mock categories
export const mockCategories: Category[] = [
  {
    id: "cat-1",
    name: "SAP Fundamentals",
    description: "Basic SAP concepts and overview"
  },
  {
    id: "cat-2",
    name: "SAP Technology",
    description: "Technical aspects of SAP systems"
  },
  {
    id: "cat-3",
    name: "Supply Chain",
    description: "Supply chain management in SAP"
  }
];

// Mock questions
export const mockQuestions: Question[] = [
  {
    id: "q1",
    text: "Which of the following are core modules of SAP S/4HANA? (Select all that apply)",
    type: 'multiple-choice',
    categoryId: "cat-1", // Use categoryId to match Question interface
    answers: [
      { id: "q1a1", questionId: "q1", text: "Financial Accounting (FI)", isCorrect: true },
      { id: "q1a2", questionId: "q1", text: "Sales and Distribution (SD)", isCorrect: true },
      { id: "q1a3", questionId: "q1", text: "Microsoft PowerPoint", isCorrect: false },
      { id: "q1a4", questionId: "q1", text: "Materials Management (MM)", isCorrect: true }
    ]
  },
  {
    id: "q2",
    text: "Which of the following technologies is SAP HANA based on?",
    type: 'single-choice',
    categoryId: "cat-2", // Use categoryId instead of category to match database schema
    answers: [
      { id: "q2a1", questionId: "q2", text: "In-memory database\n- Uses RAM for data storage\n- Provides faster access than disk-based systems", isCorrect: true },
      { id: "q2a2", questionId: "q2", text: "Blockchain\n- Distributed ledger technology\n- Used for cryptocurrencies", isCorrect: false },
      { id: "q2a3", questionId: "q2", text: "Tape storage\n- Sequential access medium\n- Used for backups and archives", isCorrect: false },
      { id: "q2a4", questionId: "q2", text: "Floppy disk arrays\n- Obsolete storage technology\n- Limited capacity and speed", isCorrect: false }
    ]
  },
  {
    id: "q3",
    text: "Match the SAP module with its primary function",
    type: 'matching',
    categoryId: "cat-1", // Use categoryId to match Question interface
    answers: [
      { id: "q3m1", questionId: "q3", leftText: "FI", rightText: "Financial Accounting" },
      { id: "q3m2", questionId: "q3", leftText: "MM", rightText: "Materials Management" },
      { id: "q3m3", questionId: "q3", leftText: "SD", rightText: "Sales and Distribution" },
      { id: "q3m4", questionId: "q3", leftText: "PP", rightText: "Production Planning" }
    ]
  }
];

// Mock tests
export const mockTests: TestData[] = [
  {
    id: "test-1",
    title: "SAP Fundamentals Test",
    description: "Test your knowledge of basic SAP concepts",
    timeLimit: 300, // 5 minutes
    categoryIds: ["cat-1"], // Use categoryIds array to match TestData interface
    isActive: true, // Add required field
    questions: [mockQuestions[0]],
    createdAt: new Date(),
    updatedAt: new Date(),
    sessionId: `session-${Date.now()}`,
    startTime: new Date(),
    timeRemaining: 300
  }
];

// Helper function to find mock question by ID
export function getMockQuestion(id: string): Question | undefined {
  return mockQuestions.find(q => q.id === id);
}

// Helper function to get all mock questions
export function getAllMockQuestions(): Question[] {
  return [...mockQuestions];
}

// Helper function to get mock questions by IDs 
export function getMockQuestionsByIds(ids: string[]): Question[] {
  return mockQuestions.filter(q => ids.includes(q.id));
}

// Helper function to generate a simple ID
export function generateMockId(): string {
  return `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}