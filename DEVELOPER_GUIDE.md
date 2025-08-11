# Practice SAP - Developer Guide

## Overview

Practice SAP is a comprehensive exam preparation platform built with Next.js and Supabase, focused on SAP and Business Technology certification exams. This guide provides technical documentation for developers working on the project.

## 🏗️ Architecture Overview

### Technology Stack

- **Frontend**: Next.js 14 with React 18
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **TypeScript**: Full type safety throughout
- **State Management**: React Context + useState/useEffect

### Project Structure

```
/workspaces/sferastudio/
├── app/                          # Next.js app directory
│   ├── admin/                    # Admin interface routes
│   │   ├── tests/               # Test management
│   │   ├── questions/           # Question management
│   │   └── categories/          # Category management
│   ├── components/              # Reusable UI components
│   │   ├── ui/                  # Base UI components
│   │   ├── admin/               # Admin-specific components
│   │   └── test/                # Test-taking components
│   ├── lib/                     # Core business logic
│   │   ├── types.ts             # TypeScript definitions
│   │   ├── auth-context.tsx     # Authentication context
│   │   └── utils/               # Utility functions
│   ├── api/                     # API routes
│   │   ├── admin/               # Admin API endpoints
│   │   ├── test/                # Test-related APIs
│   │   └── user/                # User-related APIs
│   ├── dashboard/               # User dashboard
│   ├── test/                    # Test-taking interface
│   └── auth/                    # Authentication pages
├── supabase/
│   └── migrations/              # Database migrations
└── public/                      # Static assets
```

## 🔧 Core Systems

### 1. Authentication System

**Location**: `/app/lib/auth-context.tsx`

The authentication system uses Supabase Auth with role-based access control:

```typescript
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

**Key Features**:
- JWT-based authentication
- Role-based access (admin vs regular user)
- Persistent sessions
- Profile management

### 2. Question System

**Core Types**: `/app/lib/types.ts`

```typescript
export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  mediaUrl?: string;
  categoryId?: string;
  explanation?: string;
  answers?: Answer[];
  dropdownItems?: DropdownItem[];
}

export type QuestionType = 
  'single_choice' | 'multiple_choice' | 'dropdown' | 'true_false' | 'matching' | 'sequence' | 'drag_drop';
```

**Supported Question Types**:
1. **Single Choice**: Radio button selection
2. **Multiple Choice**: Checkbox selection
3. **Dropdown**: Select from dropdown options
4. **True/False**: Binary choice questions
5. **Matching**: Match items from two columns (planned)
6. **Sequence**: Arrange items in correct order (planned)
7. **Drag and Drop**: Drag items to categories (planned)

**Note**: The database supports both underscore and hyphen formats for question types (e.g., 'single_choice' and 'single-choice').

### 3. Test Management

**Admin Interface**: `/app/admin/tests/[id]/manage/page.tsx`

**Key Features**:
- Category-based question organization
- Modal-based question creation/editing
- Preview question management
- Test configuration (time limits, navigation rules)
- Tag-based test organization

### 4. Database Schema

**Core Tables**:
- `tests`: Test definitions and metadata (now includes `tag` field)
- `categories`: Subject area organization
- `questions`: Question content and configuration (supports difficulty/points)
- `answers`: Multiple choice answer options
- `dropdown_answers`: Dropdown question options
- `test_questions`: Many-to-many relationship
- `test_sessions`: User test attempts
- `user_answers`: User responses
- `user_test_purchases`: User purchase records and subscription data
- `profiles`: User profile information with admin flags

## 🎨 UI/UX Patterns

### Modal System

**Location**: `/app/components/ui/modal.tsx`

All complex forms use modals for better UX:

```typescript
<Modal
  isOpen={isCreatingQuestion}
  onClose={() => setIsCreatingQuestion(false)}
  title="Create New Question"
  size="xl"
>
  <QuestionForm {...props} />
