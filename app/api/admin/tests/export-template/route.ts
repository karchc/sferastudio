import { NextRequest, NextResponse } from 'next/server';
import { generateTestExportTemplate } from '@/app/lib/excel-export';

const SUPABASE_URL = 'https://gezlcxtprkcceizadvre.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

/**
 * GET /api/admin/tests/export-template
 * Download a blank Excel template for bulk test upload
 *
 * Query params:
 * - testId (optional): If provided, exports the specific test with all its data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    let testsData;

    if (testId) {
      // Fetch the specific test with all related data
      const testData = await fetchTestWithQuestions(testId);
      testsData = [testData]; // Wrap in array for multi-test template
    }

    // Generate the Excel file
    const buffer = await generateTestExportTemplate(testsData);

    // Determine filename
    const filename = testsData && testsData.length === 1
      ? `${testsData[0].title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.xlsx`
      : 'bulk_test_upload_template.xlsx';

    // Return the file
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString()
      }
    });

  } catch (error) {
    console.error('Error generating Excel template:', error);
    return NextResponse.json(
      { error: 'Failed to generate Excel template', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function fetchTestWithQuestions(testId: string) {
  try {
    // Fetch test metadata
    const testRes = await fetch(`${SUPABASE_URL}/rest/v1/tests?id=eq.${testId}&select=*`, {
      headers
    });

    if (!testRes.ok) {
      throw new Error(`Failed to fetch test: ${testRes.status}`);
    }

    const tests = await testRes.json();
    if (tests.length === 0) {
      throw new Error('Test not found');
    }

    const test = tests[0];

    // Fetch categories
    let categories = [];
    if (test.category_ids && test.category_ids.length > 0) {
      const categoryIds = test.category_ids.join(',');
      const categoriesRes = await fetch(
        `${SUPABASE_URL}/rest/v1/categories?select=id,name,description&id=in.(${categoryIds})`,
        { headers }
      );

      if (categoriesRes.ok) {
        categories = await categoriesRes.json();
      }
    }

    // Fetch test questions with position
    const testQuestionsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/test_questions?select=question_id,position&test_id=eq.${testId}&order=position.asc`,
      { headers }
    );

    if (!testQuestionsRes.ok) {
      throw new Error('Failed to fetch test questions');
    }

    const testQuestions = await testQuestionsRes.json();
    const questionIds = testQuestions.map((tq: any) => tq.question_id);

    if (questionIds.length === 0) {
      // Return test with no questions
      return {
        ...test,
        categories,
        questions: []
      };
    }

    // Fetch all questions
    const questionsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/questions?select=*&id=in.(${questionIds.join(',')})`,
      { headers }
    );

    if (!questionsRes.ok) {
      throw new Error('Failed to fetch questions');
    }

    const questions = await questionsRes.json();

    // Fetch answers for all questions
    const answersRes = await fetch(
      `${SUPABASE_URL}/rest/v1/answers?select=*&question_id=in.(${questionIds.join(',')})`,
      { headers }
    );

    let answersMap: Record<string, any[]> = {};
    if (answersRes.ok) {
      const answers = await answersRes.json();
      answers.forEach((answer: any) => {
        if (!answersMap[answer.question_id]) {
          answersMap[answer.question_id] = [];
        }
        answersMap[answer.question_id].push(answer);
      });
    }

    // Fetch dropdown answers
    const dropdownAnswersRes = await fetch(
      `${SUPABASE_URL}/rest/v1/dropdown_answers?select=*&question_id=in.(${questionIds.join(',')})&order=position.asc`,
      { headers }
    );

    let dropdownAnswersMap: Record<string, any[]> = {};
    if (dropdownAnswersRes.ok) {
      const dropdownAnswers = await dropdownAnswersRes.json();
      dropdownAnswers.forEach((da: any) => {
        if (!dropdownAnswersMap[da.question_id]) {
          dropdownAnswersMap[da.question_id] = [];
        }
        dropdownAnswersMap[da.question_id].push(da);
      });
    }

    // Fetch match items
    const matchItemsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/match_items?select=*&question_id=in.(${questionIds.join(',')})`,
      { headers }
    );

    let matchItemsMap: Record<string, any[]> = {};
    if (matchItemsRes.ok) {
      const matchItems = await matchItemsRes.json();
      matchItems.forEach((item: any) => {
        if (!matchItemsMap[item.question_id]) {
          matchItemsMap[item.question_id] = [];
        }
        matchItemsMap[item.question_id].push(item);
      });
    }

    // Fetch sequence items
    const sequenceItemsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/sequence_items?select=*&question_id=in.(${questionIds.join(',')})&order=correct_position.asc`,
      { headers }
    );

    let sequenceItemsMap: Record<string, any[]> = {};
    if (sequenceItemsRes.ok) {
      const sequenceItems = await sequenceItemsRes.json();
      sequenceItems.forEach((item: any) => {
        if (!sequenceItemsMap[item.question_id]) {
          sequenceItemsMap[item.question_id] = [];
        }
        sequenceItemsMap[item.question_id].push(item);
      });
    }

    // Fetch drag drop items
    const dragDropItemsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/drag_drop_items?select=*&question_id=in.(${questionIds.join(',')})`,
      { headers }
    );

    let dragDropItemsMap: Record<string, any[]> = {};
    if (dragDropItemsRes.ok) {
      const dragDropItems = await dragDropItemsRes.json();
      dragDropItems.forEach((item: any) => {
        if (!dragDropItemsMap[item.question_id]) {
          dragDropItemsMap[item.question_id] = [];
        }
        dragDropItemsMap[item.question_id].push(item);
      });
    }

    // Build category map for name lookup
    const categoryMap: Record<string, string> = {};
    categories.forEach((cat: any) => {
      categoryMap[cat.id] = cat.name;
    });

    // Combine questions with their answers and position
    const questionsWithAnswers = questions.map((q: any) => {
      const testQuestion = testQuestions.find((tq: any) => tq.question_id === q.id);

      return {
        ...q,
        position: testQuestion?.position || 0,
        category_name: q.category_id ? categoryMap[q.category_id] : '',
        answers: answersMap[q.id] || [],
        dropdown_answers: dropdownAnswersMap[q.id] || [],
        match_items: matchItemsMap[q.id] || [],
        sequence_items: sequenceItemsMap[q.id] || [],
        drag_drop_items: dragDropItemsMap[q.id] || []
      };
    });

    // Sort by position
    questionsWithAnswers.sort((a: any, b: any) => a.position - b.position);

    return {
      ...test,
      categories,
      questions: questionsWithAnswers
    };

  } catch (error) {
    console.error('Error fetching test data:', error);
    throw error;
  }
}
