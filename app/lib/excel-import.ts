import ExcelJS from 'exceljs';

// ============================================================================
// Types
// ============================================================================

export interface ImportedTest {
  testName: string;
  description?: string;
  timeLimit: number; // in minutes
  isActive: boolean;
  isFree: boolean;
  price?: number;
  currency?: string;
  feature: boolean;
}

export interface ImportedCategory {
  testName: string;
  categoryName: string;
  description?: string;
}

export interface ImportedQuestion {
  testName: string;
  categoryName: string;
  position: number;
  questionType: 'single_choice' | 'multiple_choice';
  questionText: string;
  imageUrl?: string; // Optional URL to question image
  isPreview?: boolean; // Whether this question is available for preview
  options: string[];
  correctAnswers: number[]; // 1-indexed option numbers
  explanation?: string;
}

export interface ImportedDropdownStatement {
  statementNum: number;
  statementText: string;
  options: string[];
  correctAnswer: string;
}

export interface ImportedDropdownQuestion {
  testName: string;
  categoryName: string;
  position: number;
  questionText: string;
  imageUrl?: string; // Optional URL to question image
  isPreview?: boolean; // Whether this question is available for preview
  statements: ImportedDropdownStatement[];
  explanation?: string;
}

export interface ParsedExcelData {
  tests: ImportedTest[];
  categories: ImportedCategory[];
  questions: ImportedQuestion[];
  dropdownQuestions: ImportedDropdownQuestion[];
}

export interface ValidationError {
  sheet: string;
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ParseResult {
  success: boolean;
  data?: ParsedExcelData;
  errors: ValidationError[];
  warnings: ValidationError[];
}

// ============================================================================
// Main Parse Function
// ============================================================================

export async function parseTestExcelFile(buffer: Buffer): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Parse each sheet (using new sheet names)
  const tests = parseTestsSheet(workbook, errors, warnings);
  const categories = parseCategoriesSheet(workbook, errors, warnings);
  const questions = parseQuestionsSheet(workbook, errors, warnings);
  const dropdownQuestions = parseDropdownQuestionsSheet(workbook, errors, warnings);

  // Cross-sheet validation
  validateCrossSheetReferences(tests, categories, questions, dropdownQuestions, errors, warnings);

  if (errors.length > 0) {
    return {
      success: false,
      errors,
      warnings
    };
  }

  return {
    success: true,
    data: {
      tests,
      categories,
      questions,
      dropdownQuestions
    },
    errors: [],
    warnings
  };
}

// ============================================================================
// Sheet Parsers
// ============================================================================

function parseTestsSheet(
  workbook: ExcelJS.Workbook,
  errors: ValidationError[],
  warnings: ValidationError[]
): ImportedTest[] {
  // Try both old and new sheet names for backwards compatibility
  let sheet = workbook.getWorksheet('Tests');
  if (!sheet) {
    sheet = workbook.getWorksheet('Test Metadata');
  }

  if (!sheet) {
    errors.push({
      sheet: 'Tests',
      row: 0,
      column: '',
      message: 'Sheet "Tests" not found in the Excel file',
      severity: 'error'
    });
    return [];
  }

  const tests: ImportedTest[] = [];
  const seenTestNames = new Set<string>();

  sheet.eachRow((row, rowNumber) => {
    // Skip header row
    if (rowNumber === 1) return;

    const testName = getCellValue(row, 1);

    // Skip empty rows or instruction rows
    if (!testName ||
        testName.toString().startsWith('UNIQUE') ||
        testName.toString().startsWith('Replace') ||
        testName.toString().includes('test name')) {
      return;
    }

    // Check for duplicate test names
    if (seenTestNames.has(testName)) {
      errors.push({
        sheet: 'Tests',
        row: rowNumber,
        column: 'A',
        message: `Duplicate Test Name: "${testName}". Each test must have a unique name.`,
        severity: 'error'
      });
      return;
    }
    seenTestNames.add(testName);

    // Parse time limit (column C = 3)
    const timeLimitRaw = getCellValue(row, 3);
    const timeLimit = parseInt(timeLimitRaw, 10);
    if (isNaN(timeLimit) || timeLimit <= 0) {
      errors.push({
        sheet: 'Tests',
        row: rowNumber,
        column: 'C',
        message: `Invalid time limit "${timeLimitRaw}". Must be a positive number (minutes).`,
        severity: 'error'
      });
      return;
    }

    // Parse booleans (columns D and E)
    const isActive = parseBoolean(getCellValue(row, 4), true);
    const isFree = parseBoolean(getCellValue(row, 5), false);

    // Parse price (column F)
    const priceRaw = getCellValue(row, 6);
    const price = priceRaw ? parseFloat(priceRaw) : undefined;

    // Parse feature flag (column H = 8)
    const feature = parseBoolean(getCellValue(row, 8), false);

    tests.push({
      testName,
      description: getCellValue(row, 2) || undefined,
      timeLimit,
      isActive,
      isFree,
      price: isFree ? undefined : (price || undefined),
      currency: getCellValue(row, 7) || 'USD',
      feature
    });
  });

  if (tests.length === 0) {
    errors.push({
      sheet: 'Tests',
      row: 0,
      column: '',
      message: 'No valid tests found in Tests sheet',
      severity: 'error'
    });
  }

  return tests;
}