</Modal>
```

### Component Structure

**Base UI Components** (`/app/components/ui/`):
- `button.tsx`: Configurable button with loading states
- `card.tsx`: Content container components
- `modal.tsx`: Overlay modal system
- `confirmation-modal.tsx`: Delete/remove confirmations
- `purchase-modal.tsx`: Test purchase confirmation modal
- `auth-required-modal.tsx`: Authentication required modal
- `mui-button.tsx`: Material UI button wrapper
- `mui-card.tsx`: Material UI card wrapper

**Layout Components** (`/app/components/`):
- `Footer.tsx`: Dynamic footer with authentication-aware "Prep Exam" link routing

**Admin Components** (`/app/components/admin/`):
- `QuestionFormEnhanced.tsx`: Main question creation/editing form
- `QuestionForm.tsx`: Legacy question form (deprecated)

**Test Components** (`/app/components/test/`):
- `TestContainer.tsx`: Main test-taking interface
- `QuestionCard.tsx`: Individual question display
- `OptimizedQuestionCard.tsx`: Memory-optimized question display
- `ProgressiveTestContainer.tsx`: Progressive loading test interface
- `TestSummary.tsx`: Post-test results
- `TestStartScreen.tsx`: Test introduction screen
- `Timer.tsx`: Test countdown timer
- `QuestionNavigation.tsx`: Question navigation controls
- `TestHistoryCard.tsx`: Test history display
- `InProgressTestCard.tsx`: Active test display

**Dashboard Components** (`/app/components/dashboard/`):
- `SuggestionCard.tsx`: Performance improvement suggestions
- `StatisticCard.tsx`: Dashboard statistics display
- `CircularProgress.tsx`: Circular progress indicator
- `CategoryProgressBar.tsx`: Category-specific progress visualization

## 🔄 State Management Patterns

### 1. Component State

Most components use local state with `useState`:

```typescript
const [formData, setFormData] = useState<QuestionFormData>({
  text: "",
  type: "single_choice",
  categoryId: "",
  explanation: '',
  answers: []
});
```

### 2. Loading States

Centralized loading state management:

```typescript
const [loadingStates, setLoadingStates] = useState({
  updateTest: false,
  createQuestion: false,
  deleteQuestion: false,
  // ... other operations
});
```

### 3. Error Handling

Consistent error state pattern:

```typescript
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState<string | null>(null);

// Usage
try {
  await apiCall();
  setSuccess('Operation completed successfully');
  setTimeout(() => setSuccess(null), 3000);
} catch (err) {
  setError(err.message);
}
```

## 🔄 Recent System Enhancements (August 2025)

### Enhanced Question Update System

The question update API has been significantly improved to provide accurate feedback and handle errors gracefully:

**Location**: `/app/api/admin/questions/[id]/route.ts`

**Key Improvements**:
- **Separated Critical Operations**: Question updates vs answer processing treated independently
- **Granular Status Tracking**: Individual success flags for different operations
- **JSON Parsing Protection**: Safe parsing with fallback handling for empty responses
- **Warning System**: Non-critical issues reported as warnings instead of failures
- **Enhanced Frontend Handling**: Success messages with contextual warnings
- **Improved Logging**: Emoji-tagged console output for better debugging

**API Response Format**:
```typescript
interface QuestionUpdateResponse {
  success: boolean;
  questionUpdateSuccess: boolean;
  answerUpdateSuccess: boolean;
  warnings?: string[];
}
```

**Frontend Integration**:
```typescript
// Enhanced error handling in admin interface
const result = await response.json();

