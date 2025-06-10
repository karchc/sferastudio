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

  // Fetch questions linked to this test with category names
  const { data: testQuestions, error: questionsError } = await supabase
    .from("test_questions")
    .select(`
      position,
      questions!inner (
        id,
        text,
        type,
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

  return NextResponse.json({
    id: test.id,
    title: test.title,
    description: test.description || "",
    instructions: test.instructions || "",
    timeLimit: test.time_limit * 60,
    categoryIds: test.category_ids || [],
    isActive: test.is_active,
    allow_backward_navigation: test.allow_backward_navigation ?? true,
    questions: formattedQuestions,
  });
}