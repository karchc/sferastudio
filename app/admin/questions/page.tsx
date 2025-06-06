"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Question, Category } from "@/app/lib/types";
import Link from "next/link";

interface Test {
  id: string;
  title: string;
  description?: string;
}

interface QuestionWithCategory extends Question {
  category?: Category;
  test_questions?: { test_id: string }[];
  _count?: {
    test_questions: number;
  };
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setcategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Load questions and categories
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [questionsRes, categoriesRes] = await Promise.all([
          fetch(`/api/admin/questions?category_id=${categoryFilter}&type=${typeFilter}`),
          fetch('/api/admin/categories')
        ]);
        
        if (!questionsRes.ok || !categoriesRes.ok) {
          throw new Error(`HTTP Error: Questions ${questionsRes.status}, Categories ${categoriesRes.status}`);
        }
        
        const [questionsData, categoriesData] = await Promise.all([
          questionsRes.json(),
          categoriesRes.json()
        ]);
        
        setCategories(categoriesData || []);
        setQuestions(questionsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);


  // Handle deleting a question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question? This will remove it from all tests.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete question');
      
      setQuestions(questions.filter(q => q.id !== questionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    }
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

  // Filter questions based on all filters
  const filteredQuestions = questions.filter(question => {
    // Category filter
    if (categoryFilter !== "all" && (question.category_id || question.categoryId) !== categoryFilter) {
      return false;
    }
    
    // Type filter
    if (typeFilter !== "all" && question.type !== typeFilter) {
      return false;
    }
    
    // Search term filter
    if (searchTerm && !question.text.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Question Bank Management</h2>
        <div className="flex gap-4">
          <Link href="/admin/questions/new" passHref>
            <Button>Create New Question</Button>
          </Link>
          <Link href="/admin" passHref>
            <Button variant="outline">Back to Admin</Button>
          </Link>
        </div>
      </div>
      
      {error && <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>}
      
      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label htmlFor="categoryFilter" className="block text-sm font-medium mb-2">
            Filter by Category
          </label>
          <select
            id="categoryFilter"
            value={categoryFilter}
            onChange={(e) => setcategoryFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="typeFilter" className="block text-sm font-medium mb-2">
            Filter by Type
          </label>
          <select
            id="typeFilter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Types</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="single_choice">Single Choice</option>
            <option value="true_false">True/False</option>
            <option value="matching">Matching</option>
            <option value="sequence">Sequence</option>
            <option value="drag_drop">Drag and Drop</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium mb-2">
            Search Questions
          </label>
          <input
            id="searchTerm"
            type="text"
            placeholder="Search by question text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>
      
      {/* Questions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">
            Questions ({filteredQuestions.length} {filteredQuestions.length === 1 ? 'question' : 'questions'})
          </h3>
        </div>
        
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No questions found. Create your first question to get started.
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {filteredQuestions.map((question) => (
              <Card key={question.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between">
                    <div className="flex-grow pr-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {getQuestionTypeDisplay(question.type)}
                        </span>
                        {question.category ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                            {question.category.name}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs rounded-full">No Category</span>
                        )}
                        {(question as any).difficulty && (
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            (question as any).difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                            (question as any).difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {(question as any).difficulty}
                          </span>
                        )}
                        {question.test_questions && question.test_questions.length > 0 && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                            Used in {question.test_questions.length} {question.test_questions.length === 1 ? 'test' : 'tests'}
                          </span>
                        )}
                      </div>
                      <p className="text-lg font-medium mb-2">{question.text}</p>
                          
                          {(question.type === 'multiple-choice' || question.type === 'single-choice' || question.type === 'true-false') && question.answers && (
                            <div className="mt-3 ml-6 text-sm">
                              <p className="font-medium text-slate-500 mb-1">Answers:</p>
                              <ul className="space-y-1">
                                {question.answers && question.answers.map((answer: any) => (
                                  <li key={answer.id} className={`${answer.isCorrect ? 'text-green-700' : 'text-slate-600'} whitespace-pre-line`}>
                                    {answer.text} {answer.isCorrect && '✓'}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {question.type === 'matching' && (question as any).matchItems && (
                            <div className="mt-3 ml-6 text-sm">
                              <p className="font-medium text-slate-500 mb-1">Match Items:</p>
                              <ul className="space-y-1">
                                {(question as any).matchItems && (question as any).matchItems.map((item: any) => (
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
                                  .sort((a: any, b: any) => a.correctPosition - b.correctPosition)
                                  .map((item: any) => (
                                    <li key={item.id} className="text-slate-600">
                                      {item.text}
                                    </li>
                                  ))}
                              </ol>
                            </div>
                          )}

                          {question.type === 'drag_drop' && (question as any).dragDropItems && (
                            <div className="mt-3 ml-6 text-sm">
                              <p className="font-medium text-slate-500 mb-1">Drag-Drop Items:</p>
                              <ul className="space-y-1">
                                {(question as any).dragDropItems && (question as any).dragDropItems.map((item: any) => (
                                  <li key={item.id} className="text-slate-600">
                                    {item.content} → <span className="bg-gray-100 px-2 py-0.5 rounded">{item.targetZone}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Link href={`/admin/questions/${question.id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}