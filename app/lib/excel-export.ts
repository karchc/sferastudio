import ExcelJS from 'exceljs';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Answer {
  id: string;
  text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  text: string;
  type: string;
  category_id?: string;
  category_name?: string;
  difficulty?: string;
  points?: number;
  explanation?: string;
  position: number;
  answers?: Answer[];
}

interface TestData {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  time_limit: number;
  category_ids?: string[];
  categories?: Category[];
  is_active: boolean;
  tag?: string;
  feature?: boolean;
  price?: number;
  currency?: string;
  is_free: boolean;
  questions?: Question[];
}

export async function generateTestExportTemplate(testsData?: TestData[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Set workbook properties
  workbook.creator = 'Practice SAP Admin';
  workbook.created = new Date();

  // Create Instructions Sheet
  const instructionsSheet = workbook.addWorksheet('Instructions', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });
  addInstructionsSheet(instructionsSheet);

  // Create Test Metadata Sheet
  const metadataSheet = workbook.addWorksheet('Tests', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });
  const testNames = addTestMetadataSheet(metadataSheet, testsData);

  // Create Categories Sheet
  const categoriesSheet = workbook.addWorksheet('Categories', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });
  const categoryInfo = addCategoriesSheet(categoriesSheet, testsData, testNames);

  // Create Questions Sheet
  const questionsSheet = workbook.addWorksheet('Questions', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });
  addQuestionsSheet(questionsSheet, testsData, testNames, categoryInfo);

  // Create Dropdown Questions Sheet
  const dropdownSheet = workbook.addWorksheet('Dropdown Questions', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
  });
  addDropdownQuestionsSheet(dropdownSheet, testsData, testNames, categoryInfo);

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

