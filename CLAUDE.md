# Practice ERP - Exam Preparation Platform

## Project Overview

Practice ERP is a comprehensive exam preparation platform focused on Business Tech and ERP exams. The platform allows users to create accounts, take practice tests, review their performance, and improve their test preparation based on past results, ultimately better preparing them for real-life certification exams.

### Key Features

- **User Authentication**: Account creation and management system
- **Test Taking**: Interactive UI for taking exams with various question types
- **Performance Analytics**: Detailed breakdown of test results and performance metrics
- **Admin Dashboard**: Management interface for creating and managing tests and questions

### Subscription Tiers

- **Free Tier**: Fixed exam questions
- **Paid Tier**: Randomized questions and detailed performance analytics (time per question, problem question types)

## Technical Stack

- **Frontend**: Next.js with React
- **Backend**: Supabase (PostgreSQL database with Row-Level Security)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS

## Database Schema

The database is structured around these core entities:

- **Users/Profiles**: User account information
- **Categories**: Subject areas for tests (e.g., "Programming", "Mathematics")
- **Tests**: Test definitions with metadata and optional tags for organization
- **Questions**: Various question types with their answers
- **Test Sessions**: Records of user attempts at tests
- **User Answers**: User responses to questions

## Question Types Supported

1. **Multiple Choice**: Select multiple correct answers
2. **Single Choice**: Select one correct answer
3. **True/False**: Binary choice questions
4. **Matching**: Match items from two columns
5. **Sequence**: Arrange items in the correct order
6. **Drag and Drop**: Drag items to their correct categories

## Core Workflows

### User Workflow

1. User registers/logs in
2. Browses available tests by category
3. Starts a test (creating a test session)
4. Answers questions within the time limit
5. Receives immediate feedback on completion
6. Reviews performance in dashboard
7. Receives suggestions for areas of improvement

### Admin Workflow

1. Admin logs in with elevated privileges
2. Creates/edits categories
3. Creates/edits tests with optional tags for organization
4. Creates/edits questions of various types using modal-based forms
5. Assigns questions to tests
6. Views analytics on test performance

### Admin Interface Features

The admin interface has been streamlined for better usability:

- **Modal-Based Question Management**: Both creating new questions and editing existing questions use popup modals instead of inline forms
- **Simplified Question Forms**: Removed complexity by eliminating difficulty and points fields, focusing on essential question properties
- **Improved Navigation**: Cleaner test management interface with better visual organization of categories and questions
- **Tag-Based Organization**: Tests can be organized using user-friendly tags for better classification and filtering

## Current Development Status

The basic framework of the application is in place, including:

- Authentication system
- Database schema
- Test taking interface
- Question display and answering
- Basic admin interfaces for test/question management

## Next Development Priorities

1. Complete the user dashboard with performance analytics
2. Implement the subscription tier system
3. Enhance admin analytics
4. Improve the test taking UI/UX
5. Add more question types if needed
6. Implement email notifications

## Important Files and Directories

- `/app/components/`: UI components
- `/app/lib/`: Core business logic and Supabase interaction
- `/app/admin/`: Admin interface pages
- `/app/dashboard/`: User dashboard
- `/app/test/`: Test taking interface
- `/supabase/migrations/`: Database schema and seed data

## Local Development

