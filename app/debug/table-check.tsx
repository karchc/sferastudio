'use client';
import { useState, useEffect } from 'react';
import { createDirectSupabase } from '@/app/lib/direct-supabase';

export default function TableCheck() {
  const [loading, setLoading] = useState(true);
  const [tables, setTables] = useState<string[]>([]);
  const [testQuestionCount, setTestQuestionCount] = useState<number | null>(null);
  const [testEngineQuestionCount, setTestEngineQuestionCount] = useState<number | null>(null);
  const [answerCount, setAnswerCount] = useState<number | null>(null);
  const [testEngineAnswerCount, setTestEngineAnswerCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkTables() {
      setLoading(true);
      setError(null);
      
      try {
        const supabase = createDirectSupabase();
        
        // List all tables
        const { data: tablesData, error: tablesError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .order('table_name');
          
        if (tablesError) {
          throw tablesError;
        }
        
        if (tablesData) {
          setTables(tablesData.map(t => t.table_name));
        }
        
        // Check counts in both possible table names
        let questionsResult;
        try {
          questionsResult = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true });
        } catch (e) {
          questionsResult = { count: null, error: null };
        }
        const { count: questionsCount, error: questionsError } = questionsResult;
          
        setTestQuestionCount(questionsCount);
        
        let testEngineQuestionsResult;
        try {
          testEngineQuestionsResult = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true });
        } catch (e) {
          testEngineQuestionsResult = { count: null, error: null };
        }
        const { count: testEngineQuestionsCount, error: testEngineQuestionsError } = testEngineQuestionsResult;
          
        setTestEngineQuestionCount(testEngineQuestionsCount);
        
        let answersResult;
        try {
          answersResult = await supabase
            .from('answers')
            .select('*', { count: 'exact', head: true });
        } catch (e) {
          answersResult = { count: null, error: null };
        }
        const { count: answersCount, error: answersError } = answersResult;
          
        setAnswerCount(answersCount);
        
        let testEngineAnswersResult;
        try {
          testEngineAnswersResult = await supabase
            .from('answers')
            .select('*', { count: 'exact', head: true });
        } catch (e) {
          testEngineAnswersResult = { count: null, error: null };
        }
        const { count: testEngineAnswersCount, error: testEngineAnswersError } = testEngineAnswersResult;
          
        setTestEngineAnswerCount(testEngineAnswersCount);
      } catch (err) {
        console.error('Error checking tables:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    
    checkTables();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Database Table Check</h1>
      
      {loading && <p className="text-blue-600">Loading table information...</p>}
      {error && <div className="bg-red-100 p-4 rounded mb-4">Error: {error}</div>}
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">All Tables</h2>
        {tables.length > 0 ? (
          <ul className="bg-gray-100 p-4 rounded">
            {tables.map(table => (
              <li key={table} className="mb-1">{table}</li>
            ))}
          </ul>
        ) : (
          <p>No tables found.</p>
        )}
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Questions Table Check</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-medium mb-2">questions</h3>
            {testQuestionCount !== null ? (
              <p className="text-lg">{testQuestionCount} records</p>
            ) : (
              <p className="text-red-600">Table doesn't exist</p>
            )}
          </div>
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-medium mb-2">questions</h3>
            {testEngineQuestionCount !== null ? (
              <p className="text-lg">{testEngineQuestionCount} records</p>
            ) : (
              <p className="text-red-600">Table doesn't exist</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Answers Table Check</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-medium mb-2">answers</h3>
            {answerCount !== null ? (
              <p className="text-lg">{answerCount} records</p>
            ) : (
              <p className="text-red-600">Table doesn't exist</p>
            )}
          </div>
          <div className="bg-gray-100 p-4 rounded">
            <h3 className="font-medium mb-2">answers</h3>
            {testEngineAnswerCount !== null ? (
              <p className="text-lg">{testEngineAnswerCount} records</p>
            ) : (
              <p className="text-red-600">Table doesn't exist</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-100 p-4 rounded">
        <h2 className="text-xl font-semibold mb-2">Recommendation</h2>
        <p>
          Based on the table counts above, you should use the table name with data.
          If both have data, you should consolidate to one table.
        </p>
      </div>
    </div>
  );
}