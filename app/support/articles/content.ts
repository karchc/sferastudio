export interface ArticleSection {
  heading: string;
  body: string[];
}

export interface Article {
  slug: string;
  title: string;
  category: string;
  description: string;
  sections: ArticleSection[];
  relatedLinks?: { title: string; href: string }[];
}

export const articles: Article[] = [
  // ─── Getting Started ───────────────────────────────────────────────
  {
    slug: "creating-your-account",
    title: "Creating Your Account",
    category: "Getting Started",
    description: "Step-by-step guide to signing up and setting up your Practice ERP account.",
    sections: [
      {
        heading: "Sign Up",
        body: [
          "Visit the Practice ERP homepage and click the Sign Up button in the top navigation.",
          "Enter your email address and choose a secure password (at least 8 characters).",
          "Click Create Account. You will receive a confirmation email — click the link inside to verify your address.",
        ],
      },
      {
        heading: "Complete Your Profile",
        body: [
          "After verifying your email, log in and navigate to your Profile page.",
          "Add your name and any optional details such as your job role or target certification.",
          "Save your changes to finalise your profile.",
        ],
      },
      {
        heading: "Choose a Plan",
        body: [
          "Free accounts give you access to a fixed set of practice questions.",
          "Upgrading to a paid plan unlocks randomised question sets, detailed performance analytics (time per question, weak topic identification), and access to premium tests.",
          "You can upgrade at any time from your Dashboard.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Navigating the Dashboard", href: "/support/articles/navigating-the-dashboard" },
      { title: "Taking Your First Practice Test", href: "/support/articles/taking-your-first-practice-test" },
    ],
  },
  {
    slug: "taking-your-first-practice-test",
    title: "Taking Your First Practice Test",
    category: "Getting Started",
    description: "Learn how to find, start, and complete a practice test on Practice ERP.",
    sections: [
      {
        heading: "Finding a Test",
        body: [
          "From your Dashboard, browse the available tests. Tests are organised by category and tagged by difficulty or certification type.",
          "Free tests are marked clearly. Premium tests show a price badge.",
          "Click on any test card to see a description, time limit, and number of questions before starting.",
        ],
      },
      {
        heading: "Starting the Test",
        body: [
          "Click the Start Test button. The timer will begin immediately.",
          "Each question is displayed one at a time. Use the navigation buttons to move between questions.",
          "You can flag questions to revisit them before submitting.",
        ],
      },
      {
        heading: "Submitting and Reviewing",
        body: [
          "When you have answered all questions (or the time runs out), click Submit Test.",
          "You will see your score, a breakdown by category, and the correct answers with explanations for each question.",
          "Your results are saved to your Dashboard for future review.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Understanding Your Results", href: "/support/articles/understanding-your-results" },
      { title: "Time Limits and Scoring", href: "/support/articles/time-limits-and-scoring" },
    ],
  },
  {
    slug: "understanding-your-results",
    title: "Understanding Your Results",
    category: "Getting Started",
    description: "How to read and interpret your test results and performance analytics.",
    sections: [
      {
        heading: "The Results Summary",
        body: [
          "After completing a test you will see an overview showing your total score, time taken, and how it compares to the time limit.",
          "A category-by-category breakdown shows which subject areas you performed strongly in and which need more attention.",
        ],
      },
      {
        heading: "Question-Level Breakdown",
        body: [
          "Scroll down to see every question from the test, your answer, the correct answer, and an explanation.",
          "Questions you got wrong are highlighted so you can focus your revision.",
        ],
      },
      {
        heading: "Analytics (Paid Plans)",
        body: [
          "Paid plan users also see the time spent on each individual question, helping identify questions you found difficult or rushed.",
          "Trend charts in the Dashboard show your score progression across multiple attempts.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Test Results Analysis", href: "/support/articles/test-results-analysis" },
      { title: "Navigating the Dashboard", href: "/support/articles/navigating-the-dashboard" },
    ],
  },
  {
    slug: "navigating-the-dashboard",
    title: "Navigating the Dashboard",
    category: "Getting Started",
    description: "A tour of your personal Dashboard and how to use each section.",
    sections: [
      {
        heading: "Overview Panel",
        body: [
          "The Dashboard opens to an overview showing your recent test attempts, average score, and suggested next steps.",
          "Use the top navigation to switch between Dashboard, Profile, and other sections.",
        ],
      },
      {
        heading: "Test History",
        body: [
          "The Test History section lists every test you have attempted, with your score, date, and time taken.",
          "Click any entry to revisit the full question-by-question breakdown.",
        ],
      },
      {
        heading: "Available Tests",
        body: [
          "Browse tests directly from the Dashboard. Filter by category or tag to find relevant practice material.",
          "Featured tests are highlighted at the top of the list.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Taking Your First Practice Test", href: "/support/articles/taking-your-first-practice-test" },
    ],
  },

  // ─── Account & Profile ─────────────────────────────────────────────
  {
    slug: "updating-your-profile",
    title: "Updating Your Profile",
    category: "Account & Profile",
    description: "How to update your name, profile information, and preferences.",
    sections: [
      {
        heading: "Opening Your Profile",
        body: [
          "Click your name or avatar in the top navigation bar, then select Profile from the dropdown menu.",
        ],
      },
      {
        heading: "Editing Your Details",
        body: [
          "You can update your display name and any other optional profile fields on the Profile page.",
          "Click Save Changes when you are done. Changes take effect immediately.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Changing Your Password", href: "/support/articles/changing-your-password" },
    ],
  },
  {
    slug: "changing-your-password",
    title: "Changing Your Password",
    category: "Account & Profile",
    description: "How to reset or change your account password.",
    sections: [
      {
        heading: "Changing While Logged In",
        body: [
          "Go to your Profile page and look for the Password section.",
          "Enter your current password, then your new password twice to confirm.",
          "Click Update Password. You will remain logged in.",
        ],
      },
      {
        heading: "Forgot Your Password?",
        body: [
          "On the login page, click Forgot Password.",
          "Enter the email address associated with your account and click Send Reset Link.",
          "Check your inbox for the reset email and follow the link to create a new password.",
          "The reset link is valid for 1 hour.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Updating Your Profile", href: "/support/articles/updating-your-profile" },
    ],
  },
  {
    slug: "email-preferences",
    title: "Email Preferences",
    category: "Account & Profile",
    description: "Managing the emails you receive from Practice ERP.",
    sections: [
      {
        heading: "Types of Emails We Send",
        body: [
          "Account emails: password resets, email verification, and security notices. These cannot be disabled.",
          "Notification emails: study reminders and new test announcements. These are optional.",
        ],
      },
      {
        heading: "Updating Your Preferences",
        body: [
          "Go to your Profile page to manage your notification settings.",
          "Toggle optional email types on or off and save your changes.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Updating Your Profile", href: "/support/articles/updating-your-profile" },
    ],
  },
  {
    slug: "account-deactivation",
    title: "Account Deactivation",
    category: "Account & Profile",
    description: "What happens when you deactivate your account and how to do it.",
    sections: [
      {
        heading: "Before You Deactivate",
        body: [
          "Deactivating your account will remove access to all your test history and saved progress.",
          "If you have an active subscription, cancel it first to avoid further charges.",
        ],
      },
      {
        heading: "How to Request Deactivation",
        body: [
          "Account deactivation is handled by our support team. Please contact us via the Contact page and include your registered email address.",
          "We will process your request within 5 business days.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Contact Support", href: "/contact" },
    ],
  },

  // ─── Billing & Payments ────────────────────────────────────────────
  {
    slug: "subscription-plans",
    title: "Subscription Plans",
    category: "Billing & Payments",
    description: "An overview of the Free and Paid plans available on Practice ERP.",
    sections: [
      {
        heading: "Free Plan",
        body: [
          "Access a fixed set of practice questions for each available test.",
          "View your score and correct answers after each attempt.",
          "No payment required — sign up and start immediately.",
        ],
      },
      {
        heading: "Paid Plan",
        body: [
          "All Free plan features, plus:",
          "Randomised question sets so each attempt feels fresh and tests genuine knowledge.",
          "Detailed analytics: time spent per question, weak category identification, and score trends over time.",
          "Access to premium tests not available on the Free plan.",
        ],
      },
      {
        heading: "Upgrading",
        body: [
          "You can upgrade at any time from your Dashboard. Your existing test history is preserved.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Payment Methods", href: "/support/articles/payment-methods" },
      { title: "Refund Policy", href: "/support/articles/refund-policy" },
    ],
  },
  {
    slug: "payment-methods",
    title: "Payment Methods",
    category: "Billing & Payments",
    description: "Accepted payment methods and how to manage your payment details.",
    sections: [
      {
        heading: "Accepted Payment Methods",
        body: [
          "Practice ERP accepts all major credit and debit cards (Visa, Mastercard, American Express).",
          "Payments are processed securely. Your card details are never stored on our servers.",
        ],
      },
      {
        heading: "Updating Payment Details",
        body: [
          "To update your card, contact our support team via the Contact page and we will send you a secure link to update your billing details.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Billing History", href: "/support/articles/billing-history" },
      { title: "Contact Support", href: "/contact" },
    ],
  },
  {
    slug: "refund-policy",
    title: "Refund Policy",
    category: "Billing & Payments",
    description: "Our policy on refunds for subscriptions and individual test purchases.",
    sections: [
      {
        heading: "Eligibility",
        body: [
          "Refund requests made within 7 days of purchase and before completing more than one test are eligible for a full refund.",
          "Requests made after 7 days or after significant usage will be reviewed on a case-by-case basis.",
        ],
      },
      {
        heading: "How to Request a Refund",
        body: [
          "Contact us via the Contact page with your registered email address and the reason for your refund request.",
          "Approved refunds are processed within 5–10 business days and returned to the original payment method.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Contact Support", href: "/contact" },
      { title: "Terms & Privacy", href: "/terms-privacy" },
    ],
  },
  {
    slug: "billing-history",
    title: "Billing History",
    category: "Billing & Payments",
    description: "How to view your past payments and download invoices.",
    sections: [
      {
        heading: "Viewing Your Billing History",
        body: [
          "Your billing history is accessible from the Dashboard under the account settings area.",
          "Each entry shows the date, amount, and description of the charge.",
        ],
      },
      {
        heading: "Need an Invoice?",
        body: [
          "Contact our support team via the Contact page and we will email you a PDF invoice for any past payment.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Contact Support", href: "/contact" },
    ],
  },

  // ─── Tests & Exams ─────────────────────────────────────────────────
  {
    slug: "test-types-available",
    title: "Test Types Available",
    category: "Tests & Exams",
    description: "An overview of the different question formats used in Practice ERP tests.",
    sections: [
      {
        heading: "Single Choice",
        body: ["Select the one correct answer from a list of options. The most common question type."],
      },
      {
        heading: "Multiple Choice",
        body: ["Select all correct answers from the list. Partial credit is not awarded — all correct options must be selected."],
      },
      {
        heading: "True / False",
        body: ["Decide whether a statement is true or false."],
      },
      {
        heading: "Matching",
        body: ["Match items in the left column to their corresponding items in the right column."],
      },
      {
        heading: "Sequence",
        body: ["Arrange a list of steps or items into the correct order."],
      },
      {
        heading: "Drag and Drop",
        body: ["Drag items into their correct categories or positions."],
      },
      {
        heading: "Dropdown (Fill in the Blank)",
        body: ["Complete sentences by selecting the correct word or phrase from a dropdown inside the sentence."],
      },
    ],
    relatedLinks: [
      { title: "Time Limits and Scoring", href: "/support/articles/time-limits-and-scoring" },
    ],
  },
  {
    slug: "time-limits-and-scoring",
    title: "Time Limits and Scoring",
    category: "Tests & Exams",
    description: "How time limits work and how your score is calculated.",
    sections: [
      {
        heading: "Time Limits",
        body: [
          "Each test has a time limit shown on the test card before you start.",
          "A countdown timer is displayed throughout the test. When the timer reaches zero the test is submitted automatically.",
          "Time spent is capped at the allocated limit in your results — you will never see more than 100% of time used.",
        ],
      },
      {
        heading: "Scoring",
        body: [
          "Each question is worth one point. Your final score is the number of correct answers divided by the total number of questions, expressed as a percentage.",
          "For multiple choice questions, you must select all correct options to receive the point.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Test Types Available", href: "/support/articles/test-types-available" },
      { title: "Understanding Your Results", href: "/support/articles/understanding-your-results" },
    ],
  },
  {
    slug: "retaking-tests",
    title: "Retaking Tests",
    category: "Tests & Exams",
    description: "How to retake a test and what happens to your previous results.",
    sections: [
      {
        heading: "How to Retake",
        body: [
          "Navigate to the test from your Dashboard and click Start Test again. A new session will begin.",
          "On paid plans, question order is randomised for each attempt, giving you a fresh challenge.",
        ],
      },
      {
        heading: "Your Previous Results",
        body: [
          "All previous attempts are preserved in your Test History. Retaking a test does not overwrite your old scores.",
          "You can compare scores across attempts to track your improvement.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Test Results Analysis", href: "/support/articles/test-results-analysis" },
    ],
  },
  {
    slug: "test-results-analysis",
    title: "Test Results Analysis",
    category: "Tests & Exams",
    description: "How to use your results to identify weak areas and improve.",
    sections: [
      {
        heading: "Category Performance",
        body: [
          "Your results page breaks your score down by category, showing how you performed in each subject area.",
          "Categories where you scored below 70% are worth prioritising in your study plan.",
        ],
      },
      {
        heading: "Question Review",
        body: [
          "Every question from the test is listed with your answer, the correct answer, and a written explanation.",
          "Use this to understand why you got something wrong, not just that you did.",
        ],
      },
      {
        heading: "Time Analysis (Paid Plans)",
        body: [
          "See exactly how long you spent on each question. Very fast incorrect answers may indicate guessing; very slow incorrect answers may indicate knowledge gaps worth addressing.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Understanding Your Results", href: "/support/articles/understanding-your-results" },
      { title: "Best Practices", href: "/support/articles/best-practices" },
    ],
  },

  // ─── Technical Support ─────────────────────────────────────────────
  {
    slug: "browser-compatibility",
    title: "Browser Compatibility",
    category: "Technical Support",
    description: "Which browsers are supported and how to get the best experience.",
    sections: [
      {
        heading: "Supported Browsers",
        body: [
          "Practice ERP works best on the latest versions of Chrome, Firefox, Safari, and Edge.",
          "Internet Explorer is not supported.",
        ],
      },
      {
        heading: "Common Browser Issues",
        body: [
          "If pages look broken or features do not work, try clearing your browser cache (Ctrl+Shift+Delete on Windows, Cmd+Shift+Delete on Mac).",
          "Disable browser extensions one at a time to check if an extension is blocking functionality.",
          "Make sure JavaScript is enabled — the platform requires it to function.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Connection Issues", href: "/support/articles/connection-issues" },
      { title: "Contact Support", href: "/contact" },
    ],
  },
  {
    slug: "connection-issues",
    title: "Connection Issues",
    category: "Technical Support",
    description: "Troubleshooting steps for connectivity and loading problems.",
    sections: [
      {
        heading: "Basic Checks",
        body: [
          "Confirm your internet connection is working by visiting another website.",
          "Try refreshing the page (F5 or Cmd+R).",
          "If the issue persists, try opening the site in a private/incognito window.",
        ],
      },
      {
        heading: "Slow Loading",
        body: [
          "Slow loading is usually caused by a poor internet connection. Switch to a faster network if possible.",
          "Clearing your browser cache can also help with stale data causing slow responses.",
        ],
      },
      {
        heading: "Still Having Issues?",
        body: [
          "Contact our support team with a description of the problem, your browser and OS version, and any error messages you see.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Browser Compatibility", href: "/support/articles/browser-compatibility" },
      { title: "Contact Support", href: "/contact" },
    ],
  },
  {
    slug: "mobile-app-problems",
    title: "Mobile App Problems",
    category: "Technical Support",
    description: "Tips for using Practice ERP on mobile devices.",
    sections: [
      {
        heading: "Mobile Browser Support",
        body: [
          "Practice ERP is a web application accessible via any modern mobile browser — Chrome for Android or Safari for iOS are recommended.",
          "There is currently no dedicated native app. Use your browser's Add to Home Screen option for a more app-like experience.",
        ],
      },
      {
        heading: "Common Mobile Issues",
        body: [
          "If the layout appears broken, try rotating your device to landscape mode for a better view of test questions.",
          "Ensure your mobile browser is updated to the latest version.",
          "If drag-and-drop questions are not working, try using a stylus or check if your browser supports touch drag events.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Browser Compatibility", href: "/support/articles/browser-compatibility" },
      { title: "Contact Support", href: "/contact" },
    ],
  },
  {
    slug: "performance-issues",
    title: "Performance Issues",
    category: "Technical Support",
    description: "What to do if Practice ERP feels slow or unresponsive.",
    sections: [
      {
        heading: "Quick Fixes",
        body: [
          "Clear your browser cache and reload the page.",
          "Close other tabs and applications to free up memory.",
          "Try a different browser to rule out browser-specific slowness.",
        ],
      },
      {
        heading: "Persistent Slowness",
        body: [
          "If the platform is consistently slow across browsers and devices, it may be a temporary server issue.",
          "Contact our support team — please include details of what is slow, your browser, and your location.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Connection Issues", href: "/support/articles/connection-issues" },
      { title: "Contact Support", href: "/contact" },
    ],
  },

  // ─── Community & Resources ─────────────────────────────────────────
  {
    slug: "study-groups",
    title: "Study Groups",
    category: "Community & Resources",
    description: "How to study collaboratively with other Practice ERP users.",
    sections: [
      {
        heading: "Community Study",
        body: [
          "Study groups are not yet a built-in feature of Practice ERP, but you can connect with other learners through our community channels.",
          "Reach out via the Contact page to express interest — we are actively considering community features for a future release.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Best Practices", href: "/support/articles/best-practices" },
      { title: "Contact Support", href: "/contact" },
    ],
  },
  {
    slug: "discussion-forums",
    title: "Discussion Forums",
    category: "Community & Resources",
    description: "Where to ask questions and discuss exam topics with other users.",
    sections: [
      {
        heading: "Coming Soon",
        body: [
          "Discussion forums are planned for a future update. We want to build a space where learners can discuss questions, share tips, and support each other.",
          "In the meantime, contact us via the Contact page with any questions or feedback.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Contact Support", href: "/contact" },
    ],
  },
  {
    slug: "success-stories",
    title: "Success Stories",
    category: "Community & Resources",
    description: "How Practice ERP has helped users pass their certifications.",
    sections: [
      {
        heading: "Real Results",
        body: [
          "Practice ERP is designed to mirror the format and difficulty of real certification exams, giving you the confidence to perform on exam day.",
          "Many users report that regular practice with randomised question sets significantly improved their recall and speed during the real exam.",
        ],
      },
      {
        heading: "Share Your Story",
        body: [
          "Passed your certification? We would love to hear about it. Contact us via the Contact page to share your experience.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Best Practices", href: "/support/articles/best-practices" },
    ],
  },
  {
    slug: "best-practices",
    title: "Best Practices for Exam Preparation",
    category: "Community & Resources",
    description: "Proven strategies to get the most out of Practice ERP and pass your exam.",
    sections: [
      {
        heading: "Study Consistently",
        body: [
          "Short, regular sessions (30–45 minutes daily) are more effective than occasional long marathons.",
          "Use your Dashboard to track your progress and hold yourself accountable.",
        ],
      },
      {
        heading: "Review Wrong Answers",
        body: [
          "After every test, read the explanation for every question you got wrong — not just the ones you are unsure about.",
          "Understanding why the correct answer is correct is more valuable than simply memorising it.",
        ],
      },
      {
        heading: "Target Weak Categories",
        body: [
          "Use the category breakdown in your results to identify which subject areas need the most attention.",
          "Focus extra study time on those categories before attempting the full test again.",
        ],
      },
      {
        heading: "Simulate Real Conditions",
        body: [
          "Take at least a few tests under timed conditions in a quiet space to simulate the real exam environment.",
          "This reduces anxiety on exam day and helps you manage your time more effectively.",
        ],
      },
    ],
    relatedLinks: [
      { title: "Test Results Analysis", href: "/support/articles/test-results-analysis" },
      { title: "Study Guide", href: "/study-guide" },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}
