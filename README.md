# Test Engine - Exam Preparation Platform

This is a comprehensive exam preparation platform built with [Next.js](https://nextjs.org) and [Supabase](https://supabase.com), focusing on Business Tech and SAP exams.

## About the Project

Practice SAP allows users to:
- Create accounts and manage profiles
- Take practice tests with various question types
- Review test performance and analytics
- Better prepare for certification exams

## Recent Updates (January 2025)

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
- Multiple question types (single choice, multiple choice, true/false, matching, sequence, drag-drop)
- Timed tests with automatic submission
- Question flagging for review
- Progress tracking and navigation
- Immediate feedback on completion
- Image support in questions

### UI/UX Features
- Responsive design for all devices
- Dynamic navbar visibility during tests
- Progressive loading states
- Smooth animations and transitions
- **Enhanced Hero Section Animations**:
  - Staggered fade-in-up animations with custom timing
  - Floating geometric shapes with different animation patterns
  - Interactive button hover effects with gradient overlays
  - Glassmorphism design elements
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

- `profiles` - User profile information
- `categories` - Subject areas for tests
- `tests` - Test definitions with metadata, pricing, and availability
- `questions` - Question bank with various question types
- `answers` - Answers for choice questions
- `match_items`, `sequence_items`, `drag_drop_items` - Specialized question type data
- `test_sessions` - Records of user attempts
- `user_answers` - User responses to questions
- `user_test_purchases` - Tracks which tests users have purchased

> **Important Note:** The question and answer tables are named `questions` and `answers`. All code should reference these table names.

## Technical Implementation Details

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
- **Automatic Redirection**: Admin users are redirected from `/dashboard` to `/admin`
- **Simplified Layout**: Removed AppBar for cleaner, sidebar-focused design
- **State Management**: Drawer state controls sidebar collapse/expand with logo visibility
- **Navigation**: All admin functions accessible through collapsible sidebar menu

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
- Test flag functionality across different question types
- Verify navbar behavior in all test phases
- Check image display in questions with various aspect ratios
- Ensure proper TypeScript types for all new props
- **Admin Interface Testing**:
  - Verify admin redirection works correctly
  - Test sidebar collapse/expand functionality
  - Ensure all admin navigation links work properly
  - Check responsive behavior on different screen sizes
- **Hero Section Testing**:
  - Verify animations work across different browsers
  - Test responsive behavior on mobile devices
  - Ensure accessibility with reduced motion preferences
  - Check performance with multiple animated elements

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