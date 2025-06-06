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
import { createClientSupabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import { mockQuestions, generateMockId } from './supabase-mock'; 

// Get all questions with their associated data
export async function fetchQuestions(questionIds?: string[]) {
  try {
    const supabase = createClientSupabase();
    
    // Fetch all questions or specific ones if IDs are provided
    // Use correct table name from initial schema
    let query = supabase.from('questions').select('*');
    if (questionIds && questionIds.length > 0) {
      query = query.in('id', questionIds);
    }
    
    const { data: questions, error } = await query;
    
    if (error) {
      console.error('Error fetching questions:', error);
      return questionIds 
        ? mockQuestions.filter(q => questionIds.includes(q.id)) 
        : mockQuestions;
    }
    
    if (!questions || questions.length === 0) {
      console.log('No questions found, using mock data');
      return questionIds 
        ? mockQuestions.filter(q => questionIds.includes(q.id)) 
        : mockQuestions;
    }
    
    console.log('Questions data fetched successfully:', questions.length);
    
    // Fetch associated data for each question based on type
    const questionsWithAnswers = await Promise.all(questions.map(async (question) => {
      let answers = [];
      
      switch (question.type) {
        case 'multiple-choice':
        case 'single-choice':
        case 'true-false':
          const { data: choiceAnswers, error: choiceError } = await supabase
            .from('answers') // Correct table name from initial schema
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
    console.error('Error fetching questions:', error);
    // Fall back to mock data
    if (questionIds) {
      return mockQuestions.filter(q => questionIds.includes(q.id));
    }
    return mockQuestions;
  }
}

// Create a new question with associated answers
export async function createQuestion(questionData: QuestionFormData) {
  try {
    const supabase = createClientSupabase();
    
    // Create a new question in the database
    const questionId = uuidv4();
    
    // Step 1: Insert the question - use correct table name from initial schema
    const { error: questionError } = await supabase
      .from('questions')
      .insert({
        id: questionId,
        text: questionData.text,
        type: questionData.type,
        category_id: questionData.categoryId,
        media_url: questionData.mediaUrl
      });
      
    if (questionError) throw questionError;
    
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
            
          if (answersError) throw answersError;
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
            
          if (matchItemsError) throw matchItemsError;
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
            
          if (sequenceItemsError) throw sequenceItemsError;
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
            
          if (dragDropItemsError) throw dragDropItemsError;
        }
        break;
    }
    
    return questionId;
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
}

// Other functions follow the same pattern of trying Supabase first,
// then falling back to mock data if the tables don't exist or there's an error

// Update an existing question
export async function updateQuestion(questionData: QuestionFormData) {
  if (!questionData.id) throw new Error('Question ID is required for update');
  
  try {
    const supabase = createClientSupabase();
    
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
      
    if (questionError) throw questionError;
    
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
            
          if (deleteError) throw deleteError;
          
          // Then insert new answers
          const answersToInsert = questionData.answers.map(answer => ({
            question_id: questionData.id,
            text: answer.text,
            is_correct: answer.isCorrect
          }));
          
          const { error: answersError } = await supabase
            .from('answers')
            .insert(answersToInsert);
            
          if (answersError) throw answersError;
        }
        break;
        
      case 'matching':
        if (questionData.matchItems && questionData.matchItems.length > 0) {
          // First delete existing match items
          const { error: deleteError } = await supabase
            .from('match_items')
            .delete()
            .eq('question_id', questionData.id);
            
          if (deleteError) throw deleteError;
          
          // Then insert new match items
          const matchItemsToInsert = questionData.matchItems.map(item => ({
            question_id: questionData.id,
            left_text: item.leftText,
            right_text: item.rightText
          }));
          
          const { error: matchItemsError } = await supabase
            .from('match_items')
            .insert(matchItemsToInsert);
            
          if (matchItemsError) throw matchItemsError;
        }
        break;
        
      case 'sequence':
        if (questionData.sequenceItems && questionData.sequenceItems.length > 0) {
          // First delete existing sequence items
          const { error: deleteError } = await supabase
            .from('sequence_items')
            .delete()
            .eq('question_id', questionData.id);
            
          if (deleteError) throw deleteError;
          
          // Then insert new sequence items
          const sequenceItemsToInsert = questionData.sequenceItems.map((item, index) => ({
            question_id: questionData.id,
            text: item.text,
            correct_position: item.correctPosition || index + 1
          }));
          
          const { error: sequenceItemsError } = await supabase
            .from('sequence_items')
            .insert(sequenceItemsToInsert);
            
          if (sequenceItemsError) throw sequenceItemsError;
        }
        break;
        
      case 'drag-drop':
        if (questionData.dragDropItems && questionData.dragDropItems.length > 0) {
          // First delete existing drag drop items
          const { error: deleteError } = await supabase
            .from('drag_drop_items')
            .delete()
            .eq('question_id', questionData.id);
            
          if (deleteError) throw deleteError;
          
          // Then insert new drag drop items
          const dragDropItemsToInsert = questionData.dragDropItems.map(item => ({
            question_id: questionData.id,
            content: item.content,
            target_zone: item.targetZone
          }));
          
          const { error: dragDropItemsError } = await supabase
            .from('drag_drop_items')
            .insert(dragDropItemsToInsert);
            
          if (dragDropItemsError) throw dragDropItemsError;
        }
        break;
    }
    
    return questionData.id;
  } catch (error) {
    console.error('Error updating question:', error);
    throw error;
  }
}

// Delete a question and its associated data
export async function deleteQuestion(questionId: string) {
  try {
    const supabase = createClientSupabase();
    
    // First delete associated items based on question type
    // We need to determine the question type first
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('type')
      .eq('id', questionId)
      .single();
      
    if (questionError) throw questionError;
    
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
      
    if (deleteError) throw deleteError;
    
    return true;
  } catch (error) {
    console.error('Error deleting question:', error);
    throw error;
  }
}

// Add a question to a test
export async function addQuestionToTest(testId: string, questionId: string, position: number) {
  try {
    const supabase = createClientSupabase();
    
    const { error } = await supabase
      .from('test_questions')
      .insert({
        test_id: testId,
        question_id: questionId,
        position: position
      });
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error adding question to test:', error);
    throw error;
  }
}