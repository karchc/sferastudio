import { 
  Question, 
  QuestionType, 
  Answer, 
  MatchItem,
  SequenceItem,
  DragDropItem,
  Category,
  QuestionFormData
} from './types';
import { createDirectSupabase } from './direct-supabase';
import { v4 as uuidv4 } from 'uuid';

// Get all questions with their associated data using direct Supabase connection
export async function fetchQuestions(questionIds?: string[]) {
  const supabase = createDirectSupabase();
  
  try {
    console.log('Fetching questions directly from Supabase');
    
    // Fetch all questions or specific ones if IDs are provided
    let query = supabase.from('questions').select('*');
    if (questionIds && questionIds.length > 0) {
      query = query.in('id', questionIds);
    }
    
    const { data: questions, error } = await query;
    
    if (error) {
      console.error('Error fetching questions directly:', error);
      throw error;
    }
    
    if (!questions || questions.length === 0) {
      console.log('No questions found in database directly');
      return [];
    }
    
    console.log(`Successfully fetched ${questions.length} questions directly`);
    
    // Fetch associated data for each question based on type
    const questionsWithAnswers = await Promise.all(questions.map(async (question) => {
      let answers = [];
      
      switch (question.type) {
        case 'multiple-choice':
        case 'single-choice':
        case 'true-false':
          const { data: choiceAnswers, error: choiceError } = await supabase
            .from('answers')
            .select('*')
            .eq('question_id', question.id);
            
          if (!choiceError && choiceAnswers) answers = choiceAnswers;
          break;
          
        case 'matching':
          const { data: matchItems, error: matchError } = await supabase
            .from('match_items')
            .select('*')
            .eq('question_id', question.id);
            
          if (!matchError && matchItems) answers = matchItems;
          break;
          
        case 'sequence':
          const { data: sequenceItems, error: sequenceError } = await supabase
            .from('sequence_items')
            .select('*')
            .eq('question_id', question.id)
            .order('correct_position', { ascending: true });
            
          if (!sequenceError && sequenceItems) answers = sequenceItems;
          break;
          
        case 'drag-drop':
          const { data: dragDropItems, error: dragDropError } = await supabase
            .from('drag_drop_items')
            .select('*')
            .eq('question_id', question.id);
            
          if (!dragDropError && dragDropItems) answers = dragDropItems;
          break;
      }
      
      // Convert database format to application format
      return {
        id: question.id,
        text: question.text,
        type: question.type as QuestionType,
        categoryId: question.category_id,
        mediaUrl: question.media_url,
        answers: ['multiple-choice', 'single-choice', 'true-false'].includes(question.type) ? answers : undefined,
        matchItems: question.type === 'matching' ? answers : undefined,
        sequenceItems: question.type === 'sequence' ? answers : undefined,
        dragDropItems: question.type === 'drag-drop' ? answers : undefined,
      };
    }));
    
    return questionsWithAnswers;
  } catch (error) {
    console.error('Exception fetching questions directly:', error);
    throw error;
  }
}

