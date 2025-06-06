'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { QuestionForm } from '@/app/components/admin/QuestionFormEnhanced';
import { Category, Question, QuestionFormData } from '@/app/lib/types';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';

export default function EditQuestionPage() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const questionId = params.id as string;

  useEffect(() => {
    if (questionId) {
      loadData();
    }
  }, [questionId]);

  async function loadData() {
    try {
      // Load question and categories in parallel
      const [questionRes, categoriesRes] = await Promise.all([
        fetch(`/api/admin/questions/${questionId}`),
        fetch('/api/admin/categories')
      ]);

      if (!questionRes.ok || !categoriesRes.ok) {
        throw new Error('Failed to load data');
      }

      const questionData = await questionRes.json();
      const categoriesData = await categoriesRes.json();
      
      if (!questionData) {
        throw new Error('Question not found');
      }
      
      setQuestion(questionData);
      setCategories(categoriesData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(formData: QuestionFormData) {
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update question');
      }
      
      // Redirect back to questions list
      router.push('/admin/questions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update question');
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!question) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          Question not found
        </div>
        <Link href="/admin/questions" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Questions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Edit Question</h2>
        <Link href="/admin/questions" passHref>
          <Button variant="outline">Back to Questions</Button>
        </Link>
      </div>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <QuestionForm
        initialData={question}
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={() => router.push('/admin/questions')}
        isSubmitting={submitting}
      />
    </div>
  );
}