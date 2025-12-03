import { NextRequest, NextResponse } from 'next/server';
import {
  parseTestExcelFile,
  ParseResult,
  ImportedTest,
  ImportedCategory,
  ImportedQuestion,
  ImportedDropdownQuestion
} from '@/app/lib/excel-import';

const SUPABASE_URL = 'https://gezlcxtprkcceizadvre.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

/**
 * Download image from URL and upload to Supabase Storage
 * Returns the Supabase Storage public URL, or null if failed
 */
async function downloadAndUploadImage(imageUrl: string): Promise<{ url: string | null; error?: string }> {
  try {
    // Validate URL format
    if (!imageUrl || (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))) {
      return { url: null, error: 'Invalid URL format' };
    }

    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PracticeERP/1.0)'
      }
    });

    if (!response.ok) {
      return { url: null, error: `Failed to fetch image: HTTP ${response.status}` };
    }

    // Validate content type
    const contentType = response.headers.get('content-type') || '';
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!allowedTypes.some(t => contentType.includes(t))) {
      return { url: null, error: `Invalid content type: ${contentType}. Must be JPG, PNG, GIF, or WebP.` };
    }

    // Get image buffer and check size (max 5MB)
    const buffer = await response.arrayBuffer();
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (buffer.byteLength > maxSize) {
      return { url: null, error: `Image exceeds 5MB limit (${(buffer.byteLength / 1024 / 1024).toFixed(2)}MB)` };
    }

    // Determine file extension
    const ext = contentType.includes('png') ? 'png'
              : contentType.includes('gif') ? 'gif'
              : contentType.includes('webp') ? 'webp'
              : 'jpg';

    // Generate unique filename
    const fileName = `question-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${ext}`;

    // Upload to Supabase Storage
    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/question-media/${fileName}`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': contentType,
        },
        body: Buffer.from(buffer)
      }
    );

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      return { url: null, error: `Failed to upload to storage: ${errorText}` };
    }

    // Return public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/question-media/${fileName}`;
    return { url: publicUrl };

  } catch (error) {
    console.error(`Failed to download/upload image from ${imageUrl}:`, error);
    return { url: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

interface ImportResult {
  success: boolean;
  testsCreated: number;
  categoriesCreated: number;
  questionsCreated: number;
  errors: string[];
  warnings: string[];
  details: {
    testName: string;
    testId: string;
    categories: number;
    questions: number;
  }[];
}

/**
 * POST /api/admin/tests/import
 * Bulk import tests from Excel file
 */
export async function POST(request: NextRequest) {
  try {
    // Get the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an Excel file (.xlsx or .xls)' },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the Excel file
    const parseResult: ParseResult = await parseTestExcelFile(buffer);

    if (!parseResult.success || !parseResult.data) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.errors.map(e =>
          `[${e.sheet}${e.row ? ` Row ${e.row}` : ''}${e.column ? ` Col ${e.column}` : ''}] ${e.message}`
        ),
        warnings: parseResult.warnings.map(w =>
          `[${w.sheet}${w.row ? ` Row ${w.row}` : ''}${w.column ? ` Col ${w.column}` : ''}] ${w.message}`
        )
      }, { status: 400 });
    }

    // Import the data
    const importResult = await importTestsToDatabase(parseResult.data);

    // Add warnings from parsing
    importResult.warnings.push(...parseResult.warnings.map(w =>
      `[${w.sheet}${w.row ? ` Row ${w.row}` : ''}] ${w.message}`
    ));

    return NextResponse.json(importResult);

  } catch (error) {
    console.error('Error importing tests:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to import tests',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Import parsed data to Supabase database
 */
async function importTestsToDatabase(data: {
  tests: ImportedTest[];
  categories: ImportedCategory[];
  questions: ImportedQuestion[];
  dropdownQuestions: ImportedDropdownQuestion[];
}): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    testsCreated: 0,
    categoriesCreated: 0,
    questionsCreated: 0,
    errors: [],
    warnings: [],
    details: []
  };

  // Process each test
  for (const test of data.tests) {
    try {
      const testDetail = await createTestWithData(test, data);
      result.details.push({
        testName: testDetail.testName,
        testId: testDetail.testId,
        categories: testDetail.categories,
        questions: testDetail.questions
      });
      result.testsCreated++;
      result.categoriesCreated += testDetail.categories;
      result.questionsCreated += testDetail.questions;

      // Add any image upload warnings
      if (testDetail.imageWarnings.length > 0) {
        result.warnings.push(...testDetail.imageWarnings);
      }
    } catch (error) {
      result.errors.push(`Failed to create test "${test.testName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      result.success = false;
    }
  }

  return result;
}

/**
 * Create a single test with its categories and questions
 */
async function createTestWithData(
  test: ImportedTest,
  data: {
    categories: ImportedCategory[];
    questions: ImportedQuestion[];
    dropdownQuestions: ImportedDropdownQuestion[];
  }
): Promise<{ testName: string; testId: string; categories: number; questions: number; imageWarnings: string[] }> {
  const imageWarnings: string[] = [];
  // 0. Check if test with same name already exists
  const existingTestRes = await fetch(
    `${SUPABASE_URL}/rest/v1/tests?title=eq.${encodeURIComponent(test.testName)}&select=id,title`,
    { headers }
  );

  if (existingTestRes.ok) {
    const existingTests = await existingTestRes.json();
    if (existingTests.length > 0) {
      throw new Error(`A test with the name "${test.testName}" already exists. Please use a different name.`);
    }
  }

  // 1. Create categories for this test first
  const testCategories = data.categories.filter(c => c.testName === test.testName);
  const categoryIdMap = new Map<string, string>(); // categoryName -> categoryId

  for (const cat of testCategories) {
    const categoryRes = await fetch(`${SUPABASE_URL}/rest/v1/categories`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: cat.categoryName,
        description: cat.description || null
      })
    });

    if (!categoryRes.ok) {
      const errorText = await categoryRes.text();
      throw new Error(`Failed to create category "${cat.categoryName}": ${errorText}`);
    }

    const [newCategory] = await categoryRes.json();
    categoryIdMap.set(cat.categoryName, newCategory.id);
  }

  // 2. Create the test
  const categoryIds = Array.from(categoryIdMap.values());

  const testRes = await fetch(`${SUPABASE_URL}/rest/v1/tests`, {
    method: 'POST',
    headers: {
      ...headers,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      title: test.testName,
      description: test.description || null,
      time_limit: test.timeLimit * 60, // Convert minutes to seconds
      category_ids: categoryIds,
      is_active: test.isActive,
      is_free: test.isFree,
      price: test.price || null,
      currency: test.currency || 'USD',
      feature: test.feature,
      is_archived: false,
      created_at: new Date().toISOString()
    })
  });

  if (!testRes.ok) {
    const errorText = await testRes.text();
    throw new Error(`Failed to create test: ${errorText}`);
  }

  const [newTest] = await testRes.json();
  const testId = newTest.id;

  // 3. Create regular questions for this test
  const testQuestions = data.questions.filter(q => q.testName === test.testName);
  let questionsCreated = 0;

  for (const q of testQuestions) {
    const categoryId = categoryIdMap.get(q.categoryName);
    const result = await createQuestion(testId, categoryId, q);
    imageWarnings.push(...result.warnings);
    questionsCreated++;
  }

  // 4. Create dropdown questions for this test
  const testDropdownQuestions = data.dropdownQuestions.filter(q => q.testName === test.testName);

  for (const q of testDropdownQuestions) {
    const categoryId = categoryIdMap.get(q.categoryName);
    const result = await createDropdownQuestion(testId, categoryId, q);
    imageWarnings.push(...result.warnings);
    questionsCreated++;
  }

  return {
    testName: test.testName,
    testId,
    categories: testCategories.length,
    questions: questionsCreated,
    imageWarnings
  };
}

/**
 * Create a question with its answers
 * Returns warnings for any image upload failures
 */
async function createQuestion(
  testId: string,
  categoryId: string | undefined,
  q: ImportedQuestion
): Promise<{ warnings: string[] }> {
  const warnings: string[] = [];

  // Handle image URL if provided
  let mediaUrl: string | null = null;
  if (q.imageUrl) {
    console.log(`Downloading image for question: ${q.imageUrl}`);
    const imageResult = await downloadAndUploadImage(q.imageUrl);
    if (imageResult.url) {
      mediaUrl = imageResult.url;
      console.log(`Image uploaded successfully: ${mediaUrl}`);
    } else {
      warnings.push(`Question "${q.questionText.substring(0, 50)}...": Image upload failed - ${imageResult.error}`);
      console.warn(`Image upload failed for question: ${imageResult.error}`);
    }
  }

  // Create the question
  const questionRes = await fetch(`${SUPABASE_URL}/rest/v1/questions`, {
    method: 'POST',
    headers: {
      ...headers,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      text: q.questionText,
      type: q.questionType,
      category_id: categoryId || null,
      explanation: q.explanation || null,
      media_url: mediaUrl,
      is_preview: q.isPreview || false
    })
  });

  if (!questionRes.ok) {
    const errorText = await questionRes.text();
    throw new Error(`Failed to create question: ${errorText}`);
  }

  const [newQuestion] = await questionRes.json();
  const questionId = newQuestion.id;

  // Link question to test
  const linkRes = await fetch(`${SUPABASE_URL}/rest/v1/test_questions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      test_id: testId,
      question_id: questionId,
      position: q.position
    })
  });

  if (!linkRes.ok) {
    const errorText = await linkRes.text();
    throw new Error(`Failed to link question to test: ${errorText}`);
  }

  // Create answers
  for (let i = 0; i < q.options.length; i++) {
    const answerRes = await fetch(`${SUPABASE_URL}/rest/v1/answers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question_id: questionId,
        text: q.options[i],
        is_correct: q.correctAnswers.includes(i + 1), // 1-indexed
        position: i // 0-indexed position
      })
    });

    if (!answerRes.ok) {
      const errorText = await answerRes.text();
      throw new Error(`Failed to create answer for question: ${errorText}`);
    }
  }

  return { warnings };
}

/**
 * Create a dropdown question with its statements
 * Returns warnings for any image upload failures
 */
async function createDropdownQuestion(
  testId: string,
  categoryId: string | undefined,
  q: ImportedDropdownQuestion
): Promise<{ warnings: string[] }> {
  const warnings: string[] = [];

  // Handle image URL if provided
  let mediaUrl: string | null = null;
  if (q.imageUrl) {
    console.log(`Downloading image for dropdown question: ${q.imageUrl}`);
    const imageResult = await downloadAndUploadImage(q.imageUrl);
    if (imageResult.url) {
      mediaUrl = imageResult.url;
      console.log(`Image uploaded successfully: ${mediaUrl}`);
    } else {
      warnings.push(`Dropdown question "${q.questionText.substring(0, 50)}...": Image upload failed - ${imageResult.error}`);
      console.warn(`Image upload failed for dropdown question: ${imageResult.error}`);
    }
  }

  // Create the question
  const questionRes = await fetch(`${SUPABASE_URL}/rest/v1/questions`, {
    method: 'POST',
    headers: {
      ...headers,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      text: q.questionText,
      type: 'dropdown',
      category_id: categoryId || null,
      explanation: q.explanation || null,
      media_url: mediaUrl,
      is_preview: q.isPreview || false
    })
  });

  if (!questionRes.ok) {
    const errorText = await questionRes.text();
    throw new Error(`Failed to create dropdown question: ${errorText}`);
  }

  const [newQuestion] = await questionRes.json();
  const questionId = newQuestion.id;

  // Link question to test
  await fetch(`${SUPABASE_URL}/rest/v1/test_questions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      test_id: testId,
      question_id: questionId,
      position: q.position
    })
  });

  // Create dropdown_answers for each statement
  for (let i = 0; i < q.statements.length; i++) {
    const statement = q.statements[i];
    const dropdownRes = await fetch(`${SUPABASE_URL}/rest/v1/dropdown_answers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        question_id: questionId,
        statement: statement.statementText,
        correct_answer: statement.correctAnswer,
        options: statement.options, // JSON array
        position: i
      })
    });

    if (!dropdownRes.ok) {
      const errorText = await dropdownRes.text();
      throw new Error(`Failed to create dropdown statement: ${errorText}`);
    }
  }

  return { warnings };
}
