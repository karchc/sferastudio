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
    
    // Load question with answers and dropdown items in parallel
    const [questionRes, answersRes, dropdownRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/questions?id=eq.${questionId}&select=*`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/answers?question_id=eq.${questionId}&order=position`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/dropdown_answers?question_id=eq.${questionId}&order=position`, { headers })
    ]);

    if (!questionRes.ok) throw new Error('Failed to load question');
    const [questionData] = await questionRes.json();
    if (!questionData) throw new Error('Question not found');

    // Process answers and dropdown items
    let fullQuestion = { ...questionData };

    // Support both underscore and hyphen formats for question types
    const isMultipleChoice = questionData.type === 'multiple_choice' || questionData.type === 'multiple-choice';
    const isSingleChoice = questionData.type === 'single_choice' || questionData.type === 'single-choice';

    if ((isMultipleChoice || isSingleChoice) && answersRes.ok) {
      const answers = await answersRes.json();
      // Filter out empty answers and sort by position
      fullQuestion.answers = answers
        .filter((a: any) => a.text && a.text.trim() !== '')
        .sort((a: any, b: any) => a.position - b.position)
        .map((a: any) => ({
          id: a.id,
          text: a.text,
          isCorrect: a.is_correct,
          position: a.position
        }));
    } else if (questionData.type === 'dropdown' && dropdownRes.ok) {
      const dropdownItems = await dropdownRes.json();
      fullQuestion.dropdownItems = dropdownItems.map((d: any) => ({
        id: d.id,
        statement: d.statement,
        correctAnswer: d.correct_answer,
        options: d.options,
        position: d.position
      }));
    }
    
    // Map database fields to frontend fields
    const mappedQuestion = {
      ...fullQuestion,
      mediaUrl: fullQuestion.media_url,
      category_id: fullQuestion.category_id
    };
    
    // For performance: If mediaUrl is a large base64 string, provide a flag
    // and optionally truncate it for display purposes
    if (mappedQuestion.mediaUrl && mappedQuestion.mediaUrl.startsWith('data:image/')) {
      mappedQuestion.isBase64Image = true;
      mappedQuestion.mediaUrlSize = mappedQuestion.mediaUrl.length;
      
      // For editing forms, we might want to provide a truncated preview
      // but keep the full data for processing
      if (mappedQuestion.mediaUrlSize > 100000) { // 100KB threshold
        mappedQuestion.mediaUrlPreview = mappedQuestion.mediaUrl.substring(0, 100) + '...';
        mappedQuestion.isLargeImage = true;
      }
    } else {
      mappedQuestion.isBase64Image = false;
      mappedQuestion.isStorageUrl = true;
    }
    
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
  const questionId = (await params).id;
  const questionData = await request.json();
  
  console.log('PATCH /api/admin/questions/[id] - Starting update for question:', questionId);
  console.log('Question update - Received data:', JSON.stringify(questionData, null, 2));
  
  let questionUpdateSuccess = false;
  let answerUpdateSuccess = false;
  const warnings: string[] = [];
  
  try {
    // Step 1: Update the main question (this is critical and must succeed)
    const questionRes = await fetch(`${SUPABASE_URL}/rest/v1/questions?id=eq.${questionId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        type: questionData.type,
        text: questionData.text,
        media_url: questionData.mediaUrl || null,
        category_id: questionData.categoryId,
        explanation: questionData.explanation || null
      })
    });

    if (!questionRes.ok) {
      const errorText = await questionRes.text();
      console.error('❌ Question update failed:', questionRes.status, errorText);
      throw new Error(`Failed to update question: ${questionRes.status} - ${errorText}`);
    }
    
    questionUpdateSuccess = true;
    console.log('✅ Question updated successfully');
    
    // Step 2: Update answers based on question type (this is non-critical - don't fail the whole operation)
    // Support both underscore and hyphen formats for question types
    const isMultipleChoice = questionData.type === 'multiple_choice' || questionData.type === 'multiple-choice';
    const isSingleChoice = questionData.type === 'single_choice' || questionData.type === 'single-choice';
    const isDropdown = questionData.type === 'dropdown';

    try {
      if (isMultipleChoice || isSingleChoice) {
        console.log('🔄 Handling answers for question:', questionId);
        
        // Try to delete existing answers, but don't fail if it's constrained
        const deleteAnswersRes = await fetch(`${SUPABASE_URL}/rest/v1/answers?question_id=eq.${questionId}`, {
          method: 'DELETE',
          headers
        });
        
        if (deleteAnswersRes.ok) {
          console.log('✅ Successfully deleted existing answers');
        } else {
          const errorText = await deleteAnswersRes.text();
          console.warn('⚠️ Could not delete existing answers (likely due to foreign key constraints):', deleteAnswersRes.status, errorText);
          warnings.push('Could not delete existing answers due to foreign key constraints');
        }
        
        // Delete existing dropdown answers if changing from dropdown
        const deleteDropdownRes = await fetch(`${SUPABASE_URL}/rest/v1/dropdown_answers?question_id=eq.${questionId}`, {
          method: 'DELETE',
          headers
        });
        
        if (!deleteDropdownRes.ok) {
          const errorText = await deleteDropdownRes.text();
          console.warn('⚠️ Failed to delete existing dropdown answers:', deleteDropdownRes.status, errorText);
          warnings.push('Could not delete existing dropdown answers');
        }
        
        // Wait a moment to ensure deletion is processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Handle answer updates based on whether deletion succeeded
        if (questionData.answers && questionData.answers.length > 0) {
          const validAnswers = questionData.answers
            .filter((answer: any) => answer.text && answer.text.trim() !== '')
            .map((answer: any, index: number) => ({
              question_id: questionId,
              text: answer.text.trim(),
              is_correct: answer.isCorrect || false,
              position: index
            }));
          
          console.log('🔄 Processing answers for question:', validAnswers);
          
          if (deleteAnswersRes.ok) {
            // Deletion succeeded, create new answers
            console.log('✅ Creating new answers after successful deletion');
            
            const answersRes = await fetch(`${SUPABASE_URL}/rest/v1/answers`, {
              method: 'POST',
              headers,
              body: JSON.stringify(validAnswers)
            });
            
            if (!answersRes.ok) {
              const errorText = await answersRes.text();
              console.error('⚠️ Answers creation failed:', answersRes.status, errorText);
              warnings.push(`Failed to create answers: ${answersRes.status} - ${errorText}`);
            } else {
              try {
                const responseText = await answersRes.text();
                if (responseText) {
                  const createdAnswers = JSON.parse(responseText);
                  console.log('✅ Answers created successfully:', createdAnswers.length, 'answers');
                } else {
                  console.log('✅ Answers created successfully (empty response)');
                }
                answerUpdateSuccess = true;
              } catch (parseError) {
                console.error('⚠️ Failed to parse answer creation response:', parseError);
                warnings.push(`Answer creation succeeded but response parsing failed: ${parseError instanceof Error ? parseError.message : 'JSON parse error'}`);
                answerUpdateSuccess = true; // Still consider it successful since the request succeeded
              }
            }
          } else {
            // Deletion failed due to constraints, try to update existing answers
            console.log('🔧 Working around foreign key constraints - attempting to update answers individually');
            
            try {
              const currentAnswersRes = await fetch(`${SUPABASE_URL}/rest/v1/answers?question_id=eq.${questionId}&select=*`, { headers });
              
              if (!currentAnswersRes.ok) {
                console.warn('⚠️ Failed to fetch current answers:', currentAnswersRes.status);
                warnings.push(`Could not fetch current answers: ${currentAnswersRes.status}`);
                return; // Skip answer update
              }
              
              const responseText = await currentAnswersRes.text();
              if (!responseText) {
                console.warn('⚠️ Empty response when fetching current answers');
                warnings.push('Empty response when fetching current answers');
                return; // Skip answer update
              }
              
              let currentAnswers;
              try {
                currentAnswers = JSON.parse(responseText);
              } catch (parseError) {
                console.error('⚠️ Failed to parse current answers JSON:', parseError);
                console.error('⚠️ Response text:', responseText);
                warnings.push(`Failed to parse current answers: ${parseError instanceof Error ? parseError.message : 'JSON parse error'}`);
                return; // Skip answer update
              }
              
              console.log('📊 Current answers in database:', currentAnswers.length);
              
              // Clear out the old answers by updating them to have empty text
              for (const answer of currentAnswers) {
                await fetch(`${SUPABASE_URL}/rest/v1/answers?id=eq.${answer.id}`, {
                  method: 'PATCH',
                  headers,
                  body: JSON.stringify({
                    text: '', 
                    is_correct: false,
                    position: 999
                  })
                });
              }
              
              // Now update the first few answers with our new data
              const answersToUpdate = Math.min(validAnswers.length, currentAnswers.length);
              for (let i = 0; i < answersToUpdate; i++) {
                const answer = validAnswers[i];
                const currentAnswer = currentAnswers[i];
                
                await fetch(`${SUPABASE_URL}/rest/v1/answers?id=eq.${currentAnswer.id}`, {
                  method: 'PATCH',
                  headers,
                  body: JSON.stringify({
                    text: answer.text,
                    is_correct: answer.is_correct,
                    position: answer.position
                  })
                });
              }
              
              console.log(`✅ Updated ${answersToUpdate} existing answers successfully`);
              
              // If we have more new answers than existing ones, create the additional ones
              if (validAnswers.length > currentAnswers.length) {
                const additionalAnswers = validAnswers.slice(currentAnswers.length);
                const answersRes = await fetch(`${SUPABASE_URL}/rest/v1/answers`, {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(additionalAnswers)
                });
                
                if (answersRes.ok) {
                  console.log(`✅ Created ${additionalAnswers.length} additional answers`);
                } else {
                  warnings.push(`Could not create ${additionalAnswers.length} additional answers`);
                }
              }
              
              answerUpdateSuccess = true;
              
            } catch (updateError) {
              console.error('⚠️ Error updating answers individually:', updateError);
              warnings.push('Could not update answers due to constraints');
            }
          }
        }
      } else if (isDropdown) {
        console.log('🔄 Updating dropdown question with items:', questionData.dropdownItems);
        
        // Delete existing dropdown answers
        const deleteDropdownRes = await fetch(`${SUPABASE_URL}/rest/v1/dropdown_answers?question_id=eq.${questionId}`, {
          method: 'DELETE',
          headers
        });
        
        if (!deleteDropdownRes.ok) {
          const errorText = await deleteDropdownRes.text();
          console.warn('⚠️ Failed to delete existing dropdown answers:', deleteDropdownRes.status, errorText);
          warnings.push(`Failed to delete existing dropdown answers: ${deleteDropdownRes.status} - ${errorText}`);
        } else {
          console.log('✅ Successfully deleted existing dropdown answers');
        }
        
        // Delete existing regular answers if changing to dropdown
        const deleteAnswersRes = await fetch(`${SUPABASE_URL}/rest/v1/answers?question_id=eq.${questionId}`, {
          method: 'DELETE',
          headers
        });
        
        if (!deleteAnswersRes.ok) {
          const errorText = await deleteAnswersRes.text();
          console.warn('⚠️ Failed to delete existing regular answers:', deleteAnswersRes.status, errorText);
          warnings.push('Could not delete existing regular answers');
        }
        
        // Wait a moment to ensure deletion is processed
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Create new dropdown items
        if (questionData.dropdownItems && questionData.dropdownItems.length > 0) {
          const dropdownData = questionData.dropdownItems.map((item: any, index: number) => ({
            question_id: questionId,
            statement: item.statement,
            correct_answer: item.correctAnswer,
            options: item.options,
            position: index
          }));
          
          console.log('🔄 Creating new dropdown items:', dropdownData);
          
          const dropdownRes = await fetch(`${SUPABASE_URL}/rest/v1/dropdown_answers`, {
            method: 'POST',
            headers,
            body: JSON.stringify(dropdownData)
          });
          
          if (!dropdownRes.ok) {
            const errorText = await dropdownRes.text();
            console.error('⚠️ Dropdown answers creation failed:', dropdownRes.status, errorText);
            warnings.push(`Failed to create dropdown items: ${dropdownRes.status} - ${errorText}`);
          } else {
            try {
              const responseText = await dropdownRes.text();
              if (responseText) {
                const createdDropdownItems = JSON.parse(responseText);
                console.log('✅ Successfully created dropdown items:', createdDropdownItems.length, 'items');
              } else {
                console.log('✅ Successfully created dropdown items (empty response)');
              }
              answerUpdateSuccess = true;
            } catch (parseError) {
              console.error('⚠️ Failed to parse dropdown creation response:', parseError);
              warnings.push(`Dropdown creation succeeded but response parsing failed: ${parseError instanceof Error ? parseError.message : 'JSON parse error'}`);
              answerUpdateSuccess = true; // Still consider it successful since the request succeeded
            }
          }
        }
      }
      
    } catch (answerError) {
      console.error('⚠️ Non-critical error during answer processing:', answerError);
      warnings.push(`Answer processing warning: ${answerError instanceof Error ? answerError.message : 'Unknown error'}`);
    }
    
    // Return success with warnings if any
    const response = {
      success: true,
      questionUpdateSuccess,
      answerUpdateSuccess,
      ...(warnings.length > 0 && { warnings })
    };
    
    console.log('🎉 Question update completed:', response);
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Critical error in PATCH /api/admin/questions/[id]:', error);
    
    // If question update succeeded but something else failed, still return success with warnings
    if (questionUpdateSuccess) {
      return NextResponse.json({
        success: true,
        questionUpdateSuccess: true,
        answerUpdateSuccess: false,
        warnings: [`Critical error during answer processing: ${error instanceof Error ? error.message : 'Unknown error'}`]
      });
    }
    
    // Question update failed - this is a real failure
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update question' },
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