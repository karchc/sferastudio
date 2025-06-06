"use client";

import { useEffect, useState } from "react";
import { createClientSupabase } from "@/app/supabase";

export default function BasicTestPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testData, setTestData] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const supabase = createClientSupabase();
  
  useEffect(() => {
    async function fetchData() {
      try {
        // Test connection
        console.log('Testing Supabase connection...');
        
        // Get test
        const testId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
        console.log('Fetching test with ID:', testId);
        
        const { data: testData, error: testError } = await supabase
          .from('tests')
          .select('*')
          .eq('id', testId)
          .single();
          
        if (testError) {
          console.error('Error fetching test:', testError);
          setError(`Failed to fetch test: ${testError.message}`);
          setLoading(false);
          return;
        }
        
        console.log('Test data:', testData);
        setTestData(testData);
        
        // Get questions
        const { data: testQuestions, error: questionsError } = await supabase
          .from('test_questions')
          .select('*, questions(*)')
          .eq('test_id', testId);
          
        if (questionsError) {
          console.error('Error fetching questions:', questionsError);
          setError(`Failed to fetch questions: ${questionsError.message}`);
          setLoading(false);
          return;
        }
        
        console.log('Questions:', testQuestions);
        setQuestions(testQuestions);
        setLoading(false);
      } catch (err: any) {
        console.error('Unexpected error:', err);
        setError(`Unexpected error: ${err.message}`);
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <div className="p-10">
        <h1 className="text-2xl mb-4">Loading Test Data...</h1>
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-10">
        <h1 className="text-2xl mb-4 text-red-500">Error</h1>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="p-10">
      <h1 className="text-2xl mb-4">{testData?.title || 'Test'}</h1>
      
      <div className="mb-6">
        <h2 className="text-xl mb-2">Test Details</h2>
        <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(testData, null, 2)}</pre>
      </div>
      
      <div>
        <h2 className="text-xl mb-2">Questions ({questions.length})</h2>
        <div className="space-y-4">
          {questions.map((tq) => (
            <div key={tq.id} className="border p-4 rounded">
              <p><strong>Position:</strong> {tq.position}</p>
              <p><strong>Question:</strong> {tq.questions?.text}</p>
              <p><strong>Type:</strong> {tq.questions?.type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}