if (result.success && result.questionUpdateSuccess) {
  let message = 'Question updated successfully';
  if (result.warnings && result.warnings.length > 0) {
    message += ` (Note: ${result.warnings.join(', ')})`;
  }
  if (!result.answerUpdateSuccess) {
    message += ' - Question saved but some answers may need manual review';
  }
  setSuccess(message);
}
```

### Dynamic Footer System

**Location**: `/app/components/Footer.tsx`

A centralized footer component with intelligent navigation based on user authentication:

```typescript
export function Footer() {
  const { user, profile } = useAuth();

  // Dynamic routing logic
  const prepExamHref = !user 
    ? "/auth/login"           // Not logged in → Login page
    : profile?.is_admin 
      ? "/admin/dashboard"     // Admin user → Admin Dashboard  
      : "/dashboard";          // Regular user → User Dashboard

  return (
    <footer className="bg-[#0B1F3A] text-white py-12">
      {/* Footer content with dynamic Prep Exam link */}
      <Link href={prepExamHref}>Prep Exam</Link>
    </footer>
  );
}
```

**Features**:
- **Authentication-Aware**: Different routes based on login status
- **Role-Based Routing**: Admin users get different destination than regular users
- **Centralized Component**: Single footer used across all pages for consistency
- **Seamless Integration**: Uses existing auth context for user state management

**Pages Using Footer Component**:
- Homepage (`/app/page.tsx`)
- Contact (`/app/contact/page.tsx`)
- Support (`/app/support/page.tsx`)
- FAQs (`/app/faqs/page.tsx`)
- Study Guide (`/app/study-guide/page.tsx`)
- Terms & Privacy (`/app/terms-privacy/page.tsx`)

### Landing Page Optimization

**Location**: `/app/page.tsx`

**Section Reordering**: "Available Practice Tests" now appears before "Why Choose Practice SAP?" for improved conversion flow:

- **Better Conversion Funnel**: Users see available products immediately after hero section
- **Visual Appeal**: Maintained alternating background colors (gray → white → dark)
- **User Engagement**: Tests prominently featured to encourage immediate action

## 🛠️ API Patterns

### REST API Structure

**Admin APIs** (`/app/api/admin/`):
- `GET /api/admin/tests` - List all tests
- `POST /api/admin/tests` - Create new test
- `PATCH /api/admin/tests/[id]` - Update test
- `DELETE /api/admin/tests/[id]` - Delete test
- `GET /api/admin/tests/[id]/questions` - Get questions for test
- `POST /api/admin/tests/[id]/questions` - Add question to test
- `DELETE /api/admin/tests/[id]/questions` - Remove question from test
- `GET /api/admin/tests/[id]/categories` - Get test categories
- `GET /api/admin/questions` - List all questions
- `POST /api/admin/questions` - Create new question
- `PATCH /api/admin/questions/[id]` - Update question
- `DELETE /api/admin/questions/[id]` - Delete question
- `GET /api/admin/questions/[id]/preview` - Preview question
- `GET /api/admin/categories` - List all categories
- `POST /api/admin/categories` - Create new category
- `POST /api/admin/upload-image` - Upload question images
- `DELETE /api/admin/upload-image` - Delete uploaded images
- `POST /api/admin/promote` - Promote user to admin

**User APIs** (`/app/api/user/`):
- `GET /api/user/purchased-tests` - Get user's purchased tests
- `POST /api/user/purchased-tests` - Purchase/add test to library
- `GET /api/user/purchased-tests/[id]` - Get specific purchase details

**Dashboard APIs** (`/app/api/dashboard/`):
- `GET /api/dashboard/test-history` - User test history with metrics
- `GET /api/dashboard/performance-stats` - Category performance analysis
- `GET /api/dashboard/analytics` - Advanced analytics with suggestions

**Test APIs** (`/app/api/test/`):
- `GET /api/test/[id]` - Get test data
- `GET /api/test/[id]/preview` - Preview test (auth required)
- `GET /api/test/[id]/history` - Test attempt history
- `GET /api/test/session` - Get/create test session
- `POST /api/test/session/answers` - Submit answers
- `GET /api/tests/public` - Get public test list

**Auth APIs** (`/app/api/auth/`):
- `GET /api/auth/profile` - Get user profile
- `GET /api/auth/session` - Get session status

**Debug APIs** (`/app/api/debug/` and `/app/api/debug-prep/`):
- `GET /api/debug/auth-status` - Authentication debugging
- `GET /api/debug-prep` - Test data preparation
- `GET /api/debug-prep/test-fetch` - Debug test fetching
- `GET /api/debug-prep/simple` - Simplified debug endpoint
- `GET /api/diagnose/query-timing` - Query performance analysis
- `GET /api/diagnose/test-fetch` - Test fetch diagnostics
- `GET /api/diagnose/test-debug` - Advanced test debugging

**Standard Response Format**:
```typescript
// Success
{ data: T }

// Error
{ error: string, details?: string }

// File Upload Response
{ url: string, path: string }

