# Test Engine - Test Page Troubleshooting Guide

This document provides guidance on using the Test Debugger page and common issues that might occur with the test functionality.

## Using the Test Debugger

The Test Debugger page is designed to help diagnose and troubleshoot issues with the test-taking functionality. Here's how to use it effectively:

### Key Features

1. **Test Selection**: Choose a test from the dropdown menu (includes both predefined test IDs and tests fetched from the database).

2. **Test Functions**: The page tests several critical functions:
   - `fetchTestWithQuestions`: The main function for retrieving test data with questions and answers
   - Direct database access: Tests low-level database queries
   - `fetchWithRetry`: Tests the retry mechanism for failed requests
   - `withTimeout`: Tests the timeout prevention mechanism

3. **Tabs**:
   - **Test Data**: Displays the overall test information
   - **Questions**: Shows details about each question
   - **Answers**: Displays answer data for each question type
   - **Debug Logs**: Shows a chronological log of events for debugging

### How to Run Tests

1. Select a test from the dropdown menu
2. Click "Test Selected Test" to run tests for that specific test
3. Click "Run All Tests" to run all available diagnostic tests
4. View the results in the appropriate tabs

## Common Issues and Solutions

### 1. Test Not Loading or Infinite Loading

**Symptoms:**
- Infinite loading screen on the test page
- Error message about test not being available
- Test page continually shows loading spinner without progressing

**Possible Causes:**
- Database connection issues
- Test ID doesn't exist
- Questions not properly linked to the test
- **TABLE NAME MISMATCHES** - Most common issue!
- Missing error handling leading to infinite loading

**Debugging Steps:**
1. Check the Debug Logs tab for connection errors
2. Verify that the test exists in the database
3. Check that test questions are properly linked in the `test_questions` table
4. Verify correct question type-specific tables are populated (answers, match_items, etc.)
5. **Check table names in code**: 
   - Use "questions" table for question data 
   - Use "answers" table for answer data
6. Add proper timeout handling to prevent infinite loading states

### 2. Questions Display Incorrectly

**Symptoms:**
- Questions show but without answers
- Wrong question type display
- Missing images or media

**Possible Causes:**
- Question type mismatch
- Answer records missing in specific tables
- Media URLs broken

**Debugging Steps:**
1. Check the Questions and Answers tabs to verify the question data structure
2. Ensure each question has the correct type and matching answers in the appropriate table
3. Verify media URLs are accessible

### 3. Answer Submission Issues

**Symptoms:**
- Answers not being recorded
- Unable to submit test
- Scoring appears incorrect

**Possible Causes:**
- Answer validation issues
- Database permissions preventing submissions
- Logic errors in scoring

**Debugging Steps:**
1. Check answer format in the Answers tab
2. Verify that client permissions allow for inserting user answers
3. Test the answer validation logic with sample data

### 4. Performance Issues

**Symptoms:**
- Very slow test loading
- Timeouts when loading questions

**Possible Causes:**
- Too many database queries
- Large number of questions or complex question types
- Network latency

**Debugging Steps:**
1. Compare the duration metrics in the Test Data tab
2. Check if direct database access is faster than the utility functions
3. Consider optimizing the database queries or batching requests

## Error Code Reference

If you encounter specific error codes, here's what they might mean:

- **PGRST**: PostgreSQL REST API errors (usually permissions)
- **TIMEOUT**: Request exceeded time limit
- **RETRY_FAILED**: All retry attempts were unsuccessful
- **DB_CONN**: Database connection issues
- **AUTH**: Authentication or permission issues

## Best Practices

1. **Always check logs first**: The Debug Logs tab provides valuable chronological information about what happened.

2. **Compare methods**: Check if direct database access works when utility functions fail.

3. **Verify data structure**: Make sure the test, questions, and answers follow the expected structure.

4. **Test with known IDs**: Use the predefined test IDs first to establish a baseline.

## Additional Resources

For more information on the test system architecture, refer to:

- Database schema overview (see migrations folder)
- Test engine core logic in `lib/test-utils.ts`
- Question components in `components/test/`