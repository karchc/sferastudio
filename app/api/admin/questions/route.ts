import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://gezlcxtprkcceizadvre.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';

const headers = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json'
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category_id');
    const type = searchParams.get('type');
    
    let url = `${SUPABASE_URL}/rest/v1/questions?select=*,category:categories!questions_category_id_fkey(*),test_questions(test_id)&order=created_at.desc`;
    
    if (categoryId && categoryId !== 'all') {
      url += `&category_id=eq.${categoryId}`;
    }
    
    if (type && type !== 'all') {
      url += `&type=eq.${type}`;
    }
    
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error('Failed to fetch questions');
    }
    
    const questionsData = await response.json();
    
    const questionsWithCount = (questionsData || []).map((q: any) => ({
      ...q,
      _count: {
        test_questions: q.test_questions?.length || 0
      }
    }));
    
    return NextResponse.json(questionsWithCount);
  } catch (error) {
    console.error('Error in GET /api/admin/questions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const questionData = await request.json();
    
    // Create question
    const questionRes = await fetch(`${SUPABASE_URL}/rest/v1/questions`, {
      method: 'POST',
      headers: {
        ...headers,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        type: questionData.type,
        text: questionData.text,
        category_id: questionData.categoryId,
        difficulty: questionData.difficulty || 'medium',
        points: questionData.points || 1,
        explanation: questionData.explanation || null
      })
    });

    if (!questionRes.ok) {
      throw new Error('Failed to create question');
    }
    
    const [newQuestion] = await questionRes.json();
    
    // Handle different answer types based on question type
    if (questionData.type === 'multiple_choice' || questionData.type === 'single_choice' || questionData.type === 'true_false') {
      if (questionData.answers && questionData.answers.length > 0) {
        const answersData = questionData.answers.map((answer: any, index: number) => ({
          question_id: newQuestion.id,
          text: answer.text,
          is_correct: answer.isCorrect,
          position: index
        }));
        
        const answersRes = await fetch(`${SUPABASE_URL}/rest/v1/answers`, {
          method: 'POST',
          headers,
          body: JSON.stringify(answersData)
        });
        
        if (!answersRes.ok) {
          throw new Error('Failed to create answers');
        }
      }
    } else if (questionData.type === 'matching' && questionData.matchItems) {
      const matchItemsData = questionData.matchItems.map((item: any, index: number) => ({
        question_id: newQuestion.id,
        left_text: item.leftText,
        right_text: item.rightText,
        position: index
      }));
      
      const matchRes = await fetch(`${SUPABASE_URL}/rest/v1/matching_answers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(matchItemsData)
      });
      
      if (!matchRes.ok) {
        throw new Error('Failed to create matching items');
      }
    } else if (questionData.type === 'sequence' && questionData.sequenceItems) {
      const sequenceData = questionData.sequenceItems.map((item: any) => ({
        question_id: newQuestion.id,
        text: item.text,
        correct_position: item.correctPosition
      }));
      
      const sequenceRes = await fetch(`${SUPABASE_URL}/rest/v1/sequence_answers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(sequenceData)
      });
      
      if (!sequenceRes.ok) {
        throw new Error('Failed to create sequence items');
      }
    } else if (questionData.type === 'drag_drop' && questionData.dragDropItems) {
      const dragDropData = questionData.dragDropItems.map((item: any) => ({
        question_id: newQuestion.id,
        content: item.content,
        target_zone: item.targetZone
      }));
      
      const dragDropRes = await fetch(`${SUPABASE_URL}/rest/v1/drag_drop_answers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(dragDropData)
      });
      
      if (!dragDropRes.ok) {
        throw new Error('Failed to create drag-drop items');
      }
    }
    
    // If testId is provided, add question to test
    if (questionData.testId) {
      await fetch(`${SUPABASE_URL}/rest/v1/test_questions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          test_id: questionData.testId,
          question_id: newQuestion.id,
          position: 0
        })
      });
    }
    
    return NextResponse.json(newQuestion);
  } catch (error) {
    console.error('Error in POST /api/admin/questions:', error);
    return NextResponse.json(
      { error: 'Failed to create question' },
      { status: 500 }
    );
  }
}