import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabaseClient";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const testId = params.id;

  // Fetch test details
  const { data: test, error: testError } = await supabase
    .from("tests")
    .select("*")
    .eq("id", testId)
    .single();

  if (testError || !test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  // Fetch questions linked to this test
  const { data: testQuestions, error: questionsError } = await supabase
    .from("test_questions")
    .select(`
      position,
      questions!inner (
        id,
        text,
        type,
        category_id
      )
    `)
    .eq("test_id", testId)
    .order("position");

  if (questionsError) {
    return NextResponse.json({ error: "Questions fetch error" }, { status: 500 });
  }

  // Extract question IDs
  const questionIds = testQuestions?.map(tq => tq.questions.id) || [];

  // Fetch answers for all questions
  const { data: answers, error: answersError } = await supabase
    .from("answers")
    .select("*")
    .in("question_id", questionIds);

  if (answersError) {
    return NextResponse.json({ error: "Answers fetch error" }, { status: 500 });
  }

  // Format the questions with their answers
  const formattedQuestions = testQuestions?.map(tq => {
    const questionAnswers = answers?.filter(a => a.question_id === tq.questions.id) || [];
    return {
      id: tq.questions.id,
      text: tq.questions.text,
      type: tq.questions.type,
      categoryId: tq.questions.category_id,
      position: tq.position,
      answers: questionAnswers.map(a => ({
        id: a.id,
        questionId: a.question_id,
        text: a.text,
        isCorrect: a.is_correct
      }))
    };
  }) || [];

  return NextResponse.json({
    id: test.id,
    title: test.title,
    description: test.description || "",
    timeLimit: test.time_limit * 60,
    categoryIds: test.category_ids || [],
    isActive: test.is_active,
    questions: formattedQuestions,
  });
}