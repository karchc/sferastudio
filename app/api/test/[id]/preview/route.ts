import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://gezlcxtprkcceizadvre.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testId = params.id;
    
    // Fetch test details
    const testRes = await fetch(`${SUPABASE_URL}/rest/v1/tests?id=eq.${testId}&select=*`, {
      headers
    });
    
    if (!testRes.ok) throw new Error('Failed to load test');
    const [testData] = await testRes.json();
    if (!testData) throw new Error('Test not found');
    
    // Get test questions that are assigned to this test
    const testQuestionsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/test_questions?select=question_id,position&test_id=eq.${testId}`,
      { headers }
    );
    
    if (!testQuestionsRes.ok) throw new Error('Failed to load test questions');
    const testQuestionIds = await testQuestionsRes.json();
    
    if (testQuestionIds.length === 0) {
      return NextResponse.json({
        id: testData.id,
        title: testData.title,
        description: testData.description,
        instructions: testData.instructions,
        timeLimit: 1800, // 30 minutes for preview
        isActive: testData.is_active,
        allow_backward_navigation: testData.allow_backward_navigation ?? true,
        questions: [],
        sessionId: `preview-session-${Date.now()}`,
        startTime: new Date(),
        timeRemaining: 1800,
        isPreview: true
      });
    }
    
    // Get only preview questions from the test questions with category names
    const questionIds = testQuestionIds.map((tq: any) => tq.question_id).join(',');
    const questionsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/questions?select=*,categories!inner(id,name)&id=in.(${questionIds})&is_preview=eq.true`,
      { headers }
    );
    
    if (!questionsRes.ok) throw new Error('Failed to load preview questions');
    const questionsData = await questionsRes.json();
    
    // Get answers for the preview questions
    const previewQuestionIds = questionsData.map((q: any) => q.id).join(',');
    let answersData = [];
    let dropdownAnswersData = [];
    
    if (previewQuestionIds) {
      // Fetch regular answers
      const answersRes = await fetch(
        `${SUPABASE_URL}/rest/v1/answers?select=*&question_id=in.(${previewQuestionIds})`,
        { headers }
      );
      
      if (answersRes.ok) {
        answersData = await answersRes.json();
      }

      // Fetch dropdown answers
      const dropdownAnswersRes = await fetch(
        `${SUPABASE_URL}/rest/v1/dropdown_answers?select=*&question_id=in.(${previewQuestionIds})&order=position`,
        { headers }
      );
      
      if (dropdownAnswersRes.ok) {
        dropdownAnswersData = await dropdownAnswersRes.json();
      }
    }
    
    // Transform questions with their answers and positions
    const questions = questionsData.map((question: any) => {
      const testQuestion = testQuestionIds.find((tq: any) => tq.question_id === question.id);
      const questionAnswers = answersData.filter((a: any) => a.question_id === question.id);
      const questionDropdownAnswers = dropdownAnswersData.filter((d: any) => d.question_id === question.id);
      
      return {
        id: question.id,
        text: question.text,
        type: question.type,
        mediaUrl: question.media_url,
        difficulty: question.difficulty || 'medium',
        points: question.points || 1,
        categoryId: question.category_id,
        category: question.categories,
        position: testQuestion?.position || 0,
        answers: questionAnswers.map((answer: any) => ({
          id: answer.id,
          text: answer.text,
          isCorrect: answer.is_correct
        })),
        dropdownItems: questionDropdownAnswers.map((d: any) => ({
          id: d.id,
          questionId: d.question_id,
          statement: d.statement,
          correctAnswer: d.correct_answer,
          options: Array.isArray(d.options) ? d.options : [],
          position: d.position
        })),
        // Add other question type specific data if needed
        matchItems: question.match_items || [],
        sequenceItems: question.sequence_items || [],
        dragDropItems: question.dragdrop_items || []
      };
    }).sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
    
    // Return the preview test data with 30-minute time limit
    const previewTestData = {
      id: testData.id,
      title: `${testData.title} (Preview)`,
      description: testData.description,
      instructions: testData.instructions,
      timeLimit: 1800, // 30 minutes in seconds
      isActive: testData.is_active,
      allow_backward_navigation: testData.allow_backward_navigation ?? true,
      questions,
      sessionId: `preview-session-${Date.now()}`,
      startTime: new Date(),
      timeRemaining: 1800,
      isPreview: true
    };
    
    return NextResponse.json(previewTestData);
  } catch (error) {
    console.error('Error in GET /api/test/[id]/preview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview test data' },
      { status: 500 }
    );
  }
}