// Purchase Response
{ purchase: UserPurchase, message: string }
```

### Database Interaction

Direct Supabase REST API calls:

```typescript
const response = await fetch(`${SUPABASE_URL}/rest/v1/questions`, {
  method: 'POST',
  headers: {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(questionData)
});
```

## 📊 Performance Optimizations

### 1. Caching System

**Location**: `/app/lib/cache-utils.ts`

In-memory LRU cache with TTL:
```typescript
const cache = new LRUCache({
  max: 100,
  ttl: 1000 * 60 * 5 // 5 minutes
});
```

**Cache Keys**:
- `test-${testId}` - Complete test data
- `test-questions-${testId}` - Test questions only
- `answers-${questionId}` - Question answers
- `batch-answers-${questionIds}` - Batch answer data

### 2. Ultra-Optimized Test Fetcher

**Location**: `/app/lib/ultra-optimized-test-fetcher.ts`

Advanced optimization system with:
- **Parallel Query Execution**: Multiple database queries run concurrently
- **Progressive Loading**: Questions load first, answers follow
- **Intelligent Caching**: Multi-level cache with TTL
- **Batch Processing**: Fetch multiple answers in single request

**Key Functions**:
```typescript
// Complete optimized test fetching
fetchTestDataUltra(testId: string): Promise<TestData>

// Progressive loading (questions first)
fetchTestWithQuestionsOnlyUltra(testId: string): Promise<TestData>

// Background answer prefetching
prefetchAllAnswers(questions: Question[]): Promise<void>

// On-demand answer loading
getAnswersAndUpdateTest(testData: TestData): Promise<TestData>
```

### 3. Database Indexes

**Migration**: `20240516_001_performance_indexes.sql`

Optimized queries for:
- Question lookups by category
- Test-question relationships
- User session queries
- Tag-based test filtering (`idx_tests_tag`)

### 4. Progressive Loading Components

**Location**: `/app/components/test/ProgressiveTestContainer.tsx`

Shows content as it loads for better perceived performance:
- Questions appear immediately
- Answers load progressively
- Loading indicators for each section
- Error boundaries for failed requests

### 5. Optimized Question Rendering

**Location**: `/app/components/test/OptimizedQuestionCard.tsx`

Memory-optimized question display:
- React.memo for preventing unnecessary re-renders
- useMemo for expensive calculations
- Lazy loading for media content
- Virtualization for large question sets

### 6. Performance Monitoring

**Debug Tools**:
- `/api/diagnose/query-timing` - Query performance analysis
- `/api/diagnose/test-fetch` - Test fetch diagnostics
- Performance timing in browser console
- Cache hit/miss tracking

## 🔐 Security Considerations

### 1. Row Level Security (RLS)

Supabase RLS policies ensure data isolation:
- Users can only access their own test sessions
- Admin users have elevated permissions
- Questions are publicly readable but admin-only writable

### 2. Input Validation

All form inputs are validated:
```typescript
// Client-side validation
if (!formData.text.trim()) {
  setError('Question text is required');
  return;
}

// Server-side validation in API routes
const { error } = questionSchema.validate(requestBody);
```

### 3. Authentication Guards

Protected routes check authentication:
```typescript
const { user, profile } = useAuth();

if (!user) {
  router.push('/auth/login');
  return;
}

if (!profile?.is_admin) {
  return <AccessDenied />;
}
```

## 🧪 Testing Strategy

### Question Validation Logic

**Location**: `/app/components/test/TestSummary.tsx`

```typescript
function isAnswerCorrect(question: Question, userAnswer?: UserAnswer): boolean {
  if (!userAnswer?.answers?.length) return false;
  
  switch (question.type) {
    case 'single_choice':
      return userAnswer.answers[0] === getCorrectAnswerId(question);
    case 'multiple_choice':
      return arraysEqual(userAnswer.answers.sort(), getCorrectAnswerIds(question).sort());
    case 'dropdown':
      return validateDropdownAnswers(question, userAnswer);
    default:
      return false;
  }
}
```

### Error Boundaries

React error boundaries catch and display errors gracefully.

## 🚀 Deployment

### Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Storage Configuration (for image uploads)
NEXT_PUBLIC_SUPABASE_STORAGE_URL=your_storage_url

# Development/Debug Settings
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

### Supabase Configuration

**Required Storage Bucket**: `question-media`

```sql
-- Create storage bucket for question images
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-media', 'question-media', true);

-- Set up storage policies
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'question-media');

CREATE POLICY "Admin upload access" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'question-media' AND 
  auth.jwt() ->> 'role' = 'admin'
);
```

### Build Process

```bash
npm run build
npm run start
```

### Database Migrations

Apply migrations using Supabase CLI or MCP tools:
```bash
# Using MCP (recommended in this environment)
# Migrations are applied via API calls to Supabase

