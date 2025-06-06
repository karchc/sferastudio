"use client";

import { useEffect, useState } from 'react';
import { fetchCategories } from '@/app/lib/supabase-categories';
import { fetchQuestions } from '@/app/lib/supabase-questions';
import { fetchTests } from '@/app/lib/supabase-tests';

export default function TestAdminData() {
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all data types
        const categoriesData = await fetchCategories();
        const questionsData = await fetchQuestions();
        const testsData = await fetchTests();
        
        setCategories(categoriesData);
        setQuestions(questionsData);
        setTests(testsData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-6">Loading data...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Admin Data Test</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Categories ({categories.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.map(category => (
                <tr key={category.id}>
                  <td className="px-3 py-2 font-mono text-xs">{category.id}</td>
                  <td className="px-3 py-2">{category.name}</td>
                  <td className="px-3 py-2">{category.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Questions ({questions.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Text</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {questions.map(question => (
                <tr key={question.id}>
                  <td className="px-3 py-2 font-mono text-xs">{question.id}</td>
                  <td className="px-3 py-2">{question.text.substring(0, 50)}...</td>
                  <td className="px-3 py-2">{question.type}</td>
                  <td className="px-3 py-2 font-mono text-xs">{question.categoryId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tests ({tests.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left">ID</th>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2 text-left">Time Limit</th>
                <th className="px-3 py-2 text-left">Category</th>
                <th className="px-3 py-2 text-left">Questions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tests.map(test => (
                <tr key={test.id}>
                  <td className="px-3 py-2 font-mono text-xs">{test.id}</td>
                  <td className="px-3 py-2">{test.title}</td>
                  <td className="px-3 py-2">{test.timeLimit}s</td>
                  <td className="px-3 py-2 font-mono text-xs">{test.categoryId}</td>
                  <td className="px-3 py-2">{test.questions?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-8">
        <p className="text-sm text-gray-500">
          This page confirms that the admin section is working with real Supabase data.
        </p>
      </div>
    </div>
  );
}