function parseCategoriesSheet(
  workbook: ExcelJS.Workbook,
  errors: ValidationError[],
  warnings: ValidationError[]
): ImportedCategory[] {
  const sheet = workbook.getWorksheet('Categories');
  if (!sheet) {
    errors.push({
      sheet: 'Categories',
      row: 0,
      column: '',
      message: 'Sheet "Categories" not found in the Excel file',
      severity: 'error'
    });
    return [];
  }

  const categories: ImportedCategory[] = [];

  sheet.eachRow((row, rowNumber) => {
    // Skip header row
    if (rowNumber === 1) return;

    const testName = getCellValue(row, 1);
    const categoryName = getCellValue(row, 2);

    // Skip empty rows or instruction rows
    if (!testName || !categoryName ||
        testName.toString().startsWith('Must match') ||
        categoryName.toString().startsWith('Category name') ||
        testName.toString().includes('Test Name')) {
      return;
    }

    categories.push({
      testName,
      categoryName,
      description: getCellValue(row, 3) || undefined
    });
  });

  return categories;
}

function parseQuestionsSheet(
  workbook: ExcelJS.Workbook,
  errors: ValidationError[],
  warnings: ValidationError[]
): ImportedQuestion[] {
  // Try both old and new sheet names
  let sheet = workbook.getWorksheet('Questions');
  if (!sheet) {
    sheet = workbook.getWorksheet('Questions - Simple');
  }

  if (!sheet) {
    warnings.push({
      sheet: 'Questions',
      row: 0,
      column: '',
      message: 'Sheet "Questions" not found. No questions will be imported.',
      severity: 'warning'
    });
    return [];
  }

  const questions: ImportedQuestion[] = [];
  // Accept both hyphen and underscore formats, normalize to underscore
  const validTypes = ['single-choice', 'multiple-choice', 'single_choice', 'multiple_choice'];

  sheet.eachRow((row, rowNumber) => {
    // Skip header row
    if (rowNumber === 1) return;

    const testName = getCellValue(row, 1);
    const questionType = getCellValue(row, 4)?.toLowerCase();

    // Skip empty rows or instruction rows
    if (!testName || !questionType ||
        testName.toString().startsWith('Must match') ||
        testName.toString() === '1,2,3...' ||
        testName.toString().includes('Test Name')) {
      return;
    }

    // Validate question type
    if (!validTypes.includes(questionType)) {
      errors.push({
        sheet: 'Questions',
        row: rowNumber,
        column: 'D',
        message: `Invalid question type "${questionType}". Must be one of: ${validTypes.join(', ')}`,
        severity: 'error'
      });
      return;
    }

    // Parse category (column B = 2)
    const categoryName = getCellValue(row, 2);
    if (!categoryName) {
      errors.push({
        sheet: 'Questions',
        row: rowNumber,
        column: 'B',
        message: 'Category name is required',
        severity: 'error'
      });
      return;
    }

    // Parse position (column C = 3)
    const positionRaw = getCellValue(row, 3);
    const position = parseInt(positionRaw, 10);
    if (isNaN(position) || position <= 0) {
      errors.push({
        sheet: 'Questions',
        row: rowNumber,
        column: 'C',
        message: `Invalid position "${positionRaw}". Must be a positive number.`,
        severity: 'error'
      });
      return;
    }

    // Parse question text (column E = 5)
    const questionText = getCellValue(row, 5);
    if (!questionText) {
      errors.push({
        sheet: 'Questions',
        row: rowNumber,
        column: 'E',
        message: 'Question text is required',
        severity: 'error'
      });
      return;
    }

    // Parse image URL (column F = 6)
    const imageUrl = getCellValue(row, 6) || undefined;

    // Parse preview flag (column G = 7)
    const previewRaw = getCellValue(row, 7);
    const isPreview = parseBoolean(previewRaw, false);

    // Parse options (columns H-M, indices 8-13, up to 6 options)
    const options: string[] = [];
    for (let i = 8; i <= 13; i++) {
      const opt = getCellValue(row, i);
      if (opt) {
        options.push(opt);
      }
    }

    if (options.length < 2) {
      errors.push({
        sheet: 'Questions',
        row: rowNumber,
        column: 'H-M',
        message: `At least 2 options are required. Found ${options.length}.`,
        severity: 'error'
      });
      return;
    }

    // Parse correct answers (column N = 14)
    const correctAnswersRaw = getCellValue(row, 14);
    if (!correctAnswersRaw) {
      errors.push({
        sheet: 'Questions',
        row: rowNumber,
        column: 'N',
        message: 'Correct answer(s) is required',
        severity: 'error'
      });
      return;
    }

    const correctAnswers = correctAnswersRaw
      .toString()
      .split(',')
      .map((n: string) => parseInt(n.trim(), 10))
      .filter((n: number) => !isNaN(n) && n >= 1 && n <= options.length);

    if (correctAnswers.length === 0) {
      errors.push({
        sheet: 'Questions',
        row: rowNumber,
        column: 'N',
        message: `Invalid correct answer(s) "${correctAnswersRaw}". Must be numbers 1-${options.length}.`,
        severity: 'error'
      });
      return;
    }

    // Normalize question type to underscore format
    const normalizedType = questionType.replace('-', '_') as ImportedQuestion['questionType'];

    // Validate single-choice has only one answer
    if ((questionType === 'single-choice' || questionType === 'single_choice') && correctAnswers.length > 1) {
      warnings.push({
        sheet: 'Questions',
        row: rowNumber,
        column: 'N',
        message: `${questionType} question has multiple correct answers. Using only the first one.`,
        severity: 'warning'
      });
      correctAnswers.length = 1;
    }

    // Parse explanation (column O = 15)
    const explanation = getCellValue(row, 15) || undefined;

    questions.push({
      testName,
      categoryName,
      position,
      questionType: normalizedType,
      questionText,
      imageUrl,
      isPreview,
      options,
      correctAnswers,
      explanation
    });
  });

  return questions;
}

