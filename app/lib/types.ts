// Common types
export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  isAdmin: boolean;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Test {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  timeLimit: number; // in seconds
  categoryIds?: string[];
  categories?: Category[];
  createdBy?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  questionCount?: number;
  alreadyStarted?: boolean;
  lastScore?: number;
}

// Question types
export type QuestionType = 
  'multiple-choice' | 
  'single-choice' | 
  'true-false' | 
  'matching' | 
  'sequence' |
  'drag-drop' |
  'multiple_choice' | 
  'single_choice' | 
  'true_false' | 
  'drag_drop';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  mediaUrl?: string;
  categoryId?: string;
  category_id?: string; // Database field name
  category?: Category;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
  explanation?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
  position?: number;
  answers?: Answer[] | MatchItem[] | SequenceItem[] | DragDropItem[];
  matchItems?: MatchItem[];
  sequenceItems?: SequenceItem[];
  dragDropItems?: DragDropItem[];
}

// Answer types for different question types
export interface Answer {
  id?: string;
  questionId?: string;
  text: string;
  isCorrect: boolean;
  position?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MatchItem {
  id?: string;
  questionId?: string;
  leftText: string;
  rightText: string;
  createdAt?: Date;
}

export interface SequenceItem {
  id?: string;
  questionId?: string;
  text: string;
  correctPosition: number;
  createdAt?: Date;
}

export interface DragDropItem {
  id?: string;
  questionId?: string;
  content: string;
  targetZone: string;
  createdAt?: Date;
}

// Testing session types
export interface TestSession {
  id: string;
  testId: string;
  testTitle?: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  status: 'in_progress' | 'completed' | 'expired';
  score?: number;
  timeSpent?: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
}

export interface UserAnswer {
  questionId: string;
  questionText?: string;
  questionType?: QuestionType;
  isCorrect?: boolean;
  timeSpent?: number; // in seconds
  answers?: any; // This will be different based on question type
}

export interface TestSummary {
  testSessionId: string;
  testId: string;
  score: number;
  timeSpent: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: Date;
}

// Dashboard data types
export interface DashboardData {
  userId: string;
  statistics: {
    testsTaken: number;
    testsCompleted: number;
    testsInProgress: number;
    avgScore: number;
    totalTimeSpent: number;
    strongestCategory?: string;
    weakestCategory?: string;
  };
  testHistory: TestHistoryItem[];
  inProgressTests: InProgressTest[];
  categoryPerformance: CategoryPerformance[];
}

export interface TestHistoryItem {
  testId: string;
  testTitle: string;
  categoryName?: string;
  status: string;
  score?: number;
  startTime: Date;
  endTime?: Date;
  timeSpent?: number;
}

export interface InProgressTest {
  testSessionId: string;
  testId: string;
  testTitle: string;
  categoryName?: string;
  startTime: Date;
  timeSpent: number;
  questionsAnswered: number;
  totalQuestions: number;
  timeRemaining: number;
}

export interface CategoryPerformance {
  categoryId: string;
  categoryName: string;
  testsTaken: number;
  avgScore: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracyPercentage: number;
}

// Admin analytics types
export interface AdminAnalytics {
  summary: {
    userCount: number;
    testCount: number;
    questionCount: number;
    testSessionsCount: number;
    avgScore: number;
  };
  categoryStats: CategoryStats[];
  popularTests: PopularTest[];
}

export interface CategoryStats {
  categoryName: string;
  testCount: number;
  questionCount: number;
  avgScore: number;
}

export interface PopularTest {
  testId: string;
  testTitle: string;
  attemptCount: number;
  avgScore: number;
}

// Test taking types
export interface TestQuestion {
  id: string;
  text: string;
  type: QuestionType;
  mediaUrl?: string;
  position: number;
  answers?: any[];
  userAnswer?: any;
  isAnswered?: boolean;
  isSkipped?: boolean;
  timeSpent?: number;
}

export interface TestData {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  timeLimit: number;
  categoryIds?: string[];
  categories?: Category[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  questions: Question[];
  sessionId: string;
  startTime: Date;
  timeRemaining: number;
}

export interface ActiveTestState {
  testSessionId: string;
  test: Test;
  questions: TestQuestion[];
  currentQuestionIndex: number;
  startTime: Date;
  timeRemaining: number;
  answers: Record<string, any>;
  isCompleted: boolean;
}

// Admin form types for question answers
export interface QuestionFormData {
  id?: string;
  text: string;
  type: QuestionType;
  mediaUrl?: string;
  categoryId: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points?: number;
  explanation?: string;
  answers?: Answer[];
  matchItems?: MatchItem[];
  sequenceItems?: SequenceItem[];
  dragDropItems?: DragDropItem[];
}

export interface TestFormData {
  id?: string;
  title: string;
  description: string;
  instructions?: string;
  timeLimit: number;
  categoryIds: string[];
  isActive: boolean;
  selectedQuestions: string[];
}