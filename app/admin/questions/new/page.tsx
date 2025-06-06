'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionForm } from '@/app/components/admin/QuestionFormEnhanced';
import { Category, QuestionFormData } from '@/app/lib/types';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';

export default function NewQuestionPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

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
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(formData: QuestionFormData) {
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create question');
      }
      
      // Redirect back to questions list
      router.push('/admin/questions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create question');
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Create New Question</h2>
        <Link href="/admin/questions" passHref>
          <Button variant="outline">Back to Questions</Button>
        </Link>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {categories.length === 0 ? (
        <div className="p-4 bg-yellow-100 text-yellow-700 rounded-md">
          <p>You need to create categories before creating questions.</p>
          <Link href="/admin/categories" className="text-blue-600 hover:underline">
            Go to Categories
          </Link>
        </div>
      ) : (
        <QuestionForm
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/questions')}
          isSubmitting={submitting}
        />
      )}
    </div>
  );
}