// Create a new question with associated answers using direct connection
export async function createQuestion(questionData: QuestionFormData) {
  const supabase = createDirectSupabase();
  
  try {
    console.log('Creating question directly:', questionData);
    
    // Create a new question in the database
    const questionId = uuidv4();
    
    // Step 1: Insert the question - use correct table name
    const { error: questionError } = await supabase
      .from('questions')
      .insert({
        id: questionId,
        text: questionData.text,
        type: questionData.type,
        category_id: questionData.categoryId,
        media_url: questionData.mediaUrl
      });
      
    if (questionError) {
      console.error('Error creating question directly:', questionError);
      throw questionError;
    }
    
    // Step 2: Insert answers based on question type
    switch (questionData.type) {
      case 'multiple-choice':
      case 'single-choice':
      case 'true-false':
        if (questionData.answers && questionData.answers.length > 0) {
          const answersToInsert = questionData.answers.map(answer => ({
            question_id: questionId,
            text: answer.text,
            is_correct: answer.isCorrect
          }));
          
          const { error: answersError } = await supabase
            .from('answers')
            .insert(answersToInsert);
            
          if (answersError) {
            console.error('Error creating answers directly:', answersError);
            throw answersError;
          }
        }
        break;
        
      case 'matching':
        if (questionData.matchItems && questionData.matchItems.length > 0) {
          const matchItemsToInsert = questionData.matchItems.map(item => ({
            question_id: questionId,
            left_text: item.leftText,
            right_text: item.rightText
          }));
          
          const { error: matchItemsError } = await supabase
            .from('match_items')
            .insert(matchItemsToInsert);
            
          if (matchItemsError) {
            console.error('Error creating match items directly:', matchItemsError);
            throw matchItemsError;
          }
        }
        break;
        
      case 'sequence':
        if (questionData.sequenceItems && questionData.sequenceItems.length > 0) {
          const sequenceItemsToInsert = questionData.sequenceItems.map((item, index) => ({
            question_id: questionId,
            text: item.text,
            correct_position: item.correctPosition || index + 1
          }));
          
          const { error: sequenceItemsError } = await supabase
            .from('sequence_items')
            .insert(sequenceItemsToInsert);
            
          if (sequenceItemsError) {
            console.error('Error creating sequence items directly:', sequenceItemsError);
            throw sequenceItemsError;
          }
        }
        break;
        
      case 'drag-drop':
        if (questionData.dragDropItems && questionData.dragDropItems.length > 0) {
          const dragDropItemsToInsert = questionData.dragDropItems.map(item => ({
            question_id: questionId,
            content: item.content,
            target_zone: item.targetZone
          }));
          
          const { error: dragDropItemsError } = await supabase
            .from('drag_drop_items')
            .insert(dragDropItemsToInsert);
            
          if (dragDropItemsError) {
            console.error('Error creating drag drop items directly:', dragDropItemsError);
            throw dragDropItemsError;
          }
        }
        break;
    }
    
    console.log('Question created successfully with direct access:', questionId);
    return questionId;
  } catch (error) {
    console.error('Exception creating question directly:', error);
    throw error;
  }
}

