# Test Engine Debug Suite

The Debug suite provides tools for diagnosing and troubleshooting issues with the Test Engine application. This directory contains several debugging utilities that can help identify and resolve problems.

## Available Debugging Tools

### 1. Main Debug Page (`/debug/page.tsx`)

- Basic connection test to Supabase
- Tests database access 
- Verifies basic functionality

### 2. Test Debugger (`/debug/test-debugger/page.tsx`)

- Comprehensive test page debugger
- Tests specific functions related to the test-taking functionality
- Provides detailed diagnostics and logs
- Visualizes test data, questions, and answers

## How to Use These Tools

1. Navigate to `/debug` to access the main debug page
2. Navigate to `/debug/test-debugger` to access the test-specific debugger
3. Use the logs and diagnostic information to identify issues

## Key Utilities

The debug tools make use of several utility files that can also be used in production code:

- `/app/lib/test-debugger-utils.ts` - Debug-specific utilities for testing test functionality
- `/app/lib/optimized-test-fetcher.ts` - Optimized implementation of test data fetching

## Troubleshooting

If you're experiencing issues with the test functionality, follow these steps:

1. Check the main debug page to verify basic connection to Supabase
2. Use the Test Debugger to test specific test IDs and functions
3. Review the logs and diagnostic information
4. Consult the troubleshooting guide at `/debug/test-debugger/troubleshooting.md`

## Using the Optimized Fetcher

The optimized test fetcher provides several advantages over the original implementation:

- Batch loading of answers for better performance
- Parallel queries for faster data retrieval
- Better error handling and fallbacks
- Detailed diagnostics

To use it in production code, replace calls to `fetchTestWithQuestions` with `fetchTestWithQuestionsOptimized`.

Example:

```typescript
import { fetchTestWithQuestionsOptimized } from '@/app/lib/optimized-test-fetcher';

// Replace this:
const testData = await fetchTestWithQuestions(supabase, testId);

// With this:
const testData = await fetchTestWithQuestionsOptimized(supabase, testId);
```