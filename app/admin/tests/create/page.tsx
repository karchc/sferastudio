'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface TestForm {
  title: string;
  description: string;
  instructions: string;
  time_limit: number;
  category_ids: string[];
  is_active: boolean;
}

export default function CreateTestPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [form, setForm] = useState<TestForm>({
    title: '',
    description: '',
    instructions: '',
    time_limit: 60,
    category_ids: [],
    is_active: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const response = await fetch('/api/admin/categories');
      
      if (!response.ok) throw new Error('Failed to load categories');
      const data = await response.json();
      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

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
    
    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch('/api/admin/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
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

  const handleCategoryToggle = (categoryId: string) => {
    setForm(prev => ({
      ...prev,
      category_ids: prev.category_ids.includes(categoryId)
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId]
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Test</h1>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Create New Test</h1>
          <p className="text-gray-600 mt-2">Set up a new test with categories and questions</p>
        </div>
        <Link href="/admin/tests">
          <Button variant="outline">Back to Tests</Button>
        </Link>
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
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
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
                    setForm({ 
                      ...form, 
                      time_limit: value === '' ? 60 : parseInt(value) || 60
                    });
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
                onChange={(e) => setForm({ ...form, description: e.target.value })}
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
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Enter detailed instructions for test takers (e.g., time limits, question types, scoring criteria, etc.)"
              />
              <p className="mt-1 text-sm text-gray-500">
                These instructions will be shown to users before they start the test.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">
                Categories (Optional - you can add these later)
              </label>
              {categories.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800">
                    No categories available. You can{' '}
                    <Link href="/admin/categories" className="underline font-medium">
                      create categories
                    </Link>{' '}
                    first, or create the test now and add categories later.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-start space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.category_ids.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                        {category.description && (
                          <div className="text-xs text-gray-500 mt-1">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
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