function parseDropdownQuestionsSheet(
  workbook: ExcelJS.Workbook,
  errors: ValidationError[],
  warnings: ValidationError[]
): ImportedDropdownQuestion[] {
  const sheet = workbook.getWorksheet('Dropdown Questions');
  if (!sheet) {
    // Dropdown sheet is optional - no error, just return empty
    return [];
  }

  // Group rows by test+category+position+questionText to form complete questions
  const questionMap = new Map<string, {
    testName: string;
    categoryName: string;
    position: number;
    questionText: string;
    imageUrl?: string;
    isPreview?: boolean;
    statements: ImportedDropdownStatement[];
    explanation?: string;
  }>();

  sheet.eachRow((row, rowNumber) => {
    // Skip header row and instruction row
    if (rowNumber <= 2) return;

    const testName = getCellValue(row, 1);
    const categoryName = getCellValue(row, 2);
    const positionRaw = getCellValue(row, 3);
    const questionText = getCellValue(row, 4);

    // Skip empty rows or instruction-like rows
    if (!testName || !questionText ||
        testName.toString().startsWith('Select from') ||
        testName.toString().includes('Test Name')) {
      return;
    }

    // Parse position
    const position = parseInt(positionRaw, 10);
    if (isNaN(position) || position <= 0) {
      errors.push({
        sheet: 'Dropdown Questions',
        row: rowNumber,
        column: 'C',
        message: `Invalid position "${positionRaw}". Must be a positive number.`,
        severity: 'error'
      });
      return;
    }

    // Parse image URL (column E = 5) - only used from first statement
    const imageUrl = getCellValue(row, 5) || undefined;

    // Parse preview flag (column F = 6) - only used from first statement
    const previewRaw = getCellValue(row, 6);
    const isPreview = previewRaw ? parseBoolean(previewRaw, false) : undefined;

    // Parse statement number (column G = 7)
    const statementNumRaw = getCellValue(row, 7);
    const statementNum = parseInt(statementNumRaw, 10) || 1;

    // Parse statement text (column H = 8)
    const statementText = getCellValue(row, 8);
    if (!statementText) {
      errors.push({
        sheet: 'Dropdown Questions',
        row: rowNumber,
        column: 'H',
        message: 'Statement text is required',
        severity: 'error'
      });
      return;
    }

    // Parse options (columns I-N, indices 9-14, up to 6 options)
    const options: string[] = [];
    for (let i = 9; i <= 14; i++) {
      const opt = getCellValue(row, i);
      if (opt) {
        options.push(opt);
      }
    }

    if (options.length < 2) {
      errors.push({
        sheet: 'Dropdown Questions',
        row: rowNumber,
        column: 'I-N',
        message: `At least 2 options are required. Found ${options.length}.`,
        severity: 'error'
      });
      return;
    }

    // Parse correct answer (column O = 15)
    const correctAnswer = getCellValue(row, 15);
    if (!correctAnswer) {
      errors.push({
        sheet: 'Dropdown Questions',
        row: rowNumber,
        column: 'O',
        message: 'Correct answer is required',
        severity: 'error'
      });
      return;
    }

    // Validate correct answer is one of the options
    if (!options.includes(correctAnswer)) {
      errors.push({
        sheet: 'Dropdown Questions',
        row: rowNumber,
        column: 'O',
        message: `Correct answer "${correctAnswer}" must match one of the options exactly`,
        severity: 'error'
      });
      return;
    }

    // Parse explanation (column P = 16) - only used from first statement
    const explanation = getCellValue(row, 16) || undefined;

    // Create unique key for grouping statements into questions
    const questionKey = `${testName}|${categoryName}|${position}|${questionText}`;

    if (!questionMap.has(questionKey)) {
      questionMap.set(questionKey, {
        testName,
        categoryName,
        position,
        questionText,
        imageUrl,
        isPreview,
        statements: [],
        explanation
      });
    }

    const question = questionMap.get(questionKey)!;

    // Add statement to question
    question.statements.push({
      statementNum,
      statementText,
      options,
      correctAnswer
    });

    // Update explanation if provided and not already set
    if (explanation && !question.explanation) {
      question.explanation = explanation;
    }

    // Update imageUrl if provided and not already set
    if (imageUrl && !question.imageUrl) {
      question.imageUrl = imageUrl;
    }

    // Update isPreview if provided and not already set
    if (isPreview !== undefined && question.isPreview === undefined) {
      question.isPreview = isPreview;
    }
  });

  // Convert map to array and sort statements by statementNum
  const dropdownQuestions: ImportedDropdownQuestion[] = [];
  questionMap.forEach(q => {
    q.statements.sort((a, b) => a.statementNum - b.statementNum);
    dropdownQuestions.push(q);
  });

  return dropdownQuestions;
}

