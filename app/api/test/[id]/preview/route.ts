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
        timeLimit: 1800, // 30 minutes for preview
        isActive: testData.is_active,
        questions: [],
        sessionId: `preview-session-${Date.now()}`,
        startTime: new Date(),
        timeRemaining: 1800,
        isPreview: true
      });
    }
    
    // Get only preview questions from the test questions
    const questionIds = testQuestionIds.map((tq: any) => tq.question_id).join(',');
    const questionsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/questions?select=*&id=in.(${questionIds})&is_preview=eq.true`,
      { headers }
    );
    
    if (!questionsRes.ok) throw new Error('Failed to load preview questions');
    const questionsData = await questionsRes.json();
    
    // Get answers for the preview questions
    const previewQuestionIds = questionsData.map((q: any) => q.id).join(',');
    let answersData = [];
    
    if (previewQuestionIds) {
      const answersRes = await fetch(
        `${SUPABASE_URL}/rest/v1/answers?select=*&question_id=in.(${previewQuestionIds})`,
        { headers }
      );
      
      if (answersRes.ok) {
        answersData = await answersRes.json();
      }
    }
    
    // Transform questions with their answers and positions
    const questions = questionsData.map((question: any) => {
      const testQuestion = testQuestionIds.find((tq: any) => tq.question_id === question.id);
      const questionAnswers = answersData.filter((a: any) => a.question_id === question.id);
      
      return {
        id: question.id,
        text: question.text,
        type: question.type,
        difficulty: question.difficulty || 'medium',
        points: question.points || 1,
        position: testQuestion?.position || 0,
        answers: questionAnswers.map((answer: any) => ({
          id: answer.id,
          text: answer.text,
          isCorrect: answer.is_correct
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
      timeLimit: 1800, // 30 minutes in seconds
      isActive: testData.is_active,
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