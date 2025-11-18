import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/app/lib/auth-server";
import { checkTestAccess } from "@/app/lib/test-access-control";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: testId } = await params;

  // Create server-side Supabase client with user session
  const supabase = await createServerSupabase();

  // Get current user (may be null for anonymous users)
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || null;

  // Fetch test details including pricing information
  const { data: test, error: testError } = await supabase
    .from("tests")
    .select("*")
    .eq("id", testId)
    .single();

  if (testError || !test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  // Check if user has access to this test
  const accessCheck = await checkTestAccess(supabase, userId, {
    id: test.id,
    price: test.price,
    currency: test.currency,
    is_free: test.is_free,
  });

  // If access is denied, return appropriate response
  if (!accessCheck.canAccess) {
    if (accessCheck.status === 'auth_required') {
      return NextResponse.json({
        error: "Authentication required",
        message: "You must be logged in to access this test",
        requiresAuth: true,
        testInfo: {
          id: test.id,
          title: test.title,
          description: test.description,
          price: test.price,
          currency: test.currency,
          is_free: test.is_free,
        },
      }, { status: 401 });
    }

    if (accessCheck.status === 'locked') {
      return NextResponse.json({
        error: "Access denied",
        message: "This test requires purchase",
        requiresPurchase: true,
        testInfo: {
          id: test.id,
          title: test.title,
          description: test.description,
          price: test.price,
          currency: test.currency,
          is_free: test.is_free,
        },
      }, { status: 403 });
    }
  }

  // Fetch questions linked to this test with category names
  const { data: testQuestions, error: questionsError } = await supabase
    .from("test_questions")
    .select(`
      position,
      questions!inner (
        id,
        text,
        type,
        media_url,
        category_id,
        categories!inner (
          id,
          name
        )
      )
    `)
    .eq("test_id", testId)
    .order("position");

  if (questionsError) {
    return NextResponse.json({ error: "Questions fetch error" }, { status: 500 });
  }

  // Extract question IDs
  const questionIds = testQuestions?.map(tq => tq.questions.id) || [];

  // Fetch regular answers for multiple choice/single choice questions
  const { data: answers, error: answersError } = await supabase
    .from("answers")
    .select("*")
    .in("question_id", questionIds);

  if (answersError) {
    return NextResponse.json({ error: "Answers fetch error" }, { status: 500 });
  }

  // Fetch dropdown answers for dropdown questions
  const { data: dropdownAnswers, error: dropdownError } = await supabase
    .from("dropdown_answers")
    .select("*")
    .in("question_id", questionIds)
    .order("position");

  if (dropdownError) {
    return NextResponse.json({ error: "Dropdown answers fetch error" }, { status: 500 });
  }

  // Format the questions with their answers
  const formattedQuestions = testQuestions?.map(tq => {
    const questionAnswers = answers?.filter(a => a.question_id === tq.questions.id) || [];
    const questionDropdownAnswers = dropdownAnswers?.filter(d => d.question_id === tq.questions.id) || [];
    
    return {
      id: tq.questions.id,
      text: tq.questions.text,
      type: tq.questions.type,
      mediaUrl: tq.questions.media_url,
      categoryId: tq.questions.category_id,
      category: tq.questions.categories,
      position: tq.position,
      answers: questionAnswers.map(a => ({
        id: a.id,
        questionId: a.question_id,
        text: a.text,
        isCorrect: a.is_correct
      })),
      dropdownItems: questionDropdownAnswers.map(d => ({
        id: d.id,
        questionId: d.question_id,
        statement: d.statement,
        correctAnswer: d.correct_answer,
        options: Array.isArray(d.options) ? d.options : [],
        position: d.position
      }))
    };
  }) || [];

  // Return test data with access information
  return NextResponse.json({
    id: test.id,
    title: test.title,
    description: test.description || "",
    instructions: test.instructions || "",
    timeLimit: test.time_limit,
    categoryIds: test.category_ids || [],
    isActive: test.is_active,
    allow_backward_navigation: test.allow_backward_navigation ?? true,
    questions: formattedQuestions,
    // Include access information for client-side use
    accessInfo: {
      hasAccess: accessCheck.canAccess,
      isFree: accessCheck.isFree,
      hasPurchased: accessCheck.hasPurchased,
      price: test.price,
      currency: test.currency,
    },
  });
}