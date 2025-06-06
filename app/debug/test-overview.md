# Test Page Functionality Overview

## Core Components & Files

### Main Test Page
- `/app/test/[id]/page.tsx`: Dynamic route that loads and displays test data for a specific test ID

### Test Components
- `TestContainer.tsx`: Main container that manages test state and phases (idle, in-progress, completed)
- `QuestionCard.tsx`: Displays individual questions and collects user answers
- `TestStartScreen.tsx`: Initial screen with test information before starting
- `TestSummary.tsx`: Final screen showing test results after completion
- `Timer.tsx`: Countdown timer for test time limit
- `QuestionNavigation.tsx`: Navigation between questions

### Key Utility Files
- `test-utils.ts`: Core functions for test functionality (formatting, calculations, validation)
- `supabase-tests.ts`: Database interaction for tests (fetch, create, update)
- `types.ts`: Type definitions for test-related objects
- `direct-supabase.ts`: Direct connection to Supabase without auth wrappers
- `fetch-utils.ts`: Utilities for reliable fetching with retry/timeout logic

## Test Page Flow

1. **Test Page Load**:
   - Fetches test data for the given ID from Supabase
   - Uses both direct and authenticated clients with retry logic
   - Falls back to default test data if fetch fails or times out

2. **Question Loading**:
   - First fetches test metadata from `tests` table
   - Then fetches question IDs from `test_questions` table (join table)
   - For each question, fetches answers from the appropriate table based on question type

3. **Test Interaction**:
   - Test starts in "idle" phase with TestStartScreen
   - Transitions to "in-progress" when user starts the test
   - Questions can be navigated forwards and backwards
   - Timer tracks remaining time
   - Test completes when user finishes or time expires
   - Results are displayed on TestSummary screen

## Question Types
The system supports multiple question types:
- Single-choice: One correct answer
- Multiple-choice: Multiple correct answers
- True/False: Binary choice
- Matching: Match items from two columns (UI incomplete)
- Sequence: Arrange items in correct order (UI incomplete)
- Drag-and-Drop: Drag items to correct categories (UI incomplete)

## Database Schema
The key tables for the test page:
- `tests`: Test metadata (title, description, time limit)
- `test_questions`: Join table linking tests to questions, includes position
- `questions`: Question text and type
- Question answer tables:
  - `answers`: For single/multiple choice questions
  - `match_items`: For matching questions
  - `sequence_items`: For sequence questions
  - `drag_drop_items`: For drag-drop questions

## Identified Issues

1. **Complex Question Type UI**:
   - Matching, sequence, and drag-drop question types have incomplete UI components

2. **Error Handling**:
   - Extensive fallback mechanisms but could have better user feedback

3. **Supabase Connection**:
   - Uses multiple approaches to connect to Supabase with different auth methods
   - Debug page needed to diagnose connection issues

4. **Table References**:
   - Some code might have inconsistent table name references

5. **Performance**:
   - Fetches each question's answers separately, could be optimized

## Debugging Tools
- `/app/debug/page.tsx`: Tests Supabase connection and queries
- Debug console logs throughout the test loading process
- Window method `forceDbFetch` exposed for manual debugging

## Recommendations
1. Complete the UI for complex question types
2. Consolidate Supabase connection methods
3. Optimize question and answer fetching
4. Implement proper test session persistence
5. Improve error feedback to users