# Using CLI (if available)
supabase db push
```

## 🐛 Common Issues & Solutions

### 1. Question Loading Issues

**Problem**: Questions not appearing in test
**Solution**: Check table names (`questions` vs `question`)

### 2. Authentication Loops

**Problem**: Infinite loading on auth pages
**Solution**: Clear browser storage and check token expiry

### 3. Modal Z-Index Issues

**Problem**: Modals appearing behind other elements
**Solution**: Use consistent z-index values (modals: z-50, overlays: z-40)

### 4. Form State Issues

**Problem**: Form data not persisting
**Solution**: Ensure proper key props and avoid recreating objects in render

### 5. Image Upload Issues

**Problem**: Images not uploading or displaying
**Solution**: 
- Check Supabase storage bucket `question-media` exists
- Verify storage policies allow admin uploads
- Ensure file size under 5MB limit
- Check supported formats (JPG, PNG, GIF, WebP, SVG)

### 6. Performance Issues

**Problem**: Slow test loading
**Solution**: 
- Use `/optimized-test/[id]` route for performance testing
- Check cache configuration in `cache-utils.ts`
- Monitor database query performance in debug tools
- Enable progressive loading components

### 7. Purchase System Issues

**Problem**: Purchase modal not showing
**Solution**: 
- Verify user authentication status
- Check if test is already in user's library
- Ensure `user_test_purchases` table exists
- Check MVP flag configuration

### 8. Tag System Issues

**Problem**: Tags not displaying correctly
**Solution**: 
- Run migration `20250707_001_add_tag_to_tests.sql`
- Check `tests.tag` field exists in database
- Verify tag index `idx_tests_tag` is created

## 📈 Monitoring & Analytics

### 1. Error Tracking

Console logging for development:
```typescript
console.error('API Error:', error);
console.log('User action:', { userId, action, timestamp });
```

### 2. Performance Monitoring

Built-in Next.js analytics and custom timing:
```typescript
const startTime = performance.now();
// ... operation
const duration = performance.now() - startTime;
console.log(`Operation took ${duration}ms`);
```

**Performance Metrics Tracked**:
- Database query execution time
- Cache hit/miss ratios
- Component render times
- API response times
- Image loading performance

## 💰 Purchase/Subscription System

### 1. Purchase Management

**Location**: `/app/lib/supabase-purchases.ts`

Complete purchase infrastructure with MVP model:

```typescript
// Core purchase functions
createPurchase(userId: string, testId: string): Promise<UserPurchase>
hasUserPurchasedTest(userId: string, testId: string): Promise<boolean>
getUserPurchases(userId: string): Promise<UserPurchase[]>
refundTestPurchase(purchaseId: string): Promise<void>
```

### 2. Purchase Modal System

**Location**: `/app/components/ui/purchase-modal.tsx`

Modal-based purchase confirmation:
- MVP messaging (free for now)
- Purchase history tracking
- Seamless integration with test preview
- Automatic library addition

### 3. Database Schema

**Table**: `user_test_purchases`

```sql
CREATE TABLE user_test_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  test_id UUID REFERENCES tests(id),
  purchase_date TIMESTAMP DEFAULT now(),
  payment_amount DECIMAL(10,2) DEFAULT 0.00,
  payment_method TEXT DEFAULT 'free_mvp',
  transaction_id TEXT,
  status TEXT DEFAULT 'completed'
);
```

### 4. API Endpoints

- `GET /api/user/purchased-tests` - User's test library
- `POST /api/user/purchased-tests` - Add test to library
- `GET /api/user/purchased-tests/[id]` - Purchase details

## 🏷️ Tag System

### 1. Test Organization

**Migration**: `20250707_001_add_tag_to_tests.sql`

Added `tag` field to tests table for better organization:
- User-friendly test classification
- Alternative to category-based organization
- Examples: "Beginner", "Advanced", "Mock Exam", "Certification Prep"

### 2. Database Changes

```sql
ALTER TABLE tests ADD COLUMN tag TEXT;
CREATE INDEX idx_tests_tag ON tests(tag);
```

### 3. Usage in UI

- Test cards display tags instead of categories
- Admin interface supports tag assignment
- Optional field - tests can exist without tags
- Visual indicators as colored pills

## 📸 Image Upload System

### 1. Supabase Storage Integration

**Location**: `/app/api/admin/upload-image/route.ts`

Complete image management system:
- **Bucket**: `question-media`
- **Supported Formats**: JPG, PNG, GIF, WebP, SVG
- **Size Limit**: 5MB per image
- **Validation**: File type and size checking

### 2. Upload Process

```typescript
// Upload image
POST /api/admin/upload-image
{
  file: FormData,
  questionId?: string // Optional question association
}

