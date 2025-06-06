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
    const questionId = params.id;
    
    // Load question
    const questionRes = await fetch(`${SUPABASE_URL}/rest/v1/questions?id=eq.${questionId}&select=*`, {
      headers
    });

    if (!questionRes.ok) throw new Error('Failed to load question');
    const [questionData] = await questionRes.json();
    if (!questionData) throw new Error('Question not found');

    // Load answers based on question type
    let fullQuestion = { ...questionData };
    
    if (questionData.type === 'multiple_choice' || questionData.type === 'single_choice' || questionData.type === 'true_false') {
      const answersRes = await fetch(`${SUPABASE_URL}/rest/v1/answers?question_id=eq.${questionId}&order=position`, {
        headers
      });
      
      if (answersRes.ok) {
        const answers = await answersRes.json();
        fullQuestion.answers = answers.map((a: any) => ({
          id: a.id,
          text: a.text,
          isCorrect: a.is_correct,
          position: a.position
        }));
      }
    } else if (questionData.type === 'matching') {
      const matchRes = await fetch(`${SUPABASE_URL}/rest/v1/matching_answers?question_id=eq.${questionId}&order=position`, {
        headers
      });
      
      if (matchRes.ok) {
        const matchItems = await matchRes.json();
        fullQuestion.matchItems = matchItems.map((m: any) => ({
          id: m.id,
          leftText: m.left_text,
          rightText: m.right_text
        }));
      }
    } else if (questionData.type === 'sequence') {
      const seqRes = await fetch(`${SUPABASE_URL}/rest/v1/sequence_answers?question_id=eq.${questionId}&order=correct_position`, {
        headers
      });
      
      if (seqRes.ok) {
        const sequenceItems = await seqRes.json();
        fullQuestion.sequenceItems = sequenceItems.map((s: any) => ({
          id: s.id,
          text: s.text,
          correctPosition: s.correct_position
        }));
      }
    } else if (questionData.type === 'drag_drop') {
      const dragRes = await fetch(`${SUPABASE_URL}/rest/v1/drag_drop_answers?question_id=eq.${questionId}&order=position`, {
        headers
      });
      
      if (dragRes.ok) {
        const dragDropItems = await dragRes.json();
        fullQuestion.dragDropItems = dragDropItems.map((d: any) => ({
          id: d.id,
          content: d.content,
          targetZone: d.target_zone
        }));
      }
    }
    
    return NextResponse.json(fullQuestion);
  } catch (error) {
    console.error('Error in GET /api/admin/questions/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch question' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;
    const questionData = await request.json();
    
    // Update the question
    const questionRes = await fetch(`${SUPABASE_URL}/rest/v1/questions?id=eq.${questionId}`, {
      method: 'PATCH',
      headers,
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
      throw new Error('Failed to update question');
    }
    
    // Update answers based on question type
    if (questionData.type === 'multiple_choice' || questionData.type === 'single_choice' || questionData.type === 'true_false') {
      // Delete existing answers
      await fetch(`${SUPABASE_URL}/rest/v1/answers?question_id=eq.${questionId}`, {
        method: 'DELETE',
        headers
      });
      
      // Create new answers
      if (questionData.answers && questionData.answers.length > 0) {
        const answersData = questionData.answers.map((answer: any, index: number) => ({
          question_id: questionId,
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
          throw new Error('Failed to update answers');
        }
      }
    } else if (questionData.type === 'matching') {
      // Delete existing matching answers
      await fetch(`${SUPABASE_URL}/rest/v1/matching_answers?question_id=eq.${questionId}`, {
        method: 'DELETE',
        headers
      });
      
      // Create new matching items
      if (questionData.matchItems && questionData.matchItems.length > 0) {
        const matchingData = questionData.matchItems.map((item: any, index: number) => ({
          question_id: questionId,
          left_text: item.leftText,
          right_text: item.rightText,
          position: index
        }));
        
        const matchingRes = await fetch(`${SUPABASE_URL}/rest/v1/matching_answers`, {
          method: 'POST',
          headers,
          body: JSON.stringify(matchingData)
        });
        
        if (!matchingRes.ok) {
          throw new Error('Failed to update matching items');
        }
      }
    } else if (questionData.type === 'sequence') {
      // Delete existing sequence answers
      await fetch(`${SUPABASE_URL}/rest/v1/sequence_answers?question_id=eq.${questionId}`, {
        method: 'DELETE',
        headers
      });
      
      // Create new sequence items
      if (questionData.sequenceItems && questionData.sequenceItems.length > 0) {
        const sequenceData = questionData.sequenceItems.map((item: any) => ({
          question_id: questionId,
          text: item.text,
          correct_position: item.correctPosition
        }));
        
        const sequenceRes = await fetch(`${SUPABASE_URL}/rest/v1/sequence_answers`, {
          method: 'POST',
          headers,
          body: JSON.stringify(sequenceData)
        });
        
        if (!sequenceRes.ok) {
          throw new Error('Failed to update sequence items');
        }
      }
    } else if (questionData.type === 'drag_drop') {
      // Delete existing drag drop answers
      await fetch(`${SUPABASE_URL}/rest/v1/drag_drop_answers?question_id=eq.${questionId}`, {
        method: 'DELETE',
        headers
      });
      
      // Create new drag drop items
      if (questionData.dragDropItems && questionData.dragDropItems.length > 0) {
        const dragDropData = questionData.dragDropItems.map((item: any, index: number) => ({
          question_id: questionId,
          content: item.content,
          target_zone: item.targetZone,
          position: index
        }));
        
        const dragDropRes = await fetch(`${SUPABASE_URL}/rest/v1/drag_drop_answers`, {
          method: 'POST',
          headers,
          body: JSON.stringify(dragDropData)
        });
        
        if (!dragDropRes.ok) {
          throw new Error('Failed to update drag drop items');
        }
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/admin/questions/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = params.id;
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/questions?id=eq.${questionId}`, {
      method: 'DELETE',
      headers
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete question');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/questions/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete question' },
      { status: 500 }
    );
  }
}