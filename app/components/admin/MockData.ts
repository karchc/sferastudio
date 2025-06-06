import { Test, Question, Category, Answer, MatchItem } from "@/app/lib/types";

// Mock data for demo purposes
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

export const mockQuestions: Question[] = [
  {
    id: "q1",
    text: "Which of the following are core modules of SAP S/4HANA? (Select all that apply)",
    type: 'multiple-choice',
    category: mockCategories[0],
    answers: [
      { id: "q1a1", text: "Financial Accounting (FI)", isCorrect: true },
      { id: "q1a2", text: "Sales and Distribution (SD)", isCorrect: true },
      { id: "q1a3", text: "Microsoft PowerPoint", isCorrect: false },
      { id: "q1a4", text: "Materials Management (MM)", isCorrect: true }
    ] as Answer[]
  },
  {
    id: "q2",
    text: "Which of the following technologies is SAP HANA based on?",
    type: 'single-choice',
    category: mockCategories[1],
    answers: [
      { id: "q2a1", text: "In-memory database\n- Uses RAM for data storage\n- Provides faster access than disk-based systems", isCorrect: true },
      { id: "q2a2", text: "Blockchain\n- Distributed ledger technology\n- Used for cryptocurrencies", isCorrect: false },
      { id: "q2a3", text: "Tape storage\n- Sequential access medium\n- Used for backups and archives", isCorrect: false },
      { id: "q2a4", text: "Floppy disk arrays\n- Obsolete storage technology\n- Limited capacity and speed", isCorrect: false }
    ] as Answer[]
  },
  {
    id: "q3",
    text: "Match the SAP module with its primary function",
    type: 'matching',
    category: mockCategories[0],
    answers: [
      { id: "q3m1", questionId: "q3", leftText: "FI", rightText: "Financial Accounting" },
      { id: "q3m2", questionId: "q3", leftText: "MM", rightText: "Materials Management" },
      { id: "q3m3", questionId: "q3", leftText: "SD", rightText: "Sales and Distribution" },
      { id: "q3m4", questionId: "q3", leftText: "PP", rightText: "Production Planning" }
    ] as MatchItem[]
  }
];

export const mockTests: Test[] = [
  {
    id: "test-1",
    title: "SAP Fundamentals Test",
    description: "Test your knowledge of basic SAP concepts",
    timeLimit: 300, // 5 minutes
    categoryIds: ["cat-1"],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Generate a simple ID (just for demo)
export function generateMockId(): string {
  return `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// Helper function to initialize mock data in admin components
export function useMockData() {
  // For categories page
  const getCategories = () => {
    return Promise.resolve(mockCategories);
  };
  
  // For questions page
  const getQuestions = () => {
    return Promise.resolve(mockQuestions);
  };
  
  // For tests page
  const getTests = () => {
    return Promise.resolve(mockTests);
  };
  
  // Mock CRUD operations
  const createItem = (item: any) => {
    return Promise.resolve({ ...item, id: generateMockId() });
  };
  
  const updateItem = (item: any) => {
    return Promise.resolve(item);
  };
  
  const deleteItem = (id: string) => {
    return Promise.resolve(true);
  };
  
  return {
    getCategories,
    getQuestions,
    getTests,
    createItem,
    updateItem,
    deleteItem
  };
}