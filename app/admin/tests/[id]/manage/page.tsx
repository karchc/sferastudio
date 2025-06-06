'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { QuestionForm } from '@/app/components/admin/QuestionFormEnhanced';
import Link from 'next/link';
import { Category, QuestionFormData } from '@/app/lib/types';

interface Test {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  time_limit?: number;
  category_ids?: string[];
  is_active?: boolean;
}

interface Question {
  id: string;
  type: string;
  text: string;
  category_id: string;
  difficulty: string;
  points: number;
  explanation?: string;
  position?: number;
  answers?: any[];
  matchItems?: any[];
  sequenceItems?: any[];
  dragDropItems?: any[];
}

interface CategoryWithQuestions extends Category {
  questions: Question[];
  question_count: number;
}

export default function TestManagePage() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id as string;
  
  const [test, setTest] = useState<Test | null>(null);
  const [categories, setCategories] = useState<CategoryWithQuestions[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // UI states
  const [isEditingTest, setIsEditingTest] = useState(false);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);
  const [selectedCategoryForQuestion, setSelectedCategoryForQuestion] = useState<string | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState<string | null>(null);
  
  // Form states
  const [testForm, setTestForm] = useState<Partial<Test>>({});
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  useEffect(() => {
    if (testId) {
      loadTestData();
    }
  }, [testId]);

  async function loadTestData() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/tests/${testId}`);
      
      if (!response.ok) throw new Error('Failed to load test data');
      const data = await response.json();
      
      setTest(data.test);
      setTestForm(data.test);
      setAllCategories(data.allCategories || []);
      setCategories(data.categories || []);
      
    } catch (err) {
      console.error('Error loading test data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load test data');
    } finally {
      setLoading(false);
    }
  }

  async function updateTest() {
    try {
      // Validate required fields
      if (!testForm.title?.trim()) {
        setError('Test title is required');
        return;
      }
      
      // Ensure time_limit has a valid value
      const timeLimit = testForm.time_limit || 60;
      if (timeLimit < 1) {
        setError('Time limit must be at least 1 minute');
        return;
      }
      
      const updateData = {
        ...testForm,
        time_limit: timeLimit
      };
      
      const response = await fetch(`/api/admin/tests/${testId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) throw new Error('Failed to update test');
      
      setTest({ ...test!, ...updateData });
      setIsEditingTest(false);
      setSuccess('Test updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update test');
    }
  }

  async function createCategory() {
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(categoryForm)
      });
      
      if (!response.ok) throw new Error('Failed to create category');
      const newCategory = await response.json();
      
      // Add category to test
      await fetch(`/api/admin/tests/${testId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoryId: newCategory.id,
          action: 'add'
        })
      });
      
      // Refresh data
      loadTestData();
      setIsCreatingCategory(false);
      setCategoryForm({ name: '', description: '' });
      setSuccess('Category created and added to test');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    }
  }

  async function addCategoryToTest(categoryId: string) {
    try {
      const response = await fetch(`/api/admin/tests/${testId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoryId,
          action: 'add'
        })
      });
      
      if (!response.ok) throw new Error('Failed to add category to test');
      
      loadTestData();
      setSuccess('Category added to test');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add category');
    }
  }

  async function removeCategoryFromTest(categoryId: string) {
    try {
      const response = await fetch(`/api/admin/tests/${testId}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          categoryId,
          action: 'remove'
        })
      });
      
      if (!response.ok) throw new Error('Failed to remove category from test');
      
      loadTestData();
      setSuccess('Category removed from test');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove category');
    }
  }

  async function createQuestion(questionData: QuestionFormData) {
    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...questionData,
          testId
        })
      });
      
      if (!response.ok) throw new Error('Failed to create question');
      
      loadTestData();
      setIsCreatingQuestion(false);
      setSelectedCategoryForQuestion(null);
      setSuccess('Question created and added to test');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question');
    }
  }

  async function removeQuestionFromTest(questionId: string) {
    try {
      const response = await fetch(`/api/admin/tests/${testId}/questions?questionId=${questionId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to remove question');
      
      loadTestData();
      setSuccess('Question removed from test');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove question');
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Not Found</h2>
          <Link href="/admin/tests">
            <Button>Back to Tests</Button>
          </Link>
        </div>
      </div>
    );
  }

  const availableCategories = allCategories.filter(
    cat => !test.category_ids?.includes(cat.id)
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Test</h1>
          <p className="text-gray-600 mt-1">Configure categories and questions for this test</p>
        </div>
        <Link href="/admin/tests">
          <Button variant="outline">Back to Tests</Button>
        </Link>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-100 text-green-700 rounded-md border border-green-200">
          {success}
        </div>
      )}

      {/* Test Details */}
      <Card>
        <CardContent className="p-6">
          {isEditingTest ? (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Edit Test Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={testForm.title || ''}
                    onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time Limit (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="300"
                    value={testForm.time_limit || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setTestForm({ 
                        ...testForm, 
                        time_limit: value === '' ? undefined : parseInt(value) || 1
                      });
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="60"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Default: 60 minutes (if left empty)
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={testForm.description || ''}
                  onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Brief description of the test"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Test Instructions</label>
                <textarea
                  value={testForm.instructions || ''}
                  onChange={(e) => setTestForm({ ...testForm, instructions: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={5}
                  placeholder="Detailed instructions for test takers (e.g., time management tips, question format information, scoring criteria, etc.)"
                />
                <p className="mt-1 text-sm text-gray-500">
                  These instructions will be displayed to users before they start the test.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={updateTest}>Save Changes</Button>
                <Button variant="outline" onClick={() => setIsEditingTest(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{test.title}</h2>
                {test.description && <p className="text-gray-600 mt-1">{test.description}</p>}
                {test.instructions && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="text-sm font-semibold text-blue-800 mb-1">Test Instructions:</h4>
                    <p className="text-sm text-blue-700 whitespace-pre-wrap">{test.instructions}</p>
                  </div>
                )}
                <div className="mt-3 flex gap-3">
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {test.time_limit} minutes
                  </span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    test.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {test.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <Button variant="outline" onClick={() => setIsEditingTest(true)}>
                Edit Test
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categories Management */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Categories & Questions</h2>
          <div className="flex gap-2">
            {availableCategories.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addCategoryToTest(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="p-2 border border-gray-300 rounded-md"
              >
                <option value="">Add Existing Category</option>
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            )}
            <Button variant="outline" onClick={() => setIsCreatingCategory(true)}>
              Create New Category
            </Button>
          </div>
        </div>

        {/* Create Category Form */}
        {isCreatingCategory && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Create New Category</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Category Name</label>
                  <input
                    type="text"
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter category name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter category description (optional)"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={createCategory} disabled={!categoryForm.name.trim()}>
                    Create Category
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsCreatingCategory(false);
                    setCategoryForm({ name: '', description: '' });
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Question Form */}
        {isCreatingQuestion && (
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Create New Question</h3>
                <Button variant="outline" onClick={() => {
                  setIsCreatingQuestion(false);
                  setSelectedCategoryForQuestion(null);
                }}>
                  Cancel
                </Button>
              </div>
              <QuestionForm
                categories={categories}
                onSubmit={createQuestion}
                onCancel={() => {
                  setIsCreatingQuestion(false);
                  setSelectedCategoryForQuestion(null);
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Categories List */}
        {categories.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories assigned</h3>
              <p className="text-gray-600 mb-4">Add categories to start organizing questions for this test.</p>
            </CardContent>
          </Card>
        ) : (
          categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    {category.description && (
                      <p className="text-gray-600 mt-1">{category.description}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      {category.question_count} {category.question_count === 1 ? 'question' : 'questions'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCategoryForQuestion(category.id);
                        setIsCreatingQuestion(true);
                      }}
                    >
                      Add Question
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Remove category "${category.name}" and all its questions from this test?`)) {
                          removeCategoryFromTest(category.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Questions in this category */}
                {category.questions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No questions in this category yet.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCategoryForQuestion(category.id);
                        setIsCreatingQuestion(true);
                      }}
                      className="mt-2"
                    >
                      Add First Question
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {category.questions.map((question, index) => (
                      <div key={question.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {question.type.replace(/_/g, ' ')}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded ${
                                question.difficulty === 'hard' ? 'bg-red-100 text-red-800' :
                                question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {question.difficulty}
                              </span>
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                {question.points} {question.points === 1 ? 'point' : 'points'}
                              </span>
                            </div>
                            <p className="text-gray-900">{question.text}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Remove this question from the test?')) {
                                removeQuestionFromTest(question.id);
                              }
                            }}
                            className="ml-4 text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}