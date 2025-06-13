# Test Engine - Exam Preparation Platform

This is a comprehensive exam preparation platform built with [Next.js](https://nextjs.org) and [Supabase](https://supabase.com), focusing on Business Tech and SAP exams.

## About the Project

Practice SAP allows users to:
- Create accounts and manage profiles
- Take practice tests with various question types
- Review test performance and analytics
- Better prepare for certification exams

## Recent Updates (June 2025)

### 250613-02 Test History & Analytics Improvements

1. **Test Completion Modal Enhancement**
   - **Replaced Browser Alerts**: Custom modal popup for skipped questions confirmation
   - **Professional UI**: Uses existing ConfirmationModal component with warning variant
   - **Better UX**: Shows exact count of skipped questions with clear messaging
   - **Smooth Navigation**: Fixed "Back to Dashboard" button navigation after test completion

2. **Test History Implementation**
   - **New Test History Page**: Created `/test-history/[id]` page showing detailed test attempts
   - **Overall Statistics**: Displays total attempts, best score, average score, and average time
   - **Attempt History Cards**: Shows each attempt with:
     - Score with color coding (green ≥80%, yellow ≥60%, red <60%)
     - Questions answered vs total (e.g., "3/7")
     - Skipped questions count in gray text
     - Time spent per attempt
     - Visual trending indicators comparing to average
   - **API Endpoints**: Created `/api/test/[id]/history` for fetching test statistics

3. **Database & Scoring Improvements**
   - **Skipped Questions Tracking**: Changed `is_correct` to text field with values: 'true', 'false', 'skipped'
   - **Score Calculation**: Skipped questions count as wrong for final score
   - **Database Functions Updated**: All PostgreSQL functions updated to handle text comparisons
   - **Removed Problematic Triggers**: Dropped auto-evaluation triggers that were overriding values
   - **Fixed Question Count**: Corrected test_questions junction table queries for accurate counts

4. **Dashboard Performance Card Sync**
   - **Real-time Statistics**: "Your Performance" section now shows actual test data:
     - Total attempts from test history
     - Best score achieved
     - Average score across all attempts
     - Average time spent formatted as MM:SS
   - **Automatic Updates**: Statistics refresh when tests are completed
   - **Loading States**: Shows placeholder values while data loads

5. **User Experience Enhancements**
   - **Session Management**: Automatically clears test progress on completion/retry
   - **Loading Indicators**: "Finish" button shows spinner with "Finishing..." text
   - **Navigation Cleanup**: Removed "Take New Test" and "Edit Profile" buttons from dashboard
   - **Performance Fix**: Purchased tests now load only once on dashboard refresh
   - **Preview Navigation**: Preview Test button correctly navigates to `/preview-test/[id]`

6. **Technical Improvements**
   - **Boolean to Text Migration**: Handled `is_correct` column type change
   - **API Error Handling**: Better error messages for authentication issues
   - **Console Debugging**: Added helpful logs for troubleshooting timer issues
   - **React Optimization**: Fixed dependency arrays and memoization

## Recent Updates (June 2025)

### 250613-01 Create New Test Performance & Category Management

1. **Create New Test Page Performance Optimization**
   - **Eliminated Blocking Loading**: Removed categories API fetch that blocked page rendering
   - **Progressive Loading**: Form displays immediately with categories loading in background
   - **Instant Navigation**: Page loads immediately when clicking "Create New Test" button
   - **Background Processing**: Categories load asynchronously without blocking user interaction
   - **Loading States**: Added skeleton loading for categories section while maintaining form usability

2. **Dynamic Category Creation System**
   - **Inline Category Creation**: Replaced category selection with dynamic category creation interface
   - **One-to-One Relationship**: Each category is now unique to one test for better organization
   - **Add/Remove Categories**: Users can add multiple categories with "Add Category" buttons
   - **Category Details**: Each category includes name (required) and description/remark fields
   - **Visual Feedback**: Cards show category numbers (Category 1, Category 2, etc.) with delete buttons
   - **Empty State**: Professional empty state with call-to-action when no categories exist
   - **Form Validation**: Ensures all categories have names before allowing test creation

3. **Backward Navigation Controls**
   - **Navigation Settings**: Added always-visible setting for backward navigation control
   - **Browser Back Support**: Optional backward navigation with browser back button
   - **Unsaved Changes Protection**: Prevents accidental navigation with confirmation dialogs
   - **Smart Back Button**: Shows/hides based on navigation setting preference
   - **Form Change Tracking**: Automatically detects form modifications for protection warnings

4. **Enhanced API Architecture**
   - **Robust Category Creation**: API handles category creation with fallback for schema differences
   - **Database Migration**: Added test_id column to categories table for proper relationships
   - **Error Handling**: Comprehensive error handling with detailed logging for debugging
   - **Supabase Operations**: All database operations properly isolated in API folder
   - **Schema Compatibility**: Supports both current and future database schema versions
   - **Cache Optimization**: Enhanced categories API with 5-minute caching for better performance

5. **User Experience Improvements**
   - **Streamlined Workflow**: Create Test → Add Categories → (Later) Add Questions in Manage Test
   - **Always-Visible Settings**: Navigation controls moved from collapsible panel to main form
   - **Clear Visual Hierarchy**: Better form organization with proper sections and spacing
   - **Responsive Design**: All new components work seamlessly across device sizes
   - **Professional Loading**: Added dedicated loading.tsx for immediate visual feedback

### 250610-01 UI Enhancements & Performance Improvements

1. **Loading Button System**
   - **Enhanced Button Component**: Added loading prop with spinning loader animation using Lucide React icons
   - **Admin Interface**: All form submission buttons now show loading states with custom loading text
   - **Authentication**: Login and signup forms display "Signing in..." and "Creating account..." feedback
   - **Consistent UX**: Prevents double-clicks and provides immediate visual feedback across the platform
   - **Performance**: Buttons automatically disable during loading to prevent duplicate submissions

2. **Multiple Choice Selection Restrictions**
   - **Smart Limiting**: Users can only select up to the number of correct answers defined in the question
   - **Visual Feedback**: Unselected options become disabled and grayed out when limit is reached
   - **Intuitive UX**: Users must uncheck an answer to select a different one when at capacity
   - **Clear Instructions**: Shows "Select X correct answer(s)" without progress counters for clean interface
   - **Maintains Functionality**: Single choice and true/false questions remain unaffected

3. **Dropdown Question Display Improvements**
   - **Side-by-Side Layout**: Statement appears on left, dropdown select on right for better readability
   - **Responsive Design**: Flexbox layout adapts to different screen sizes while maintaining usability
   - **Proper Hierarchy**: Main question text displays in header, followed by statement-dropdown pairs
   - **Consistent Styling**: Matches overall question card design with proper spacing and borders

4. **React Performance Optimization**
   - **Fixed Infinite Render Loops**: Resolved "Maximum update depth exceeded" errors in TestContainer
   - **Memoized Event Handlers**: Wrapped all event handlers in useCallback for stable dependencies
   - **Optimized State Management**: Moved setState calls out of render cycle to prevent re-render cascades
   - **Timer Optimization**: Changed startTime from Date object to timestamp number for consistent comparisons
   - **Component Stability**: Improved performance and eliminated React warnings

5. **Technical Improvements**
   - **Proper useEffect Dependencies**: Fixed dependency arrays to prevent stale closures
   - **Event Handler Memoization**: handleAnswer, handleNext, handlePrevious, handleComplete all optimized
   - **State Update Patterns**: Separated render-time logic from side effects using useEffect properly
   - **Memory Leak Prevention**: Proper cleanup of intervals and event listeners

### 250609-02 Question Management & UI Enhancements

1. **New Question Type: Dropdown Questions**
   - Added support for dropdown-style questions with statement-option pairs
   - Each dropdown question can have multiple statements, each with its own dropdown selection
   - Database schema includes new `dropdown_answers` table with JSONB options storage
   - Form interface allows adding/removing dropdown statements with inline option management
   - Validation ensures each statement has a correct answer and multiple options

2. **Enhanced Question Management Interface**
   - **Complete Question Editing**: Edit button now loads full question data including answers and dropdown items
   - **Custom Confirmation Modals**: Replaced browser alerts with professional modal dialogs
   - **Glass Effect Modals**: Backdrop-blur transparency instead of dark overlays
   - **Context-Aware Messages**: Modals show question/category previews and counts
   - **Improved Question Form**: Better initialization of dropdown options with multi-line textarea support

3. **Streamlined Question Types**
   - **Single Choice**: Multiple answer options, exactly one correct (radio button behavior)
   - **Multiple Choice**: Multiple answer options, one or more correct (checkbox behavior)  
   - **Dropdown**: Statement-dropdown pairs for complex matching scenarios
   - Removed legacy question types (matching, sequence, drag-drop) for focused user experience

4. **Admin Interface Improvements**
   - **Consolidated Admin Navigation**: Questions and Categories management moved into Tests tab
   - **Direct Question Management**: Add, edit, and remove questions directly from test management page
   - **Simplified Admin Dashboard**: Only Tests and "Back to Website" navigation items
   - **Improved Question Loading**: Fetches complete question data for accurate editing
   - **Enhanced Preview Management**: Toggle questions for preview mode with visual indicators

5. **Performance & Accessibility**
   - **Async Route Handlers**: Updated for Next.js 15 compatibility with awaited params
   - **Row Level Security**: Proper RLS policies for new dropdown_answers table
   - **Form Validation**: Comprehensive validation for all question types
   - **Database Optimization**: Added proper indexes and constraints for dropdown questions

6. **User Experience Enhancements**
   - **Intuitive Question Creation**: Type-specific form layouts with clear instructions
   - **Visual Question Types**: Clear labeling and help text for each question format
   - **Smooth Interactions**: Eliminate loading states and provide immediate feedback
   - **Mobile-Friendly**: Responsive modal and form layouts for all devices

### 250606-02 Test Detail Page & Homepage Updates

1. **Homepage Test Cards Redesign**
   - Removed action buttons from test cards on homepage
   - Made entire test card clickable to navigate to detail page
   - Cards now redirect to `/test-detail/[id]` instead of directly to test
   - Added hover effects with title color change and "View Details" link
   - Improved user experience with clearer navigation flow

2. **New Test Detail Page** (`/test-detail/[id]`)
   - Created comprehensive test information page
   - **Hero Section**: Test title, description, categories, and key metrics
   - **Features Grid**: Highlights test benefits (coverage, analytics, feedback)
   - **Benefits List**: Detailed list of what's included with the test
   - **Visual Stats Card**: Shows pass rate, average score, and completion time
   - **Instructions Section**: Displays test-specific instructions if available
   - **CTA Sections**: Prominent call-to-action buttons for starting test
   - **Preview Test Button**: Placeholder for future preview functionality
   - Responsive design with glassmorphism effects

3. **Navigation Flow**
   - Users click test card → View test details → Choose to start full test or preview
   - **Non-authenticated users**: See "Purchase Now" and "Preview Test" buttons
   - **Authenticated users**: See "Start Full Test" and "Try Preview Test" options

4. **Button Updates for Non-Authenticated Users**
   - Changed "Sign Up to Start" → "Purchase Now" (primary CTA)
   - Changed "Sign In" → "Preview Test" with PlayCircle icon
   - Updated both hero section and bottom CTA section buttons
   - Maintains consistent purchase-focused messaging for visitors

### 250606-01 Navigation Access Control

1. **Tests Link Access Control**
   - Updated navbar to show "TESTS" link only for authenticated users
   - Non-authenticated users no longer see the Tests navigation item
   - Ensures users must be logged in to access test functionality
   - Modified `AuthNav.tsx` component condition from `{!user && (` to `{user && (`

### 250604-01 Admin Interface & Dashboard Improvements

1. **Admin Dashboard Redesign**
   - Redirected admin users from regular dashboard to dedicated `/admin` interface
   - Implemented automatic redirection with loading state for admin users
   - Removed admin-specific views from user dashboard for cleaner separation
   - Updated MaterialDashboard to show only user-focused content

2. **Admin Navbar Enhancements**
   - Updated admin layout to display logo instead of "Test Engine Admin" text
   - Improved visual consistency across admin interface
   - Logo appears consistently in both AppBar and sidebar navigation
   - Enhanced branding throughout admin experience

3. **Admin Layout Simplification**
   - **Removed blue AppBar/navbar entirely** from admin interface for cleaner design
   - Streamlined navigation to sidebar-only approach
   - Added menu toggle functionality to collapsed sidebar
   - Integrated "Back to Website" link in sidebar navigation
   - Eliminated redundant navigation elements and visual clutter

4. **Code Cleanup & Optimization**
   - Removed unused MUI components and imports (Badge, Avatar, Tooltip, Menu)
   - Cleaned up AppBar-related styled components and state management
   - Fixed TypeScript diagnostics warnings for unused imports
   - Simplified admin page headers that were conflicting with main layout

### 250603-04 User Test Purchase Tracking System

1. **Database Schema Updates**
   - Created `user_test_purchases` table to track test purchases with fields:
     - User ID, Test ID, Purchase Date, Payment Amount
     - Payment Method, Transaction ID, Status (active/refunded/expired)
     - Unique constraint preventing duplicate purchases
   - Added pricing fields to `tests` table:
     - `price` (decimal), `currency` (text), `is_free` (boolean)
     - All existing tests marked as free for backward compatibility

2. **My Tests Page Enhancement** (`/test`)
   - Complete redesign showing user's purchased and free tests
   - Summary cards displaying:
     - Total purchased tests count
     - Available free tests count
     - Combined total available
   - Separate sections for purchased and free tests with:
     - Visual badges (OWNED/FREE) for quick identification
     - Purchase date for owned tests
     - Time limits and category information
     - Responsive grid layout with hover effects
   - Empty state with call-to-action when no tests available

3. **API Endpoints**
   - `/api/user/purchased-tests` - Fetches current user's purchased and free tests
   - `/api/user/purchased-tests/[id]` - Enhanced endpoint with:
     - Full test details including categories
     - Support for specific user ID or current authenticated user
     - Category mapping for enriched display
     - Excludes purchased tests from free tests list

4. **Utility Functions** (`/app/lib/supabase-purchases.ts`)
   - `createTestPurchase()` - Records new test purchases
   - `hasUserPurchasedTest()` - Checks purchase status
   - `getUserPurchases()` - Retrieves all user purchases
   - `refundTestPurchase()` - Handles refunds
   - `getUserPurchaseStats()` - Analytics for purchase history

### 250603-03 Navbar Dropdown Implementation

1. **User Menu Dropdown**
   - Replaced multiple navigation links with single dropdown using username
   - Shows user's full name or email address as the main clickable element
   - Admin users display "ADMIN" badge next to their name using mint green styling
   - Dropdown arrow rotates smoothly when opened/closed

2. **Dropdown Menu Items**
   - **Dashboard/Admin Dashboard**: Conditional link based on user's admin status
   - **My Tests**: Links to test listing page
   - **Sign Out**: Functional sign-out button with proper state management
   - Each item includes relevant Lucide React icons (BarChart3, BookOpen, LogOut)

3. **Interactive Features**
   - Click-outside functionality to close dropdown automatically
   - Smooth hover transitions with brand colors
   - Proper z-index layering to appear above other content
   - Maintains brand color consistency throughout (#3EB3E7, #0B1F3A, #5C677D)

### 250603-02 Test-Taking Experience Enhancements

1. **Question Display Improvements**
   - Increased question and answer frame width from `max-w-2xl` to `max-w-4xl` for better readability
   - Added support for images in questions via the `mediaUrl` property
   - Added indicator showing how many answers to select for multiple-choice questions
   - Removed text input functionality (all questions now use structured answer formats)

2. **Flag System**
   - Replaced "Skip for now" button with a flag system
   - Users can flag questions for review with an orange flag button
   - Flagged questions show a small flag icon in the navigation bar
   - Next button is enabled when a question is flagged (even without an answer)

3. **Navigation Improvements**
   - Question navigation now shows question numbers instead of checkmarks for answered questions
   - Answered questions maintain green background and border for clear visual distinction
   - Added flag legend to navigation bar

4. **Navbar Behavior**
   - Navbar is visible on test start page
   - Navbar automatically hides during active test-taking (in-progress phase)
   - Navbar reappears on test completion/summary page
   - Prevents timer overlap with navigation elements


### 250603-01 Homepage & Branding Updates

1. **Brand Implementation**
   - Applied "Practice SAP" brand guidelines throughout
   - Color palette:
     - Primary: Oxford Blue (#0B1F3A), Sky Blue (#3EB3E7)
     - Secondary: Slate Gray (#5C677D), Mint Green (#B1E5D3), Light Gray (#F6F7FA)
   - Typography: Inter for headings/UI, Lora for body text
   - Added logo integration in navbar with hover animation

2. **Homepage Redesign**
   - **Enhanced Hero Section** with full-screen dynamic experience:
     - Multi-layered gradient backgrounds with animated geometric shapes
     - Two-column layout with engaging visual elements on desktop
     - Staggered fade-in animations for text elements
     - Interactive floating stats and credibility badges
     - Glassmorphism effects with backdrop blur
     - Professional wave transition to next section
   - Six feature cards highlighting platform benefits
   - Dynamic test display fetching active tests from database
   - Professional footer with organized links
   - Responsive design for all screen sizes

3. **Navbar Enhancements**
   - Increased height to 80px with logo integration
   - Sky Blue accent border at bottom
   - Icon integration for navigation items
   - Smooth hover transitions with brand colors
   - Updated authentication buttons with brand styling

## Getting Started

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Copy `.env.local.example` to `.env.local` and fill in your Supabase URL and anon key:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

### Core Features
- Authentication with Supabase Auth
- Server-side auth with middleware
- Auth callback route for OAuth
- Profile management with admin roles
- Real-time test session tracking

### Test Features
- **Three Core Question Types**:
  - **Single Choice**: Multiple options, one correct answer (radio button selection)
  - **Multiple Choice**: Multiple options, multiple correct answers with smart selection limiting
  - **Dropdown Questions**: Statement-dropdown pairs displayed side-by-side for complex matching scenarios
- **Smart Selection Controls**: Multiple choice questions limit selections to the number of correct answers
- **Enhanced Question Display**: Improved layout with category information in question headers
- **Loading States**: All buttons show loading animations with descriptive text during actions
- Timed tests with automatic submission and backward navigation controls
- Question flagging for review with visual indicators
- Progress tracking and navigation with answered question display
- Immediate feedback on completion
- Image support in questions
- Preview mode for testing questions before publishing

### UI/UX Features
- Responsive design for all devices
- Dynamic navbar visibility during tests
- **Universal Loading System**: Spinning loader animations on all interactive buttons
- **Smart User Feedback**: Context-aware loading text ("Saving...", "Creating...", "Signing in...")
- **Prevention of Double Actions**: Automatic button disabling during operations
- Progressive loading states with smooth transitions
- **Enhanced Hero Section Animations**:
  - Staggered fade-in-up animations with custom timing
  - Floating geometric shapes with different animation patterns
  - Interactive button hover effects with gradient overlays
  - Glassmorphism design elements
- **Optimized Performance**: Memoized components and stable event handlers
- Accessibility-focused components

## Project Structure

### Core Files
- `app/supabase.ts` - Supabase client creation
- `middleware.ts` - Handles auth session refreshing
- `app/layout.tsx` - Root layout with Inter & Lora fonts
- `app/page.tsx` - Homepage with hero, features, and test display

### Components
- `app/components/` - UI components organized by feature area
  - `AuthNav.tsx` - Navigation bar with brand styling and user dropdown menu
  - `ConditionalNav.tsx` - Controls navbar visibility (removed)
  - `test/QuestionCard.tsx` - Enhanced question display with flag system
  - `test/TestContainer.tsx` - Test state management with navbar control
  - `test/QuestionNavigation.tsx` - Progress navigation with flag indicators
  - `admin/MuiDashboardLayout.tsx` - Simplified admin layout with sidebar-only navigation

### Libraries & Utilities
- `app/lib/` - Core business logic and Supabase interaction
  - `useNavbarVisibility.ts` - Hook for controlling navbar visibility
  - `ultra-optimized-test-fetcher.ts` - Optimized data fetching with caching
  - `auth-server.ts` - Server-side authentication utilities
  - `supabase-purchases.ts` - Purchase tracking and management functions

### Pages
- `app/admin/` - Admin interface pages for content management with simplified navigation
- `app/dashboard/` - User-only dashboard for performance tracking (admin users redirected to /admin)
- `app/test/` - My Tests page showing purchased and free tests
- `app/test/[id]/` - Test taking interface
- `app/auth/` - Authentication pages (login, signup, reset)

### Database
- `supabase/migrations/` - Database schema and migrations

### Assets & Styling
- `public/logo/` - Brand logo assets
- `public/TestBank_Brand_Guidelines.md` - Brand guidelines document
- `app/globals.css` - Global styles with custom animations for hero section

## Database Structure

The system uses Supabase with the following key tables:

- `profiles` - User profile information with admin role support
- `categories` - Subject areas linked to specific tests (one-to-one relationship)
- `tests` - Test definitions with metadata, pricing, availability, and instructions
- `questions` - Question bank with enhanced fields (difficulty, points, explanation, is_preview)
- `answers` - Answers for single-choice and multiple-choice questions (with position ordering)
- `dropdown_answers` - Statement-option pairs for dropdown questions (JSONB options storage)
- `test_sessions` - Records of user attempts
- `user_answers` - User responses to questions
- `user_test_purchases` - Tracks which tests users have purchased

### Enhanced Table Features
- **questions table**: Added `difficulty`, `points`, `explanation`, and `is_preview` columns
- **answers table**: Added `position` column for proper ordering
- **dropdown_answers table**: New table with JSONB options storage and position ordering
- **categories table**: Added `test_id` column for one-to-one relationship with tests
- **Row Level Security**: Comprehensive RLS policies for all admin operations
- **Database Indexes**: Optimized indexes for performance on position-based queries

> **Important Note:** The question and answer tables are named `questions` and `answers`. All code should reference these table names.

## Technical Implementation Details

### Universal Loading Indicator System
The comprehensive loading system provides granular feedback for all user actions:

```typescript
// Enhanced Button component with loading support
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ loading, loadingText, children, disabled, ...props }, ref) => {
    return (
      <button
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingText || children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
```

**Individual Action Loading States:**
```typescript
// Admin manage test page loading state structure
const [loadingStates, setLoadingStates] = useState({
  updateTest: false,
  createCategory: false,
  createQuestion: false,
  updateQuestion: false,
  togglePreview: {} as Record<string, boolean>, // Track by question ID
  removeQuestion: {} as Record<string, boolean>, // Track by question ID
  editQuestion: {} as Record<string, boolean>, // Track by question ID
  removeCategoryFromTest: {} as Record<string, boolean> // Track by category ID
});

// Example: Per-question loading state
const handleEditQuestion = async (questionId: string) => {
  setLoadingStates(prev => ({ 
    ...prev, 
    editQuestion: { ...prev.editQuestion, [questionId]: true }
  }));
  // ... API call
  setLoadingStates(prev => ({ 
    ...prev, 
    editQuestion: { ...prev.editQuestion, [questionId]: false }
  }));
};
```

**Key Features:**
- **Automatic Disabling**: Buttons become non-interactive during loading
- **Visual Feedback**: Spinning Lucide React icon with customizable text
- **Individual Tracking**: Each question/category button has independent loading state
- **Context-Aware Text**: Different loading messages for different actions
- **Prevents Double Actions**: Multiple rapid clicks are prevented
- **Non-blocking Interface**: Other buttons remain functional while one is loading

### Multiple Choice Selection Limiting
Smart selection control prevents users from over-selecting answers:

```typescript
// Selection logic with intelligent limiting
const toggleAnswer = (answerId: string) => {
  if (normalizeQuestionType(question.type) === 'multiple_choice') {
    setSelectedAnswers(prev => {
      const isAlreadySelected = prev.includes(answerId);
      const correctAnswersCount = question.answers?.filter(a => a.isCorrect).length || 0;
      
      if (isAlreadySelected) {
        // Always allow unselecting
        return prev.filter(id => id !== answerId);
      } else {
        // Only allow selecting if we haven't reached the limit
        if (prev.length < correctAnswersCount) {
          return [...prev, answerId];
        }
        return prev; // Don't change if limit reached
      }
    });
  }
};
```

**Features:**
- **Dynamic Limiting**: Based on actual number of correct answers in question
- **Visual Indicators**: Disabled answers show with reduced opacity and gray styling
- **Flexible Deselection**: Users can always uncheck to make different selections

### React Performance Optimization
Comprehensive optimization to eliminate render loops and improve performance:

```typescript
// Memoized event handlers to prevent unnecessary re-renders
const handleAnswer = useCallback((answerId: string[]) => {
  // Answer processing logic
}, [test.questions, currentQuestionIndex]);

const handleNextQuestion = useCallback(() => {
  // Navigation logic
}, [currentQuestionIndex, test.questions.length, handleComplete]);

// Optimized timer using timestamp instead of Date objects
const [startTime, setStartTime] = useState<number | null>(null);

useEffect(() => {
  if (phase === "in-progress" && startTime) {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setTimeSpent(elapsed);
    }, 1000);
    
    return () => clearInterval(interval);
  }
}, [phase, startTime]);
```

**Optimizations:**
- **useCallback Memoization**: All event handlers wrapped to prevent recreating functions
- **Stable Dependencies**: Fixed dependency arrays to prevent stale closures
- **Separated Side Effects**: Moved setState out of render cycle using useEffect
- **Timer Efficiency**: Timestamp-based timing instead of Date object comparisons

### Dropdown Question Implementation
The dropdown question system provides complex statement-answer matching functionality:

```typescript
// Dropdown item structure
interface DropdownItem {
  id?: string;
  questionId?: string;
  statement: string;
  correctAnswer: string;
  options: string[];
  position?: number;
}
```

**Database Schema:**
```sql
CREATE TABLE dropdown_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Key Features:**
- **JSONB Options Storage**: Flexible array storage for dropdown options
- **Position-Based Ordering**: Maintains statement order within questions
- **Cascading Deletes**: Automatic cleanup when questions are removed
- **RLS Security**: Admin-only access with proper authentication
- **Form Validation**: Ensures each statement has valid options and correct answers

### Question Form Management
The enhanced question form handles three distinct question types with type-specific validation:

```typescript
// Type-specific form initialization
if (newType === "dropdown") {
  updated.dropdownItems = [{
    id: generateMockId(),
    statement: "",
    correctAnswer: "",
    options: ["Option 1", "Option 2", "Option 3"],
    position: 0
  }];
}
```

**Form Features:**
- **Dynamic Type Switching**: Form adapts based on selected question type
- **Multi-line Option Input**: Textarea with newline support for dropdown options
- **Real-time Validation**: Immediate feedback on form completion
- **Data Cleanup**: Filters empty options before submission

### Custom Confirmation Modals
Professional modal system replacing browser alerts:

```typescript
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  variant?: 'danger' | 'warning' | 'info';
}
```

**Modal Features:**
- **Glass Morphism Effect**: Backdrop blur without dark overlay
- **Keyboard Navigation**: ESC key support and focus management
- **Responsive Design**: Mobile-friendly layout with proper button ordering
- **Context-Aware Content**: Dynamic messages with question/category previews

### Admin Interface Architecture
The admin interface uses a clean, sidebar-only navigation approach:
```typescript
// Admin user redirection in MaterialDashboard
useEffect(() => {
  if (profile?.is_admin) {
    router.push('/admin');
  }
}, [profile, router]);
```

**Enhanced Admin Navigation Features:**
- **Automatic Redirection**: Admin users are redirected from `/dashboard` to `/admin`
- **Simplified Layout**: Removed AppBar for cleaner, sidebar-focused design
- **State Management**: Drawer state controls sidebar collapse/expand with logo visibility
- **Streamlined Sidebar**: Only essential links (Tests, Sign Out, Back to Website)
- **Modal-based Editing**: Test editing uses modals to prevent UI conflicts

**Admin Navbar Simplification:**
```typescript
// Role-based navbar rendering in AuthNav.tsx
{profile?.is_admin ? (
  /* Admin users: Show simple "Admin" text without dropdown */
  <div className="flex items-center px-4 py-2">
    <span className="text-sm font-medium text-[#0B1F3A]">
      Admin
    </span>
  </div>
) : (
  /* Regular users: Show dropdown with full functionality */
  <div className="relative" ref={dropdownRef}>
    // ... existing dropdown code
  </div>
)}
```
- **Role-based UI**: Different navigation experience for admin vs regular users
- **Simplified Admin Experience**: No dropdown for admins, just "Admin" text
- **Maintained User Functionality**: Regular users keep full dropdown with Dashboard, My Tests, Sign Out

### Sidebar Navigation Implementation
The admin sidebar uses Material-UI's Drawer component with custom theming:
```typescript
// Conditional logo and menu toggle
{!open && (
  <IconButton onClick={toggleDrawer} sx={{ mb: 1 }}>
    <MenuIcon />
  </IconButton>
)}
{open && (
  <>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <img src="/Test-engine-logo.webp" alt="Test Engine Logo" />
      <Typography variant="h6">Test Engine</Typography>
    </Box>
    <IconButton onClick={toggleDrawer}>
      <ChevronLeftIcon />
    </IconButton>
  </>
)}
```
- **Responsive Design**: Logo and text appear when expanded, menu icon when collapsed
- **Clean Theming**: Removed blue AppBar for minimal, professional appearance
- **Integrated Actions**: "Back to Website" link included in sidebar navigation

### Flag System Implementation
The flag system is implemented using React state management:
```typescript
const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
```
- Flags persist throughout the test session
- Flag state is passed to both QuestionCard and QuestionNavigation components
- Visual indicators use orange color (#orange-500) for consistency

### Navbar Visibility Control
The navbar visibility is controlled by a custom hook:
```typescript
useNavbarVisibility(phase !== "in-progress");
```
- Uses DOM manipulation to hide/show navbar based on test phase
- Automatically restores navbar when component unmounts
- Prevents layout shift during transitions

### Dropdown Menu Implementation
The user dropdown menu uses React state and refs for proper interaction:
```typescript
const [isDropdownOpen, setIsDropdownOpen] = useState(false)
const dropdownRef = useRef<HTMLDivElement>(null)

// Click-outside handler
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsDropdownOpen(false)
    }
  }
  document.addEventListener('mousedown', handleClickOutside)
  return () => document.removeEventListener('mousedown', handleClickOutside)
}, [])
```
- Conditional rendering based on user's admin status
- Smooth rotation animation for chevron icon
- Proper event cleanup to prevent memory leaks

### Brand Colors Reference
```css
/* Primary Colors */
--oxford-blue: #0B1F3A;
--sky-blue: #3EB3E7;
--white: #FFFFFF;

