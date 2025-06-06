# Test Page Debug & Fix Guide

## Identified Issues and Solutions

### 1. Inconsistent Table Name References

**Problem:**
The code refers to Supabase tables that must match exactly with the database schema.

**Database Schema Tables:**
- `tests`
- `test_questions`
- `questions`
- `answers`
- `match_items`
- `sequence_items`
- `drag_drop_items`
- `test_sessions`
- `user_answers`
- `selected_answers`
- `selected_match_items`
- `user_sequence_answers`
- `user_drag_drop_answers`

**Fix:**
Ensure all Supabase queries use the exact table names defined in the schema. Current files to check:
- `/app/test/[id]/page.tsx` - Uses correct table names
- `/app/lib/supabase-tests.ts` - Uses correct table names
- `/app/lib/test-utils.ts` - Uses correct table names

### 2. Supabase Connection Issues

**Problem:**
Multiple methods to connect to Supabase with inconsistent error handling.

**Current Implementation:**
- `createClientSupabase()` - In `/app/supabase.ts`
- `createDirectSupabase()` - In `/app/lib/direct-supabase.ts`
- Both try to access the same Supabase instance

**Fix:**
1. Consolidate connection methods
2. Use better error handling with specific error codes
3. Add proper fallback mechanisms

```typescript
// Consolidated connection method in supabase.ts
export const createSupabaseClient = (options = { useAuth: true }) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gezlcxtprkcceizadvre.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';
  
  // Create the regular Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Enhance with auth if needed
  return options.useAuth ? createEnhancedSupabaseClient(supabase) : supabase;
};
```

### 3. QuestionCard Component Issues

**Problem:**
The QuestionCard component doesn't fully support all question types, and has inconsistent answer handling.

**Issues:**
- `question.answers.filter(a => a.isCorrect)` assumes all question types have the same answer structure
- Complex question types (matching, sequence, drag-drop) are not fully implemented

**Fix:**
1. Update to handle different answer types correctly
2. Implement proper UI for complex question types
3. Fix type-specific answer validation

```typescript
// Question type check
const getAnswerItems = (question) => {
  switch (question.type) {
    case 'multiple-choice':
    case 'single-choice':
    case 'true-false':
      return question.answers || [];
    case 'matching':
      return question.matchItems || [];
    case 'sequence':
      return question.sequenceItems || [];
    case 'drag-drop':
      return question.dragDropItems || [];
    default:
      return [];
  }
};

// Multiple correct answers check
const hasMultipleCorrectAnswers = (question) => {
  if (['multiple-choice', 'single-choice', 'true-false'].includes(question.type)) {
    return (question.answers || []).filter(a => a.isCorrect).length > 1;
  }
  return false;
};
```

### 4. Test Page Loading Performance

**Problem:**
The test page makes multiple separate database calls for each question's answers, which can be slow.

**Fix:**
1. Use a single batch query to get all answers for all questions
2. Implement data caching for frequently accessed data
3. Add loading state indicators for better UX

```typescript
// Optimized question and answer fetching
const fetchQuestionsWithAnswers = async (testId, supabase) => {
  // Get all questions for this test in one query
  const { data: testQuestions } = await supabase
    .from('test_questions')
    .select('*, questions(*)')
    .eq('test_id', testId)
    .order('position');
  
  if (!testQuestions?.length) return [];
  
  // Extract question IDs
  const questionIds = testQuestions.map(tq => tq.question_id);
  
  // Batch fetch all answers of different types
  const [choiceAnswers, matchItems, sequenceItems, dragDropItems] = await Promise.all([
    supabase.from('answers').select('*').in('question_id', questionIds),
    supabase.from('match_items').select('*').in('question_id', questionIds),
    supabase.from('sequence_items').select('*').in('question_id', questionIds).order('correct_position'),
    supabase.from('drag_drop_items').select('*').in('question_id', questionIds)
  ]);
  
  // Map answers to questions
  return testQuestions.map(tq => {
    const question = tq.questions;
    if (!question) return null;
    
    // Add answers based on question type
    let answers = [];
    switch (question.type) {
      case 'multiple-choice':
      case 'single-choice':
      case 'true-false':
        answers = (choiceAnswers.data || []).filter(a => a.question_id === question.id);
        break;
      case 'matching':
        answers = (matchItems.data || []).filter(m => m.question_id === question.id);
        break;
      case 'sequence':
        answers = (sequenceItems.data || []).filter(s => s.question_id === question.id);
        break;
      case 'drag-drop':
        answers = (dragDropItems.data || []).filter(d => d.question_id === question.id);
        break;
    }
    
    return {
      ...question,
      position: tq.position,
      answers
    };
  }).filter(Boolean);
};
```

### 5. Error Handling Improvements

**Problem:**
Current error handling uses console logs but doesn't provide good user feedback.

**Fix:**
1. Add toast notifications for errors
2. Use error boundaries for component-level error handling
3. Create specific error states for different failure scenarios

```typescript
// Add error states in TestContainer
const [error, setError] = useState({ 
  hasError: false, 
  message: '',
  code: null
});

// Error display component
const ErrorDisplay = ({ error, onRetry }) => (
  <div className="p-6 rounded-lg border border-red-200 bg-red-50">
    <h3 className="text-lg font-medium text-red-800">Error Loading Test</h3>
    <p className="mt-2 text-red-600">{error.message}</p>
    <button 
      onClick={onRetry}
      className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Try Again
    </button>
  </div>
);

// Use in the component
{error.hasError && (
  <ErrorDisplay 
    error={error} 
    onRetry={handleRetry} 
  />
)}
```

### 6. Implement Test Session Persistence

**Problem:**
Test progress is not saved if the user refreshes or navigates away from the page.

**Fix:**
1. Save test session and answers to the database as the user progresses
2. Implement ability to resume in-progress tests
3. Add a "Save Progress" button

```typescript
// Save function for test progress
const saveTestProgress = async () => {
  if (!user || !test) return;
  
  try {
    // Update or create test session
    const { data: session, error } = await supabase
      .from('test_sessions')
      .upsert({
        id: sessionId || undefined,
        test_id: test.id,
        user_id: user.id,
        start_time: startTime,
        status: 'in_progress',
        updated_at: new Date()
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // Save current session ID
    setSessionId(session.id);
    
    // Save user answers
    for (const answer of userAnswers) {
      // Save user answer record
      const { data: userAnswer, error: answerError } = await supabase
        .from('user_answers')
        .upsert({
          test_session_id: session.id,
          question_id: answer.questionId,
          time_spent: answer.timeSpent || 0,
          is_correct: answer.isCorrect || false,
          updated_at: new Date()
        })
        .select()
        .single();
        
      if (answerError) throw answerError;
      
      // Save specific answer data based on question type
      // ... type-specific saving logic
    }
    
    return true;
  } catch (error) {
    console.error('Error saving test progress:', error);
    return false;
  }
};

// Auto-save at intervals and on component unmount
useEffect(() => {
  if (phase === 'in-progress') {
    const intervalId = setInterval(saveTestProgress, 60000); // Auto-save every minute
    return () => {
      clearInterval(intervalId);
      saveTestProgress(); // Save on unmount
    };
  }
}, [phase, userAnswers]);
```

## Implementation Priority

1. Fix table name references and Supabase connection issues
2. Improve error handling and add user feedback
3. Optimize data fetching for performance
4. Fix QuestionCard component for all question types
5. Implement test session persistence