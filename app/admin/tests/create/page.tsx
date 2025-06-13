'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Plus, X } from 'lucide-react';

interface NewCategory {
  id: string;
  name: string;
  description: string;
}

interface TestForm {
  title: string;
  description: string;
  instructions: string;
  time_limit: number;
  categories: NewCategory[];
  is_active: boolean;
}

export default function CreateTestPage() {
  const router = useRouter();
  // Remove categories fetching - we'll create them inline
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allowBackwardNav, setAllowBackwardNav] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const [form, setForm] = useState<TestForm>({
    title: '',
    description: '',
    instructions: '',
    time_limit: 60,
    categories: [],
    is_active: true
  });

  // Remove categories loading useEffect

  // Remove loadCategories function

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!form.title.trim()) {
      setError('Test title is required');
      return;
    }
    
    if (!form.time_limit || form.time_limit < 1) {
      setError('Time limit must be at least 1 minute');
      return;
    }

    // Validate categories if any are added
    const invalidCategories = form.categories.filter(cat => !cat.name.trim());
    if (invalidCategories.length > 0) {
      setError('All categories must have a name');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const requestData = {
        ...form,
        // Convert categories to the format expected by the API
        categories: form.categories.map(cat => ({
          name: cat.name.trim(),
          description: cat.description.trim() || null
        }))
      };
      
      console.log('Submitting test data:', requestData);
      
      const response = await fetch('/api/admin/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) throw new Error('Failed to create test');
      const newTest = await response.json();
      
      // Redirect to the test management page
      router.push(`/admin/tests/${newTest.id}/manage`);
    } catch (err) {
      console.error('Error creating test:', err);
      setError(err instanceof Error ? err.message : 'Failed to create test');
      setSubmitting(false);
    }
  }

  const addCategory = () => {
    const newCategory: NewCategory = {
      id: Date.now().toString(),
      name: '',
      description: ''
    };
    setForm(prev => ({
      ...prev,
      categories: [...prev.categories, newCategory]
    }));
    setHasUnsavedChanges(true);
  };

  const removeCategory = (categoryId: string) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.filter(cat => cat.id !== categoryId)
    }));
    setHasUnsavedChanges(true);
  };

  const updateCategory = (categoryId: string, field: keyof NewCategory, value: string) => {
    setForm(prev => ({
      ...prev,
      categories: prev.categories.map(cat => 
        cat.id === categoryId ? { ...cat, [field]: value } : cat
      )
    }));
    setHasUnsavedChanges(true);
  };

  const handleFormChange = (field: keyof TestForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleBackNavigation = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    router.back();
  };

  // Prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Show form immediately, load categories in background

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Create New Test</h1>
          <p className="text-gray-600 mt-2">Set up a new test with categories and questions</p>
        </div>
        <div className="flex items-center gap-2">
          {allowBackwardNav && (
            <Button
              variant="ghost"
              onClick={handleBackNavigation}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <Link href="/admin/tests">
            <Button variant="outline">Back to Tests</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Test Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={form.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter test title"
                  required
                />
              </div>

              <div>
                <label htmlFor="time_limit" className="block text-sm font-medium mb-2">
                  Time Limit (minutes)
                </label>
                <input
                  id="time_limit"
                  type="number"
                  min="1"
                  max="300"
                  value={form.time_limit || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFormChange('time_limit', value === '' ? 60 : parseInt(value) || 60);
                  }}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="60"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Recommended: 1-120 minutes depending on test complexity
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Enter test description (optional)"
              />
            </div>

            <div>
              <label htmlFor="instructions" className="block text-sm font-medium mb-2">
                Test Instructions
              </label>
              <textarea
                id="instructions"
                value={form.instructions}
                onChange={(e) => handleFormChange('instructions', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Enter detailed instructions for test takers (e.g., time limits, question types, scoring criteria, etc.)"
              />
              <p className="mt-1 text-sm text-gray-500">
                These instructions will be shown to users before they start the test.
              </p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Navigation Settings</h3>
              <div className="flex items-center space-x-3">
                <input
                  id="allowBackNav"
                  type="checkbox"
                  checked={allowBackwardNav}
                  onChange={(e) => setAllowBackwardNav(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="allowBackNav" className="text-sm text-gray-700">
                  Allow backward navigation with browser back button
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                When enabled, admins can navigate back using the browser back button or the Back button above.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium">
                  Test Categories
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCategory}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Category
                </Button>
              </div>
              
              {form.categories.length === 0 ? (
                <div className="p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-md text-center">
                  <p className="text-gray-500 mb-3">
                    No categories added yet. Categories help organize questions by topic.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCategory}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Category
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.categories.map((category, index) => (
                    <div key={category.id} className="p-4 border border-gray-200 rounded-md bg-white">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          Category {index + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCategory(category.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Category Name *
                          </label>
                          <input
                            type="text"
                            value={category.name}
                            onChange={(e) => updateCategory(category.id, 'name', e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., SAP Basics, Advanced Programming, etc."
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Remark/Description
                          </label>
                          <textarea
                            value={category.description}
                            onChange={(e) => updateCategory(category.id, 'description', e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                            placeholder="Brief description of what this category covers (optional)"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addCategory}
                    className="w-full flex items-center justify-center gap-2 py-3 border-dashed"
                  >
                    <Plus className="h-4 w-4" />
                    Add Another Category
                  </Button>
                </div>
              )}
              
              <p className="mt-2 text-xs text-gray-500">
                You can add questions to each category later in the Manage Test section.
              </p>
            </div>

            <div className="flex items-center">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => handleFormChange('is_active', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-900">
                Make test active (users can take this test)
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Link href="/admin/tests">
                <Button type="button" variant="outline" disabled={submitting}>
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Test'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}