"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Test, TestData, Question, Category } from "@/app/lib/types";
import Link from "next/link";
import { fetchTest, addQuestionsToTest } from "@/app/lib/supabase-tests";
import { fetchCategories } from "@/app/lib/supabase-categories";
import { fetchQuestions } from "@/app/lib/supabase-questions";

export default function AddQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;
  
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Load test, questions, and categories
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      
      try {
        // Load data from Supabase
        const [testData, allQuestions, categoriesData] = await Promise.all([
          fetchTest(testId),
          fetchQuestions(),
          fetchCategories()
        ]);
        
        if (!testData) throw new Error(`Test not found`);
        setTest(testData);
        setCategories(categoriesData);
        
        // Filter out questions that are already in the test
        const testQuestionIds = testData.questions.map(q => q.id);
        const availableQuestions = allQuestions.filter(q => !testQuestionIds.includes(q.id));
        
        setQuestions(availableQuestions);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [testId]);

  const toggleQuestionSelection = (questionId: string) => {
    setSelectedQuestions(prev => 
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleAddQuestions = async () => {
    if (!test || selectedQuestions.length === 0) return;
    
    try {
      setError(null);
      
      // Add questions to test in Supabase
      await addQuestionsToTest(testId, selectedQuestions);
      
      // Redirect back to test questions page
      router.push(`/admin/tests/${testId}/questions`);
    } catch (err) {
      console.error('Error adding questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to add questions');
    }
  };

  // Apply filters
  const filteredQuestions = questions.filter(question => {
    const matchesCategory = categoryFilter === "all" || question.category?.id === categoryFilter;
    const matchesType = typeFilter === "all" || question.type === typeFilter;
    return matchesCategory && matchesType;
  });

  // Helper function to get category name 
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  // Function to get question type display name
  const getQuestionTypeDisplay = (type: string): string => {
    const typeMap: Record<string, string> = {
      'multiple-choice': 'Multiple Choice',
      'single-choice': 'Single Choice',
      'true-false': 'True/False',
      'matching': 'Matching',
      'sequence': 'Sequence',
      'drag-drop': 'Drag and Drop'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>
        <div className="mt-4">
          <Link href={`/admin/tests/${testId}/questions`}>
            <Button variant="outline">Back to Test Questions</Button>
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
          <h2 className="text-2xl font-bold">Add Questions to {test.title}</h2>
          <p className="text-slate-500">
            Selected {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href={`/admin/tests/${testId}/questions`}>
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button 
            onClick={handleAddQuestions}
            disabled={selectedQuestions.length === 0}
          >
            Add Selected Questions
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <label htmlFor="categoryFilter" className="text-sm font-medium">
            Category:
          </label>
          <select
            id="categoryFilter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label htmlFor="typeFilter" className="text-sm font-medium">
            Type:
          </label>
          <select
            id="typeFilter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="p-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Types</option>
            <option value="multiple-choice">Multiple Choice</option>
            <option value="single-choice">Single Choice</option>
            <option value="true-false">True/False</option>
            <option value="matching">Matching</option>
            <option value="sequence">Sequence</option>
            <option value="drag-drop">Drag and Drop</option>
          </select>
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-500 py-8">
              {questions.length === 0 
                ? "No questions available to add." 
                : "No questions match the selected filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((question) => (
            <Card 
              key={question.id}
              className={`${
                selectedQuestions.includes(question.id) 
                  ? "border-2 border-blue-500" 
                  : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {getQuestionTypeDisplay(question.type)}
                      </span>
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                        {getCategoryName(question.category?.id || question.categoryId || 'unknown')}
                      </span>
                    </div>
                    <p className="text-lg">{question.text}</p>
                    
                    {(question.type === 'multiple-choice' || question.type === 'single-choice' || question.type === 'true-false') && question.answers && (
                      <div className="mt-3 ml-6 text-sm">
                        <p className="font-medium text-slate-500 mb-1">Answers:</p>
                        <ul className="space-y-1">
                          {question.answers.map((answer) => (
                            <li key={answer.id} className={`${'isCorrect' in answer && answer.isCorrect ? 'text-green-700' : 'text-slate-600'} whitespace-pre-line`}>
                              {('text' in answer ? answer.text : '') || ('leftText' in answer ? answer.leftText : '') || ('content' in answer ? answer.content : '') || 'N/A'} {'isCorrect' in answer && answer.isCorrect && '✓'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {question.type === 'matching' && (question as any).matchItems && (
                      <div className="mt-3 ml-6 text-sm">
                        <p className="font-medium text-slate-500 mb-1">Match Items:</p>
                        <ul className="space-y-1">
                          {(question as any).matchItems.map((item: any) => (
                            <li key={item.id} className="text-slate-600">
                              {item.leftText} → {item.rightText}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {question.type === 'sequence' && (question as any).sequenceItems && (
                      <div className="mt-3 ml-6 text-sm">
                        <p className="font-medium text-slate-500 mb-1">Sequence (Correct Order):</p>
                        <ol className="list-decimal ml-5 space-y-1">
                          {[...(question as any).sequenceItems]
                            .sort((a, b) => a.correctPosition - b.correctPosition)
                            .map((item) => (
                              <li key={item.id} className="text-slate-600">
                                {item.text}
                              </li>
                            ))}
                        </ol>
                      </div>
                    )}

                    {question.type === 'drag-drop' && (question as any).dragDropItems && (
                      <div className="mt-3 ml-6 text-sm">
                        <p className="font-medium text-slate-500 mb-1">Drag-Drop Items:</p>
                        <ul className="space-y-1">
                          {(question as any).dragDropItems.map((item: any) => (
                            <li key={item.id} className="text-slate-600">
                              {item.content} → <span className="bg-gray-100 px-2 py-0.5 rounded">{item.targetZone}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex items-start">
                    <Button 
                      variant={selectedQuestions.includes(question.id) ? "default" : "outline"}
                      onClick={() => toggleQuestionSelection(question.id)}
                    >
                      {selectedQuestions.includes(question.id) ? "Selected" : "Select"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {filteredQuestions.length > 0 && (
        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleAddQuestions}
            disabled={selectedQuestions.length === 0}
          >
            Add Selected Questions ({selectedQuestions.length})
          </Button>
        </div>
      )}
    </div>
  );
}