/* Secondary Colors */
--slate-gray: #5C677D;
--mint-green: #B1E5D3;
--light-gray: #F6F7FA;
```

### Hero Section Animations
The hero section includes custom CSS animations defined in `globals.css`:
```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
```
- **Staggered animations** with delays (200ms, 400ms, 600ms, 800ms)
- **Floating shapes** with pulse, bounce, and spin animations
- **Interactive elements** with glassmorphism and backdrop blur effects

## Development Guidelines

### When Adding New Features
1. Follow the established color palette
2. Use Inter for UI elements and Lora for body text
3. Maintain consistent spacing and border radius (6px)
4. Ensure mobile responsiveness
5. Add smooth transitions for interactive elements
6. **Admin Interface**: Use sidebar-only navigation pattern
7. **User Separation**: Redirect admin users appropriately to maintain clean UX

### Testing Considerations
- Test all three question types (single choice, multiple choice, dropdown)
- Verify question editing loads complete data for all question types
- Test dropdown option creation with multi-line textarea input
- Check modal functionality (keyboard navigation, backdrop clicks, mobile layout)
- Ensure proper form validation for each question type
- **Create New Test Page Testing**:
  - Test immediate page load without waiting for API calls
  - Verify categories can be added/removed dynamically
  - Test form validation for category names
  - Check backward navigation setting functionality
  - Verify unsaved changes protection works correctly
  - Test category creation API with error handling
  - Ensure test creation works with and without categories
- **Loading Button Testing**:
  - Test all form submissions show loading states (admin, auth, test management)
  - Verify buttons disable during loading to prevent double submissions
  - Check custom loading text displays correctly for different actions
  - Ensure loading state clears properly on success/error
- **Multiple Choice Selection Testing**:
  - Test selection limiting based on number of correct answers
  - Verify visual feedback when selection limit is reached
  - Check that users can uncheck to select different answers
  - Ensure single choice and true/false questions remain unaffected
- **Dropdown Question Testing**:
  - Test statement creation/removal functionality
  - Verify option input with newlines and empty line handling
  - Check correct answer selection from populated dropdown
  - Test side-by-side layout on different screen sizes
  - Ensure proper data persistence and loading
- **React Performance Testing**:
  - Verify no infinite render loops or "Maximum update depth" errors
  - Test timer functionality during test sessions
  - Check that event handlers don't cause unnecessary re-renders
  - Ensure stable component behavior during navigation
- **Admin Interface Testing**:
  - Test complete question editing workflow (load → edit → save)
  - Verify admin redirection works correctly
  - Test sidebar collapse/expand functionality
  - Check confirmation modals for question/category removal
  - Test loading states on all admin form submissions
  - Ensure responsive behavior on different screen sizes
- **Database Testing**:
  - Verify RLS policies allow proper admin operations
  - Test cascading deletes for dropdown_answers
  - Check position ordering for all answer types
  - Ensure data integrity with JSONB options storage

## Next Steps

1. Complete the user dashboard with performance analytics
2. Implement subscription tier system with payment integration
3. Add question explanations and study materials
4. Implement test history and progress tracking
5. Add admin analytics dashboard
6. Create mobile app version

## Learn More

To learn more about Next.js and Supabase, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Next.js Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.