// Delete image
DELETE /api/admin/upload-image?path=image-path
```

### 3. Integration

- **Question Forms**: Direct image upload in question creation
- **Media URLs**: Stored in `questions.mediaUrl` field
- **Preview**: Immediate image preview in admin interface
- **Cleanup**: Automatic cleanup of orphaned images

## 🔧 Development Tools

### 1. Debug Pages

- `/debug/page.tsx` - Main debug interface
- `/debug/enhanced-page.tsx` - Enhanced debugging tools
- `/debug/table-check.tsx` - Database table verification
- `/debug/test-fix/page.tsx` - Test-specific debugging
- `/debug/test-debugger/page.tsx` - Advanced test debugging
- `/debug/test-debugger/simplified-page.tsx` - Simplified test debugging

### 2. Diagnostic APIs

- `/api/diagnose/query-timing` - Query performance analysis
- `/api/diagnose/test-fetch` - Test data loading diagnostics
- `/api/diagnose/test-debug` - Advanced test debugging
- `/api/debug-prep` - Test data preparation
- `/api/debug-prep/test-fetch` - Debug test fetching processes
- `/api/debug-prep/simple` - Simplified debug endpoint

### 3. Utility Functions

**Location**: `/app/lib/test-debugger-utils.ts`

Debugging helper functions:
- Query timing analysis
- Data validation checks
- Error logging utilities
- Performance profiling

### 4. Type Safety

Full TypeScript coverage with strict mode enabled.

### 5. Code Organization

- Feature-based folder structure
- Consistent naming conventions
- Shared types and interfaces

## 🤝 Contributing Guidelines

### 1. Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add proper error handling
- Include loading states for async operations

### 2. Database Changes

- Always create migrations for schema changes
- Test migrations on development environment first
- Document any breaking changes

### 3. UI/UX Guidelines

- Use existing UI components when possible
- Follow modal patterns for complex forms
- Ensure responsive design
- Add proper loading and error states

### 4. Testing

- Test all question types
- Verify admin permissions
- Check mobile responsiveness
- Test error scenarios
- **Dynamic Footer Testing**:
  - Test "Prep Exam" link behavior for non-authenticated users (should redirect to login)
  - Verify admin users are directed to admin dashboard
  - Check regular users go to user dashboard
  - Test footer displays consistently across all pages
- **Question Update System Testing**:
  - Test question updates show proper success messages instead of false errors
  - Verify partial success scenarios display warnings correctly
  - Check that questions are actually updated even when warnings are present
  - Test JSON parsing protection with various response scenarios
  - Verify emoji-tagged logging appears correctly in browser console
  - Test error handling for both question and answer update failures

## 📚 Resources

### Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)

### Key Files to Understand

1. `/app/lib/types.ts` - All TypeScript definitions
2. `/app/components/admin/QuestionFormEnhanced.tsx` - Question management
3. `/app/admin/tests/[id]/manage/page.tsx` - Test management
4. `/app/components/test/TestContainer.tsx` - Test taking logic
5. `/app/lib/auth-context.tsx` - Authentication system
6. `/app/lib/ultra-optimized-test-fetcher.ts` - Performance optimization
7. `/app/lib/supabase-purchases.ts` - Purchase system
8. `/app/lib/cache-utils.ts` - Caching system
9. `/app/components/ui/purchase-modal.tsx` - Purchase interface
10. `/app/api/admin/upload-image/route.ts` - Image upload system
11. `/app/components/Footer.tsx` - Dynamic footer with authentication-aware routing
12. `/app/api/admin/questions/[id]/route.ts` - Enhanced question update system

### Additional Utility Files

- `/app/lib/formatTimeLimit.ts` - Time formatting utilities
- `/app/lib/fetch-utils.ts` - Network request helpers
- `/app/lib/test-debugger-utils.ts` - Debug utilities
- `/app/lib/supabase-*.ts` - Various Supabase integration files
- `/app/lib/test-utils.ts` - Test-specific utilities

---

**Last Updated**: August 2025
**Project Version**: v2.2
**Documentation Status**: Complete with all features documented

**Recent Additions**:
- Enhanced Question Update System with Improved Error Handling
- Dynamic Footer Component with Authentication-Aware Routing
- Landing Page Section Reordering for Better Conversion
- JSON Parsing Protection for API Responses
- Emoji-Tagged Logging for Better Debugging
- Centralized Footer Component Architecture
- Purchase/Subscription System
- Tag System for Test Organization
- Image Upload System
- Performance Optimization Framework
- Advanced Debug Tools
- Progressive Loading Components
- Enhanced API Documentation

For questions or issues, refer to the project's README.md or contact the development team.