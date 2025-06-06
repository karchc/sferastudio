"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Test, TestData, Question } from "@/app/lib/types";
import Link from "next/link";
import { 
  fetchTest, 
  removeQuestionFromTest, 
  updateQuestionOrder 
} from "@/app/lib/supabase-tests";
import { fetchCategories } from "@/app/lib/supabase-categories";

export default function TestQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;
  
  const [test, setTest] = useState<any>(null);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load test data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      
      try {
        // Load test from Supabase
        const testData = await fetchTest(testId);
        setTest(testData);
        
        // Load categories for display
        const categoriesData = await fetchCategories();
        const categoryMap: Record<string, string> = {};
        categoriesData.forEach(cat => {
          categoryMap[cat.id] = cat.name;
        });
        setCategories(categoryMap);
      } catch (err) {
        console.error('Error loading test:', err);
        setError(err instanceof Error ? err.message : 'Failed to load test');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [testId]);

  // Function to handle reordering questions
  const handleMoveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    if (!test) return;
    
    const questions = [...test.questions];
    const index = questions.findIndex(q => q.id === questionId);
    
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === questions.length - 1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newPosition = questions[newIndex].position || newIndex + 1;
    
    try {
      // Update question order in Supabase
      await updateQuestionOrder(testId, questionId, newPosition);
      
      // Update local state
      const [removed] = questions.splice(index, 1);
      questions.splice(newIndex, 0, removed);
      
      // Update positions in local state
      const updatedQuestions = questions.map((q, i) => ({
        ...q,
        position: i + 1
      }));
      
      setTest((prev: any) => prev ? { 
        ...prev, 
        questions: updatedQuestions,
        updatedAt: new Date()
      } : null);
    } catch (err) {
      console.error('Error updating question order:', err);
      setError(err instanceof Error ? err.message : 'Failed to update question order');
    }
  };

  // Function to remove a question from the test
  const handleRemoveQuestion = async (questionId: string) => {
    if (!test) return;
    if (!confirm('Are you sure you want to remove this question from the test?')) return;
    
    try {
      // Remove question from test in Supabase
      await removeQuestionFromTest(testId, questionId);
      
      // Update local state
      const updatedQuestions = test.questions
        .filter((q: any) => q.id !== questionId)
        .map((q: any, index: number) => ({
          ...q,
          position: index + 1
        }));
      
      setTest((prev: any) => prev ? { 
        ...prev, 
        questions: updatedQuestions,
        updatedAt: new Date()
      } : null);
    } catch (err) {
      console.error('Error removing question:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove question');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>
        <div className="mt-4">
          <Link href="/admin/tests">
            <Button variant="outline">Back to Tests</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="p-6">
        <div className="p-4 bg-yellow-100 text-yellow-700 rounded-md">Test not found</div>
        <div className="mt-4">
          <Link href="/admin/tests">
            <Button variant="outline">Back to Tests</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{test.title} - Questions</h2>
          <p className="text-slate-500">
            {test.questions.length} questions • {Math.floor(test.timeLimit / 60)} minutes
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/admin/tests">
            <Button variant="outline">Back to Tests</Button>
          </Link>
          <Link href={`/admin/tests/${testId}/questions/add`}>
            <Button>Add Questions</Button>
          </Link>
        </div>
      </div>

      {test.questions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-500 py-8">No questions added to this test yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {test.questions.map((question: any, index: number) => (
            <Card key={question.id}>
              <CardContent className="p-6">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">Q{index + 1}.</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {question.type === 'multiple-choice' ? 'Multiple Choice' : 
                         question.type === 'single-choice' ? 'Single Choice' : 
                         question.type === 'true-false' ? 'True/False' : 
                         question.type === 'matching' ? 'Matching' : 
                         question.type === 'sequence' ? 'Sequence' : 'Drag & Drop'}
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        {categories[question.category] || question.category}
                      </span>
                    </div>
                    <p>{question.text}</p>
                    
                    {(question.type === 'multiple-choice' || question.type === 'single-choice' || question.type === 'true-false') && question.answers && (
                      <div className="mt-3 ml-6 text-sm">
                        <p className="font-medium text-slate-500 mb-1">Answers:</p>
                        <ul className="space-y-1">
                          {question.answers.map((answer: any) => (
                            <li key={answer.id} className={`${answer.isCorrect ? 'text-green-700' : 'text-slate-600'} whitespace-pre-line`}>
                              {answer.text} {answer.isCorrect && '✓'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {question.type === 'matching' && question.matchItems && (
                      <div className="mt-3 ml-6 text-sm">
                        <p className="font-medium text-slate-500 mb-1">Match Items:</p>
                        <ul className="space-y-1">
                          {question.matchItems.map((item: any) => (
                            <li key={item.id} className="text-slate-600">
                              {item.leftText} → {item.rightText}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {question.type === 'sequence' && question.sequenceItems && (
                      <div className="mt-3 ml-6 text-sm">
                        <p className="font-medium text-slate-500 mb-1">Sequence (Correct Order):</p>
                        <ol className="list-decimal ml-5 space-y-1">
                          {[...question.sequenceItems]
                            .sort((a, b) => a.correctPosition - b.correctPosition)
                            .map((item: any) => (
                              <li key={item.id} className="text-slate-600">
                                {item.text}
                              </li>
                            ))}
                        </ol>
                      </div>
                    )}

                    {question.type === 'drag-drop' && question.dragDropItems && (
                      <div className="mt-3 ml-6 text-sm">
                        <p className="font-medium text-slate-500 mb-1">Drag-Drop Items:</p>
                        <ul className="space-y-1">
                          {question.dragDropItems.map((item: any) => (
                            <li key={item.id} className="text-slate-600">
                              {item.content} → <span className="bg-gray-100 px-2 py-0.5 rounded">{item.targetZone}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleMoveQuestion(question.id, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleMoveQuestion(question.id, 'down')}
                      disabled={index === test.questions.length - 1}
                    >
                      ↓
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleRemoveQuestion(question.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}