// ============================================================================
// Cross-Sheet Validation
// ============================================================================

function validateCrossSheetReferences(
  tests: ImportedTest[],
  categories: ImportedCategory[],
  questions: ImportedQuestion[],
  dropdownQuestions: ImportedDropdownQuestion[],
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  const testNames = new Set(tests.map(t => t.testName));

  // Validate categories reference valid tests
  categories.forEach((cat, idx) => {
    if (!testNames.has(cat.testName)) {
      errors.push({
        sheet: 'Categories',
        row: idx + 2,
        column: 'A',
        message: `Category references unknown test: "${cat.testName}". This test must be defined in Tests sheet.`,
        severity: 'error'
      });
    }
  });

  // Build category lookup per test
  const categoryLookup = new Map<string, Set<string>>();
  categories.forEach(cat => {
    if (!categoryLookup.has(cat.testName)) {
      categoryLookup.set(cat.testName, new Set());
    }
    categoryLookup.get(cat.testName)!.add(cat.categoryName);
  });

  // Validate questions
  questions.forEach((q, idx) => {
    if (!testNames.has(q.testName)) {
      errors.push({
        sheet: 'Questions',
        row: idx + 2,
        column: 'A',
        message: `Question references unknown test: "${q.testName}"`,
        severity: 'error'
      });
    }

    const testCategories = categoryLookup.get(q.testName);
    if (testCategories && !testCategories.has(q.categoryName)) {
      errors.push({
        sheet: 'Questions',
        row: idx + 2,
        column: 'B',
        message: `Question references unknown category: "${q.categoryName}" for test "${q.testName}"`,
        severity: 'error'
      });
    }
  });

  // Validate dropdown questions
  dropdownQuestions.forEach((q, idx) => {
    if (!testNames.has(q.testName)) {
      errors.push({
        sheet: 'Dropdown Questions',
        row: idx + 3, // +3 because of header and instruction rows
        column: 'A',
        message: `Dropdown question references unknown test: "${q.testName}"`,
        severity: 'error'
      });
    }

    const testCategories = categoryLookup.get(q.testName);
    if (testCategories && !testCategories.has(q.categoryName)) {
      errors.push({
        sheet: 'Dropdown Questions',
        row: idx + 3,
        column: 'B',
        message: `Dropdown question references unknown category: "${q.categoryName}" for test "${q.testName}"`,
        severity: 'error'
      });
    }
  });

  // Warn about tests with no questions (check both regular and dropdown)
  tests.forEach(test => {
    const hasQuestions = questions.some(q => q.testName === test.testName);
    const hasDropdownQuestions = dropdownQuestions.some(q => q.testName === test.testName);
    if (!hasQuestions && !hasDropdownQuestions) {
      warnings.push({
        sheet: 'Tests',
        row: 0,
        column: '',
        message: `Test "${test.testName}" has no questions defined`,
        severity: 'warning'
      });
    }
  });

  // Warn about tests with no categories
  tests.forEach(test => {
    const hasCategories = categories.some(c => c.testName === test.testName);
    if (!hasCategories) {
      warnings.push({
        sheet: 'Tests',
        row: 0,
        column: '',
        message: `Test "${test.testName}" has no categories defined`,
        severity: 'warning'
      });
    }
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

function getCellValue(row: ExcelJS.Row, colNumber: number): string {
  const cell = row.getCell(colNumber);
  if (!cell || cell.value === null || cell.value === undefined) {
    return '';
  }

  // Handle different cell value types
  if (typeof cell.value === 'object') {
    if ('text' in cell.value) {
      return cell.value.text?.toString() || '';
    }
    if ('result' in cell.value) {
      return cell.value.result?.toString() || '';
    }
    return cell.value.toString();
  }

  return cell.value.toString().trim();
}

function parseBoolean(value: string, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  const lower = value.toLowerCase().trim();
  if (lower === 'true' || lower === 'yes' || lower === '1') return true;
  if (lower === 'false' || lower === 'no' || lower === '0') return false;
  return defaultValue;
}