// Update an existing question using direct connection
export async function updateQuestion(questionData: QuestionFormData) {
  if (!questionData.id) throw new Error('Question ID is required for update');
  
  const supabase = createDirectSupabase();
  
  try {
    console.log('Updating question directly:', questionData);
    
    // Step 1: Update the question - use correct table name
    const { error: questionError } = await supabase
      .from('questions')
      .update({
        text: questionData.text,
        type: questionData.type,
        category_id: questionData.categoryId,
        media_url: questionData.mediaUrl
      })
      .eq('id', questionData.id);
      
    if (questionError) {
      console.error('Error updating question directly:', questionError);
      throw questionError;
    }
    
    // Step 2: Update answers based on question type
    switch (questionData.type) {
      case 'multiple-choice':
      case 'single-choice':
      case 'true-false':
        if (questionData.answers && questionData.answers.length > 0) {
          // First delete existing answers
          const { error: deleteError } = await supabase
            .from('answers')
            .delete()
            .eq('question_id', questionData.id);
            
          if (deleteError) {
            console.error('Error deleting answers directly:', deleteError);
            throw deleteError;
          }
          
          // Then insert new answers
          const answersToInsert = questionData.answers.map(answer => ({
            question_id: questionData.id,
            text: answer.text,
            is_correct: answer.isCorrect
          }));
          
          const { error: answersError } = await supabase
            .from('answers')
            .insert(answersToInsert);
            
          if (answersError) {
            console.error('Error inserting updated answers directly:', answersError);
            throw answersError;
          }
        }
        break;
        
      case 'matching':
        if (questionData.matchItems && questionData.matchItems.length > 0) {
          // First delete existing match items
          const { error: deleteError } = await supabase
            .from('match_items')
            .delete()
            .eq('question_id', questionData.id);
            
          if (deleteError) {
            console.error('Error deleting match items directly:', deleteError);
            throw deleteError;
          }
          
          // Then insert new match items
          const matchItemsToInsert = questionData.matchItems.map(item => ({
            question_id: questionData.id,
            left_text: item.leftText,
            right_text: item.rightText
          }));
          
          const { error: matchItemsError } = await supabase
            .from('match_items')
            .insert(matchItemsToInsert);
            
          if (matchItemsError) {
            console.error('Error inserting updated match items directly:', matchItemsError);
            throw matchItemsError;
          }
        }
        break;
        
      case 'sequence':
        if (questionData.sequenceItems && questionData.sequenceItems.length > 0) {
          // First delete existing sequence items
          const { error: deleteError } = await supabase
            .from('sequence_items')
            .delete()
            .eq('question_id', questionData.id);
            
          if (deleteError) {
            console.error('Error deleting sequence items directly:', deleteError);
            throw deleteError;
          }
          
          // Then insert new sequence items
          const sequenceItemsToInsert = questionData.sequenceItems.map((item, index) => ({
            question_id: questionData.id,
            text: item.text,
            correct_position: item.correctPosition || index + 1
          }));
          
          const { error: sequenceItemsError } = await supabase
            .from('sequence_items')
            .insert(sequenceItemsToInsert);
            
          if (sequenceItemsError) {
            console.error('Error inserting updated sequence items directly:', sequenceItemsError);
            throw sequenceItemsError;
          }
        }
        break;
        
      case 'drag-drop':
        if (questionData.dragDropItems && questionData.dragDropItems.length > 0) {
          // First delete existing drag drop items
          const { error: deleteError } = await supabase
            .from('drag_drop_items')
            .delete()
            .eq('question_id', questionData.id);
            
          if (deleteError) {
            console.error('Error deleting drag drop items directly:', deleteError);
            throw deleteError;
          }
          
          // Then insert new drag drop items
          const dragDropItemsToInsert = questionData.dragDropItems.map(item => ({
            question_id: questionData.id,
            content: item.content,
            target_zone: item.targetZone
          }));
          
          const { error: dragDropItemsError } = await supabase
            .from('drag_drop_items')
            .insert(dragDropItemsToInsert);
            
          if (dragDropItemsError) {
            console.error('Error inserting updated drag drop items directly:', dragDropItemsError);
            throw dragDropItemsError;
          }
        }
        break;
    }
    
    console.log('Question updated successfully with direct access:', questionData.id);
    return questionData.id;
  } catch (error) {
    console.error('Exception updating question directly:', error);
    throw error;
  }
}

// Delete a question and its associated data using direct connection
export async function deleteQuestion(questionId: string) {
  const supabase = createDirectSupabase();
  
  try {
    console.log('Deleting question directly:', questionId);
    
    // First determine the question type
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('type')
      .eq('id', questionId)
      .single();
      
    if (questionError) {
      console.error('Error fetching question type for deletion directly:', questionError);
      throw questionError;
    }
    
    // Delete associated data based on question type
    if (['multiple-choice', 'single-choice', 'true-false'].includes(question.type)) {
      await supabase
        .from('answers')
        .delete()
        .eq('question_id', questionId);
    } else if (question.type === 'matching') {
      await supabase
        .from('match_items')
        .delete()
        .eq('question_id', questionId);
    } else if (question.type === 'sequence') {
      await supabase
        .from('sequence_items')
        .delete()
        .eq('question_id', questionId);
    } else if (question.type === 'drag-drop') {
      await supabase
        .from('drag_drop_items')
        .delete()
        .eq('question_id', questionId);
    }
    
    // Delete from test_questions junction table
    await supabase
      .from('test_questions')
      .delete()
      .eq('question_id', questionId);
    
    // Finally delete the question itself
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId);
      
    if (deleteError) {
      console.error('Error deleting question directly:', deleteError);
      throw deleteError;
    }
    
    console.log('Question deleted successfully with direct access');
    return true;
  } catch (error) {
    console.error('Exception deleting question directly:', error);
    throw error;
  }
}