function addInstructionsSheet(sheet: ExcelJS.Worksheet) {
  sheet.columns = [
    { width: 20 },
    { width: 80 }
  ];

  // Title
  sheet.mergeCells('A1:B1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'BULK TEST UPLOAD - INSTRUCTIONS';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0066CC' }
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 30;

  sheet.addRow([]);

  // Overview
  const overviewRow = sheet.addRow(['OVERVIEW', 'Upload multiple tests at once. Fill out each sheet in order: Tests -> Categories -> Questions. Dropdown menus will help you select the correct values.']);
  overviewRow.getCell(1).font = { bold: true, size: 12 };
  overviewRow.getCell(2).alignment = { wrapText: true, vertical: 'top' };
  overviewRow.height = 50;

  sheet.addRow([]);

  // How dropdowns work
  const dropdownRow = sheet.addRow(['DROPDOWN MENUS', 'The "Test Name" and "Category Name" columns have dropdown menus that reference the other sheets. First add your tests, then categories, then questions - the dropdowns will show your available options.']);
  dropdownRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF009900' } };
  dropdownRow.getCell(2).alignment = { wrapText: true, vertical: 'top' };
  dropdownRow.height = 60;

  sheet.addRow([]);

  // Sheet descriptions
  const sheets = [
    { name: 'Tests', description: 'Define your tests here first. Each row is one test with title, time limit, and pricing.' },
    { name: 'Categories', description: 'Add categories for each test. Select the Test Name from the dropdown, then enter category details.' },
    { name: 'Questions', description: 'Add single-choice and multiple-choice questions. Select Test Name and Category from dropdowns.' },
    { name: 'Dropdown Questions', description: 'Add dropdown (fill-in-blank) questions. Each question can have multiple statements with dropdown options.' }
  ];

  const headerRow = sheet.addRow(['SHEET', 'DESCRIPTION']);
  headerRow.font = { bold: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

  sheets.forEach(s => {
    const row = sheet.addRow([s.name, s.description]);
    row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
    row.height = 35;
  });

  sheet.addRow([]);

  // Step by step
  const stepsRow = sheet.addRow(['STEP BY STEP', '']);
  stepsRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF0066CC' } };

  const steps = [
    '1. Go to "Tests" sheet -> Add your test names, descriptions, and settings',
    '2. Go to "Categories" sheet -> Select test from dropdown -> Add category name',
    '3. Go to "Questions" sheet -> Select test and category from dropdowns -> Add question details',
    '4. Save the file and upload it through the admin dashboard'
  ];

  steps.forEach(step => {
    const row = sheet.addRow(['', step]);
    row.getCell(2).alignment = { wrapText: true };
    row.height = 25;
  });

  sheet.addRow([]);

  // Question types
  const typesRow = sheet.addRow(['QUESTION TYPES', '']);
  typesRow.getCell(1).font = { bold: true, size: 12 };

  const types = [
    'single-choice: One correct answer (use option number 1-4 in Correct Answer column)',
    'multiple-choice: Multiple correct answers (comma-separated, e.g., "1,3,4")',
    'dropdown: Use the "Dropdown Questions" sheet for dropdown questions (fill-in-the-blank style)'
  ];

  types.forEach(type => {
    const row = sheet.addRow(['', type]);
    row.getCell(2).alignment = { wrapText: true };
    row.height = 25;
  });

  sheet.addRow([]);

  // Image URL section
  sheet.addRow([]);
  const imageRow = sheet.addRow(['IMAGE URLS', '']);
  imageRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FF9933CC' } };

  const imageNotes = [
    'Image URL (optional): Direct link to an image file (JPG, PNG, GIF, WebP)',
    'Maximum file size: 5MB per image',
    'Supported sources: Direct image links, Google Drive, Dropbox, or any public URL',
    'Images will be downloaded and stored securely. Leave blank for no image.'
  ];

  imageNotes.forEach(note => {
    const row = sheet.addRow(['', note]);
    row.getCell(2).alignment = { wrapText: true };
    row.height = 25;
  });

  sheet.addRow([]);

  // Important notes
  const notesRow = sheet.addRow(['IMPORTANT', '']);
  notesRow.getCell(1).font = { bold: true, size: 12, color: { argb: 'FFFF0000' } };

  const notes = [
    'Delete the yellow example rows before uploading your real data',
    'Required fields are marked with * in the header',
    'Test names must be unique - no duplicates allowed'
  ];

  notes.forEach(note => {
    const row = sheet.addRow(['', note]);
    row.getCell(2).alignment = { wrapText: true };
    row.height = 25;
  });
}

function addTestMetadataSheet(sheet: ExcelJS.Worksheet, testsData?: TestData[]): string[] {
  sheet.columns = [
    { width: 35 }, // test_name
    { width: 45 }, // description
    { width: 15 }, // time_limit_minutes
    { width: 12 }, // is_active
    { width: 12 }, // is_free
    { width: 12 }, // price
    { width: 10 }, // currency
    { width: 25 }  // feature
  ];

  // Header row
  const headerRow = sheet.addRow([
    'Test Name *',
    'Description',
    'Time (mins) *',
    'Active *',
    'Free *',
    'Price',
    'Currency',
    'Featured'
  ]);

  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 30;

  // Collect test names for dropdown references
  const testNames: string[] = [];

  if (testsData && testsData.length > 0) {
    testsData.forEach(test => {
      testNames.push(test.title);
      sheet.addRow([
        test.title,
        test.description || '',
        Math.round(test.time_limit / 60),
        test.is_active ? 'TRUE' : 'FALSE',
        test.is_free ? 'TRUE' : 'FALSE',
        test.price || '',
        test.currency || 'USD',
        test.feature ? 'TRUE' : 'FALSE'
      ]);
    });
  } else {
    // Example rows
    const examples = [
      ['SAP FI Certification Test', 'Practice test for Financial Accounting certification', 180, 'TRUE', 'FALSE', 29.99, 'USD', 'TRUE'],
      ['SAP Basics Quiz', 'Introduction to SAP fundamentals', 60, 'TRUE', 'TRUE', '', 'USD', 'FALSE'],
      ['CO Module Practice', 'Controlling module practice questions', 120, 'TRUE', 'FALSE', 19.99, 'USD', 'FALSE']
    ];

    examples.forEach(ex => {
      testNames.push(ex[0] as string);
      const row = sheet.addRow(ex);
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4CC' } };
    });
  }

  // Add data validation for Active, Free, and Featured columns (TRUE/FALSE dropdown)
  for (let i = 2; i <= 100; i++) {
    sheet.getCell(`D${i}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"TRUE,FALSE"'],
      showErrorMessage: true,
      errorTitle: 'Invalid value',
      error: 'Please select TRUE or FALSE'
    };
    sheet.getCell(`E${i}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"TRUE,FALSE"'],
      showErrorMessage: true,
      errorTitle: 'Invalid value',
      error: 'Please select TRUE or FALSE'
    };
    sheet.getCell(`H${i}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"TRUE,FALSE"'],
      showErrorMessage: true,
      errorTitle: 'Invalid value',
      error: 'Please select TRUE or FALSE'
    };
  }

  return testNames;
}

function addCategoriesSheet(
  sheet: ExcelJS.Worksheet,
  testsData?: TestData[],
  testNames?: string[]
): Map<string, string[]> {
  sheet.columns = [
    { width: 35 }, // test_name
    { width: 35 }, // category_name
    { width: 50 }  // description
  ];

  // Header row
  const headerRow = sheet.addRow([
    'Test Name *',
    'Category Name *',
    'Description'
  ]);

  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 25;

  // Collect categories per test for dropdown references
  const categoryInfo = new Map<string, string[]>();

  if (testsData && testsData.length > 0) {
    testsData.forEach(test => {
      const cats: string[] = [];
      if (test.categories && test.categories.length > 0) {
        test.categories.forEach(cat => {
          cats.push(cat.name);
          sheet.addRow([test.title, cat.name, cat.description || '']);
        });
      }
      categoryInfo.set(test.title, cats);
    });
  } else {
    // Example rows matching the example tests
    const examples = [
      ['SAP FI Certification Test', 'Financial Accounting', 'General ledger and accounts'],
      ['SAP FI Certification Test', 'Asset Accounting', 'Fixed asset management'],
      ['SAP Basics Quiz', 'Navigation', 'SAP system navigation basics'],
      ['SAP Basics Quiz', 'Transactions', 'Common transaction codes'],
      ['CO Module Practice', 'Cost Centers', 'Cost center accounting'],
      ['CO Module Practice', 'Internal Orders', 'Internal order management']
    ];

    examples.forEach(ex => {
      const testName = ex[0] as string;
      const catName = ex[1] as string;
      if (!categoryInfo.has(testName)) {
        categoryInfo.set(testName, []);
      }
      categoryInfo.get(testName)!.push(catName);

      const row = sheet.addRow(ex);
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4CC' } };
    });
  }

  // Add data validation for Test Name column - reference Tests sheet
  if (testNames && testNames.length > 0) {
    const testListFormula = `"${testNames.join(',')}"`;
    for (let i = 2; i <= 200; i++) {
      sheet.getCell(`A${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [testListFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Test Name',
        error: 'Please select a test from the Tests sheet'
      };
    }
  }

  return categoryInfo;
}

function addQuestionsSheet(
  sheet: ExcelJS.Worksheet,
  testsData?: TestData[],
  testNames?: string[],
  categoryInfo?: Map<string, string[]>
) {
  sheet.columns = [
    { width: 35 }, // test_name
    { width: 25 }, // category_name
    { width: 8 },  // position
    { width: 18 }, // question_type
    { width: 50 }, // question_text
    { width: 50 }, // image_url (moved after question text)
    { width: 10 }, // is_preview
    { width: 25 }, // option_1
    { width: 25 }, // option_2
    { width: 25 }, // option_3
    { width: 25 }, // option_4
    { width: 25 }, // option_5
    { width: 25 }, // option_6
    { width: 15 }, // correct_answers
    { width: 40 }, // explanation
  ];

  // Header row
  const headerRow = sheet.addRow([
    'Test Name *',
    'Category Name *',
    'Position *',
    'Question Type *',
    'Question Text *',
    'Image URL',
    'Preview',
    'Option 1 *',
    'Option 2 *',
    'Option 3',
    'Option 4',
    'Option 5',
    'Option 6',
    'Correct Answer *',
    'Explanation'
  ]);

  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0066CC' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 30;

  // Filter for simple question types only (dropdown excluded - requires special structure)
  const simpleTypes = ['single-choice', 'multiple-choice'];

  if (testsData && testsData.length > 0) {
    testsData.forEach(test => {
      const simpleQuestions = test.questions?.filter(q => simpleTypes.includes(q.type));
      if (simpleQuestions && simpleQuestions.length > 0) {
        simpleQuestions.forEach(q => {
          const options = q.answers?.map(a => a.text) || [];
          const correctAnswers = q.answers
            ?.map((a, idx) => a.is_correct ? (idx + 1).toString() : null)
            .filter(Boolean)
            .join(',') || '';

          // Column order: Test, Category, Position, Type, Text, ImageURL, Preview, Options 1-6, Correct, Explanation
          sheet.addRow([
            test.title,
            q.category_name || '',
            q.position,
            q.type,
            q.text,
            (q as any).media_url || '', // Image URL
            (q as any).is_preview ? 'TRUE' : 'FALSE', // Preview
            options[0] || '',
            options[1] || '',
            options[2] || '',
            options[3] || '',
            options[4] || '',
            options[5] || '',
            correctAnswers,
            q.explanation || ''
          ]);
        });
      }
    });
  } else {
    // Example rows - Column order: Test, Category, Position, Type, Text, ImageURL, Preview, Options 1-6, Correct, Explanation
    const examples = [
      ['SAP FI Certification Test', 'Financial Accounting', 1, 'single-choice', 'What does FI stand for in SAP?', '', 'FALSE', 'Financial Accounting', 'Fixed Income', 'First Instance', 'File Integration', '', '', '1', 'FI is the Financial Accounting module'],
      ['SAP FI Certification Test', 'Financial Accounting', 2, 'multiple-choice', 'Which are valid document types? (Select all)', 'https://example.com/image.png', 'TRUE', 'Invoice', 'Credit Memo', 'Email', 'Journal Entry', 'Payment', 'Transfer', '1,2,4,5', 'Email is not a document type'],
      ['SAP Basics Quiz', 'Navigation', 1, 'single-choice', 'Which transaction code opens the ABAP Editor?', '', 'FALSE', 'SE38', 'SM21', 'SE16', 'SPRO', 'SU01', 'MM01', '1', 'SE38 is the ABAP Editor transaction'],
      ['SAP Basics Quiz', 'Transactions', 2, 'single-choice', 'Which transaction displays user master records?', '', 'TRUE', 'SU01', 'SM21', 'SE16', 'SPRO', '', '', '1', 'SU01 is for user maintenance'],
      ['CO Module Practice', 'Cost Centers', 1, 'multiple-choice', 'Which are valid cost center attributes? (Select all)', '', 'FALSE', 'Cost center group', 'Profit center', 'Company code', 'Email address', 'Controlling area', '', '1,2,3,5', 'Email is not a cost center attribute']
    ];

    examples.forEach(ex => {
      const row = sheet.addRow(ex);
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4CC' } };
      row.alignment = { wrapText: true, vertical: 'top' };
    });
  }

  // Add data validation for Test Name column
  if (testNames && testNames.length > 0) {
    const testListFormula = `"${testNames.join(',')}"`;
    for (let i = 2; i <= 500; i++) {
      sheet.getCell(`A${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [testListFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Test Name',
        error: 'Please select a test from the Tests sheet'
      };
    }
  }

  // Add data validation for Question Type column
  for (let i = 2; i <= 500; i++) {
    sheet.getCell(`D${i}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"single-choice,multiple-choice"'],
      showErrorMessage: true,
      errorTitle: 'Invalid Question Type',
      error: 'Please select: single-choice or multiple-choice'
    };
  }

  // Add data validation for Preview column (column G)
  for (let i = 2; i <= 500; i++) {
    sheet.getCell(`G${i}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"TRUE,FALSE"'],
      showErrorMessage: true,
      errorTitle: 'Invalid value',
      error: 'Please select TRUE or FALSE'
    };
  }

  // Add data validation for Category Name - all categories combined
  if (categoryInfo && categoryInfo.size > 0) {
    const allCategories = new Set<string>();
    categoryInfo.forEach(cats => cats.forEach(c => allCategories.add(c)));

    if (allCategories.size > 0) {
      const catListFormula = `"${Array.from(allCategories).join(',')}"`;
      for (let i = 2; i <= 500; i++) {
        sheet.getCell(`B${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [catListFormula],
          showErrorMessage: true,
          errorTitle: 'Invalid Category',
          error: 'Please select a category from the Categories sheet'
        };
      }
    }
  }
}

function addDropdownQuestionsSheet(
  sheet: ExcelJS.Worksheet,
  testsData?: TestData[],
  testNames?: string[],
  categoryInfo?: Map<string, string[]>
) {
  sheet.columns = [
    { width: 35 }, // test_name
    { width: 25 }, // category_name
    { width: 10 }, // position (question position)
    { width: 45 }, // question_text
    { width: 50 }, // image_url (moved after question text)
    { width: 10 }, // is_preview
    { width: 12 }, // statement_num
    { width: 45 }, // statement_text
    { width: 20 }, // option_1
    { width: 20 }, // option_2
    { width: 20 }, // option_3
    { width: 20 }, // option_4
    { width: 20 }, // option_5
    { width: 20 }, // option_6
    { width: 20 }, // correct_answer
    { width: 40 }, // explanation (only on first statement row)
  ];

  // Header row
  const headerRow = sheet.addRow([
    'Test Name *',
    'Category Name *',
    'Position *',
    'Question Text *',
    'Image URL',
    'Preview',
    'Statement #',
    'Statement Text *',
    'Option 1 *',
    'Option 2 *',
    'Option 3',
    'Option 4',
    'Option 5',
    'Option 6',
    'Correct Answer *',
    'Explanation'
  ]);

  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF9933CC' } }; // Purple for dropdown
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.height = 30;

  // Add instruction row
  const instructionRow = sheet.addRow([
    'Select from Tests',
    'Select from Categories',
    'Question order',
    'Main question text (same for all statements)',
    'Only on first statement',
    'TRUE/FALSE - first statement only',
    '1, 2, 3...',
    'Fill-in-blank statement',
    'Dropdown option',
    'Dropdown option',
    'Dropdown option',
    'Dropdown option',
    'Dropdown option',
    'Dropdown option',
    'Must match one option exactly',
    'Only on first statement'
  ]);
  instructionRow.font = { italic: true, color: { argb: 'FF666666' } };
  instructionRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0E6FF' } };
  instructionRow.alignment = { wrapText: true, vertical: 'top' };
  instructionRow.height = 40;

  // Example rows - Column order: Test, Category, Position, QuestionText, ImageURL, Preview, Statement#, StatementText, Options 1-6, Correct, Explanation
  const examples = [
    ['SAP FI Certification Test', 'Financial Accounting', 1, 'Complete the following statements about SAP modules:', 'https://example.com/sap-modules.png', 'TRUE', 1, 'The ___ module handles financial accounting', 'FI', 'CO', 'MM', 'SD', 'PP', 'HR', 'FI', 'FI stands for Financial Accounting'],
    ['SAP FI Certification Test', 'Financial Accounting', 1, 'Complete the following statements about SAP modules:', '', '', 2, 'The ___ module handles controlling', 'FI', 'CO', 'MM', 'SD', 'PP', 'HR', 'CO', ''],
    ['SAP FI Certification Test', 'Financial Accounting', 1, 'Complete the following statements about SAP modules:', '', '', 3, 'The ___ module handles materials management', 'FI', 'CO', 'MM', 'SD', 'PP', 'HR', 'MM', ''],
    ['SAP Basics Quiz', 'Navigation', 2, 'Match the transaction codes:', '', 'FALSE', 1, 'SE38 is used for ___', 'ABAP Editor', 'User Maintenance', 'Table Display', 'Configuration', '', '', 'ABAP Editor', 'Common SAP transaction codes'],
    ['SAP Basics Quiz', 'Navigation', 2, 'Match the transaction codes:', '', '', 2, 'SU01 is used for ___', 'ABAP Editor', 'User Maintenance', 'Table Display', 'Configuration', '', '', 'User Maintenance', ''],
  ];

  examples.forEach(ex => {
    const row = sheet.addRow(ex);
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF4CC' } };
    row.alignment = { wrapText: true, vertical: 'top' };
  });

  // Add data validation for Test Name column
  if (testNames && testNames.length > 0) {
    const testListFormula = `"${testNames.join(',')}"`;
    for (let i = 3; i <= 500; i++) { // Start from row 3 (after header and instruction)
      sheet.getCell(`A${i}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [testListFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid Test Name',
        error: 'Please select a test from the Tests sheet'
      };
    }
  }

  // Add data validation for Category Name
  if (categoryInfo && categoryInfo.size > 0) {
    const allCategories = new Set<string>();
    categoryInfo.forEach(cats => cats.forEach(c => allCategories.add(c)));

    if (allCategories.size > 0) {
      const catListFormula = `"${Array.from(allCategories).join(',')}"`;
      for (let i = 3; i <= 500; i++) {
        sheet.getCell(`B${i}`).dataValidation = {
          type: 'list',
          allowBlank: true,
          formulae: [catListFormula],
          showErrorMessage: true,
          errorTitle: 'Invalid Category',
          error: 'Please select a category from the Categories sheet'
        };
      }
    }
  }

  // Add data validation for Preview column (column F)
  for (let i = 3; i <= 500; i++) {
    sheet.getCell(`F${i}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: ['"TRUE,FALSE"'],
      showErrorMessage: true,
      errorTitle: 'Invalid value',
      error: 'Please select TRUE or FALSE'
    };
  }
}
