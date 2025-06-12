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
    const questionId = (await params).id;
    
    // Load question
    const questionRes = await fetch(`${SUPABASE_URL}/rest/v1/questions?id=eq.${questionId}&select=*`, {
      headers
    });

    if (!questionRes.ok) throw new Error('Failed to load question');
    const [questionData] = await questionRes.json();
    if (!questionData) throw new Error('Question not found');

    // Load answers based on question type
    let fullQuestion = { ...questionData };
    
    if (questionData.type === 'multiple_choice' || questionData.type === 'single_choice') {
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
    } else if (questionData.type === 'dropdown') {
      const dropdownRes = await fetch(`${SUPABASE_URL}/rest/v1/dropdown_answers?question_id=eq.${questionId}&order=position`, {
        headers
      });
      
      if (dropdownRes.ok) {
        const dropdownItems = await dropdownRes.json();
        console.log('Loaded dropdown items for question:', questionId, dropdownItems);
        fullQuestion.dropdownItems = dropdownItems.map((d: any) => ({
          id: d.id,
          statement: d.statement,
          correctAnswer: d.correct_answer,
          options: d.options,
          position: d.position
        }));
      } else {
        console.error('Failed to load dropdown items:', dropdownRes.status, await dropdownRes.text());
        fullQuestion.dropdownItems = [];
      }
    }
    
    // Map database fields to frontend fields
    const mappedQuestion = {
      ...fullQuestion,
      mediaUrl: fullQuestion.media_url, // Map media_url to mediaUrl
      category_id: fullQuestion.category_id // Keep for backwards compatibility
    };
    
    console.log('Question fetch - Original media_url:', fullQuestion.media_url);
    console.log('Question fetch - Mapped mediaUrl:', mappedQuestion.mediaUrl);
    
    return NextResponse.json(mappedQuestion);
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
    const questionId = (await params).id;
    const questionData = await request.json();
    
    console.log('Question update - Received mediaUrl:', questionData.mediaUrl);
    
    // Update the question
    const questionRes = await fetch(`${SUPABASE_URL}/rest/v1/questions?id=eq.${questionId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        type: questionData.type,
        text: questionData.text,
        media_url: questionData.mediaUrl || null,
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
    if (questionData.type === 'multiple_choice' || questionData.type === 'single_choice') {
      // Delete existing answers
      await fetch(`${SUPABASE_URL}/rest/v1/answers?question_id=eq.${questionId}`, {
        method: 'DELETE',
        headers
      });
      
      // Delete existing dropdown answers if changing from dropdown
      await fetch(`${SUPABASE_URL}/rest/v1/dropdown_answers?question_id=eq.${questionId}`, {
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
    } else if (questionData.type === 'dropdown') {
      console.log('Updating dropdown question with items:', questionData.dropdownItems);
      
      // Delete existing dropdown answers
      await fetch(`${SUPABASE_URL}/rest/v1/dropdown_answers?question_id=eq.${questionId}`, {
        method: 'DELETE',
        headers
      });
      
      // Delete existing regular answers if changing to dropdown
      await fetch(`${SUPABASE_URL}/rest/v1/answers?question_id=eq.${questionId}`, {
        method: 'DELETE',
        headers
      });
      
      // Create new dropdown items
      if (questionData.dropdownItems && questionData.dropdownItems.length > 0) {
        const dropdownData = questionData.dropdownItems.map((item: any, index: number) => ({
          question_id: questionId,
          statement: item.statement,
          correct_answer: item.correctAnswer,
          options: item.options,
          position: index
        }));
        
        const dropdownRes = await fetch(`${SUPABASE_URL}/rest/v1/dropdown_answers`, {
          method: 'POST',
          headers,
          body: JSON.stringify(dropdownData)
        });
        
        if (!dropdownRes.ok) {
          const errorText = await dropdownRes.text();
          console.error('Dropdown answers update failed:', dropdownRes.status, errorText);
          throw new Error(`Failed to update dropdown items: ${dropdownRes.status} - ${errorText}`);
        } else {
          console.log('Successfully updated dropdown items');
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
    const questionId = (await params).id;
    
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