To run the project locally:

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase environment variables
4. Run migrations to set up the database schema
5. Start the development server: `npm run dev`
6. Access the application at [http://localhost:3000](http://localhost:3000)

## Authentication

The system uses Supabase Auth with the following roles:

- **Regular users**: Can take tests and view their own performance
- **Admin users**: Can manage tests, questions, and view analytics

## Test Performance Analysis

The system tracks:

- Time spent per question
- Question accuracy rates
- Category-specific performance
- Overall test scores
- Historical performance trends

## Test Organization System

The platform uses a dual organization system:

- **Categories**: Technical subject areas for internal organization (e.g., "Programming", "Mathematics")
- **Tags**: User-friendly labels for test classification (e.g., "Beginner", "Advanced", "Mock Exam", "Certification Prep")

### Tag System Features

- **Homepage Display**: Test cards show tags instead of categories for better user experience
- **Admin Management**: Administrators can assign tags to tests for improved organization
- **Optional Field**: Tests can exist without tags, providing flexibility
- **Visual Indicators**: Tags appear as colored pills in both test cards and admin interface

### Recent Updates

- **Navigation & UI Improvements (December 3, 2025)**:
  - **Admin Sidebar**: Removed "Back to Website" button, streamlined to only Tests and Sign Out
  - **Sidebar Text Labels**: Now properly hide with opacity transition when sidebar is minimized
  - **Student Profile Access**: Added Profile link to student navbar dropdown with User icon
  - **Responsive Tests Management**: Fixed header layout to wrap buttons properly on smaller screens
  - **Mobile-Friendly Admin**: Button container now uses flex-wrap for better mobile experience
- **Webflow CMS Sync**: Sync featured tests to Webflow for marketing website
  - "Sync to Webflow" button in admin tests page
  - Syncs only tests marked as featured
  - Creates, updates, and deletes items in Webflow collection automatically
  - Requires environment variables: `WEBFLOW_API_TOKEN`, `WEBFLOW_SITE_ID`, `WEBFLOW_COLLECTION_ID`
  - See [Webflow Sync Setup](#webflow-cms-sync-setup) section for configuration
- **Featured Tests System**: Added `feature` boolean field to tests for homepage display
  - Featured tests are prominently displayed on the homepage
  - Toggle in admin interface (Edit Test modal) to mark tests as featured
  - Bulk upload Excel template supports "Featured" column (TRUE/FALSE)
  - Visual indicator with ⭐ badge in admin test listings
- **Purchase Modal Enhancement**: Preview test completion pages now use modal-based purchase system
- **Test Summary Improvements**:
  - Shows test name in completion overview
  - Displays category-based performance metrics instead of question types
  - Includes correct answers and explanations in question breakdown
  - Fixed dropdown question validation bug
  - Fixed time display to cap at allocated time limit and percentage at 100%
- **UI Simplification**: Removed /test page and simplified navigation to Dashboard/Sign Out only
- **Tag System**: Added tag field to tests table with admin interface support
- **Admin Interface Enhancements**:
  - Converted question creation and editing forms to modal-based interface
  - Removed difficulty and points fields from question management
  - Streamlined question form layout and simplified admin workflows
  - Improved user experience for managing questions in tests with many categories
- **Admin Test Preview Features**:
  - Added "Preview Test" button to manage test page - opens `/preview-test/{id}` with only preview questions
  - Added "Take Full Test" button to manage test page - opens `/test/{id}` with all questions
  - Admins can access all tests (including premium/paid tests) without purchase restrictions
  - Admin test sessions are not stored in the database - no records created for admin test attempts
  - Admins always start fresh when viewing tests (no session resumption)

## Admin Access Control

Admins have special privileges for test access:

- **Full Test Access**: Admins can take any test (free or paid) without purchase
- **No Session Storage**: When admins take tests, no database records are created:
  - No entries in `test_sessions` table
  - No entries in `user_answers` table
  - No entries in `selected_answers` table
- **Fresh Start Every Time**: Admins always start tests fresh without session resumption
- **Score Calculation**: Admins still see their results after completing a test, but results are not persisted

This ensures admins can preview and test the exam experience without polluting analytics data or creating unnecessary database records.

This context will be updated as the project evolves.

## Test Page Development ToDo List

To make the test page work at 100% functionality, the following tasks need to be completed:

### High Priority
- ✅ Fix table name references in test page (use questions and answers)
- ✅ Debug Supabase connection and authentication issues
- ✅ Implement robust error handling on the test page
- ✅ Add loading state indicators with timeouts to prevent infinite loading
- ✅ Fix QuestionCard component to properly handle all question types
- ✅ Implement batch fetching for answers to improve performance

### Medium Priority
- Add interactive UI components for complex question types (matching, sequence, drag-drop)
- Improve randomization algorithm for questions to avoid duplicates
- Create more intuitive testing interface for different question types
- Implement test timer with auto-submission functionality
- Add mobile responsiveness to test interface

### Low Priority
- Persist test sessions to Supabase database for resuming tests
- Add analytics tracking for test performance

## Project Database Notes

- Table names in the schema and code should be `questions` and `answers`
- All Supabase queries should use these table names
- Debug tools are available at `/debug/table-check` to verify table names and counts
- Diagnostic utilities for query optimization are at `/api/diagnose/query-timing` and `/api/diagnose/test-fetch`

## Performance Optimizations

The application has been optimized for better performance:

### Server-Side Optimizations
- **Caching System**: Implemented an in-memory LRU cache with TTL in `cache-utils.ts` for test data, questions and answers
- **Database Indexes**: Added specialized indexes in `20240516_001_performance_indexes.sql` for faster query performance
- **Batch Loading**: Used parallel queries and batch loading in `ultra-optimized-test-fetcher.ts` to reduce database roundtrips
- **Consolidated Queries**: Optimized JOIN queries to fetch related data in single requests

### Client-Side Optimizations
- **Progressive Loading**: Implemented a progressive loading UI in `ProgressiveTestContainer.tsx` that shows content as it loads
- **Component Memoization**: Used React.memo and useMemo in `OptimizedQuestionCard.tsx` to prevent unnecessary re-renders
- **Optimized React State**: Eliminated redundant state updates and unnecessary renders
- **Suspense and Dynamic Imports**: Used React Suspense for smoother loading experience

### Try the Optimized Version
- Access the optimized test page at `/optimized-test/[id]` instead of `/test/[id]`
- The optimized version shows a progressive loading UI that displays content as it loads
- The first load populates the cache, making subsequent visits much faster

## Webflow CMS Sync Setup

The application can sync featured tests to a Webflow CMS collection for marketing purposes. This allows the Webflow marketing site to display featured tests while the Next.js app handles the actual test-taking functionality.

### Architecture
- **Webflow**: Marketing website frontend (homepage, about, pricing pages)
- **Next.js App**: Backend system for authentication, signup, login, and test-taking

### Environment Variables

Add these to your `.env.local` file:

```
WEBFLOW_API_TOKEN=your_webflow_api_token
WEBFLOW_SITE_ID=your_webflow_site_id
WEBFLOW_COLLECTION_ID=your_webflow_collection_id
```

### Getting Webflow Credentials

1. **API Token**: Go to Webflow > Site Settings > Apps & Integrations > Generate API Token
2. **Site ID**: Found in Site Settings > General > Site ID (or from the URL in Webflow dashboard)
3. **Collection ID**: Create a collection in Webflow CMS, then find the ID in the collection settings or URL

### Webflow Collection Schema

Create a collection in Webflow with these fields (field slugs in parentheses):

| Field Name | Slug | Type | Notes |
|------------|------|------|-------|
| Name | `name` | Plain Text | Required by Webflow |
| Slug | `slug` | Slug | Required, auto-generated |
| Supabase ID | `supabase-id` | Plain Text | Used for tracking |
| Description | `description` | Plain Text | Test description |
| Duration | `duration` | Number | Time in minutes |
| Question Count | `question-count` | Number | Number of questions |
| Price | `price` | Number | Test price |
| Currency | `currency` | Plain Text | e.g., USD |
| Is Free | `is-free` | Switch | Whether test is free |
| Tag | `tag` | Plain Text | Test tag |
| Categories | `categories` | Plain Text | Comma-separated |

### How Sync Works

1. Click "Sync to Webflow" button in Admin > Tests page
2. System fetches all tests with `feature = true`
3. For each featured test:
   - Creates new Webflow item if it doesn't exist
   - Updates existing item if test data changed
   - Deletes items for tests no longer featured
4. Publishes all changes to make them live

### Files

- `/app/lib/webflow-sync.ts` - Core sync service
- `/app/api/admin/sync-webflow/route.ts` - API endpoint
- `/app/admin/tests/page.tsx` - Admin UI with sync button