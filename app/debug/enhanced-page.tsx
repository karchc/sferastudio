"use client";

import { useEffect, useState } from "react";
import { createClientSupabase } from "@/app/supabase";
import { createDirectSupabase } from "@/app/lib/direct-supabase";
import Link from "next/link";
import { fetchTestDataOptimized } from "../lib/optimized-test-fetcher";

// Enhanced debug page with more comprehensive testing
export default function EnhancedDebugPage() {
  const [status, setStatus] = useState("Loading...");
  const [results, setResults] = useState<Record<string, any>>({});
  const [error, setError] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'connection'|'schema'|'permissions'|'test'>('connection');
  
  // Get both client types for comparison
  const directClient = createDirectSupabase();
  const supabase = createClientSupabase();
  
  // Test ID to check
  const testId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  
  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        setStatus("Running comprehensive diagnostics...");
        
        // 1. Basic connection test
        const connectionResults = await testConnection();
        
        // 2. Schema verification
        const schemaResults = await verifySchema();
        
        // 3. Permissions test
        const permissionsResults = await testPermissions();
        
        // 4. Test page specific functionality
        const testPageResults = await testTestPage();
        
        setResults({
          connection: connectionResults,
          schema: schemaResults,
          permissions: permissionsResults,
          testPage: testPageResults
        });
        
        setStatus('Diagnostics complete');
      } catch (e) {
        console.error('Debug error:', e);
        setError(e);
        setStatus('Error running diagnostics');
      }
    };
    
    runDiagnostics();
  }, []);
  
  // Test basic connection to Supabase
  const testConnection = async () => {
    console.log('Testing Supabase connection...');
    
    // Test ping
    const pingStart = Date.now();
    const pingResponse = await fetch('https://gezlcxtprkcceizadvre.supabase.co/rest/v1/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
      }
    }).catch(e => ({ ok: false, status: 'error', statusText: e.message }));
    const pingTime = Date.now() - pingStart;
    
    // Compare both clients
    const [directPing, regularPing] = await Promise.all([
      directClient.from('tests').select('count'),
      supabase.from('tests').select('count')
    ]);
    
    return {
      ping: {
        status: pingResponse.status || 'error',
        statusText: pingResponse.statusText || 'No response',
        time: `${Math.round(pingTime)}ms`
      },
      directClient: {
        result: directPing,
        error: directPing.error ? directPing.error.message : null
      },
      regularClient: {
        result: regularPing,
        error: regularPing.error ? regularPing.error.message : null
      },
      clientComparison: {
        bothWork: !directPing.error && !regularPing.error,
        onlyDirectWorks: !directPing.error && regularPing.error,
        onlyRegularWorks: directPing.error && !regularPing.error,
        neitherWorks: directPing.error && regularPing.error
      }
    };
  };
  
  // Verify table schema
  const verifySchema = async () => {
    console.log('Verifying database schema...');
    
    // List of tables we expect to exist
    const expectedTables = [
      'tests',
      'questions',
      'test_questions',
      'answers',
      'match_items',
      'sequence_items',
      'drag_drop_items',
      'test_sessions',
      'user_answers',
      'selected_answers'
    ];
    
    const tableResults: Record<string, any> = {};
    
    // Check each table
    for (const table of expectedTables) {
      const { count, error } = await directClient
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      tableResults[table] = {
        exists: !error,
        count: count || 0,
        error: error ? error.message : null
      };
    }
    
    return {
      expectedTables,
      tableResults,
      summary: {
        allTablesExist: Object.values(tableResults).every((result: any) => result.exists),
        missingTables: Object.entries(tableResults)
          .filter(([_, result]: [string, any]) => !result.exists)
          .map(([table]) => table)
      }
    };
  };
  
  // Test permissions for different operations
  const testPermissions = async () => {
    console.log('Testing permissions...');
    
    // Attempt read operations on all tables
    const readResults: Record<string, any> = {};
    const tables = [
      'tests',
      'questions',
      'test_questions',
      'answers',
      'match_items',
      'sequence_items',
      'drag_drop_items'
    ];
    
    for (const table of tables) {
      const { data, error } = await directClient
        .from(table)
        .select('*')
        .limit(1);
        
      readResults[table] = {
        canRead: !error,
        error: error ? error.message : null
      };
    }
    
    // Test write permissions on test_sessions (should be allowed for logged-in users)
    const writeSessionResult = await directClient
      .from('test_sessions')
      .insert({
        test_id: testId,
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy ID
        status: 'in_progress',
        start_time: new Date().toISOString()
      })
      .select();
      
    // Delete the test session if it was created
    if (writeSessionResult.data && writeSessionResult.data.length > 0) {
      await directClient
        .from('test_sessions')
        .delete()
        .eq('id', writeSessionResult.data[0].id);
    }
    
    return {
      readPermissions: readResults,
      writePermissions: {
        testSessions: {
          canWrite: !writeSessionResult.error,
          error: writeSessionResult.error ? writeSessionResult.error.message : null
        }
      },
      summary: {
        canReadAllTables: Object.values(readResults).every((result: any) => result.canRead),
        canWriteTestSessions: !writeSessionResult.error
      }
    };
  };
  
  // Test functionality specific to the test page
  const testTestPage = async () => {
    console.log('Testing test page functionality...');
    
    // Check for specific test by ID
    const { data: testData, error: testError } = await directClient
      .from('tests')
      .select('*')
      .eq('id', testId)
      .single();
      
    // Check if questions exist for this test
    const { data: testQuestions, error: questionsError } = await directClient
      .from('test_questions')
      .select('*, questions(*)')
      .eq('test_id', testId);
      
    // Test the optimized fetcher
    let optimizedResult = null;
    let standardResult = null;
    let performance = {};
    
    try {
      // Time the optimized fetcher
      const optimizedStart = Date.now();
      optimizedResult = await fetchTestDataOptimized(testId);
      const optimizedTime = Date.now() - optimizedStart;
      
      // Time the standard approach for comparison
      const standardStart = Date.now();
      // Simulated standard multi-query approach from test/[id]/page.tsx
      const { data: test } = await directClient.from('tests').select('*, categories(*)').eq('id', testId).single();
      const { data: questions } = await directClient.from('test_questions').select('*, questions(*)').eq('test_id', testId);
      
      // Fetch answers for each question (this is what we're optimizing)
      for (const tq of questions || []) {
        if (tq.questions) {
          const questionType = tq.questions.type;
          if (['multiple-choice', 'single-choice', 'true-false'].includes(questionType)) {
            await directClient.from('answers').select('*').eq('question_id', tq.questions.id);
          } else if (questionType === 'matching') {
            await directClient.from('match_items').select('*').eq('question_id', tq.questions.id);
          } else if (questionType === 'sequence') {
            await directClient.from('sequence_items').select('*').eq('question_id', tq.questions.id);
          } else if (questionType === 'drag-drop') {
            await directClient.from('drag_drop_items').select('*').eq('question_id', tq.questions.id);
          }
        }
      }
      
      const standardTime = Date.now() - standardStart;
      
      standardResult = {
        test,
        questionCount: questions?.length || 0
      };
      
      performance = {
        optimizedTime: `${Math.round(optimizedTime)}ms`,
        standardTime: `${Math.round(standardTime)}ms`,
        improvement: standardTime > 0 ? `${Math.round((standardTime - optimizedTime) / standardTime * 100)}%` : 'N/A'
      };
    } catch (e) {
      console.error('Error testing fetchers:', e);
    }
      
    return {
      testExists: !testError && testData !== null,
      testData: testData,
      questionsExist: !questionsError && Array.isArray(testQuestions) && testQuestions.length > 0,
      questionCount: testQuestions?.length || 0,
      optimizedFetcher: {
        works: optimizedResult !== null,
        result: optimizedResult?.testData ? {
          id: optimizedResult.testData.id,
          title: optimizedResult.testData.title,
          questionCount: optimizedResult.testData.questions.length
        } : null,
        performance
      }
    };
  };
  
  const tryAgain = () => {
    setStatus("Loading...");
    setResults({});
    setError(null);
    window.location.reload();
  };
  
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Enhanced Supabase Diagnostics</h1>
      <p className="mb-6 text-gray-600">This tool provides comprehensive diagnostics for the Test Engine application.</p>
      
      <div className="flex space-x-4 mb-8">
        <Link href="/test" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Go to Test Page
        </Link>
        <Link href="/direct-test" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Go to Direct Test
        </Link>
        <button onClick={tryAgain} className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
          Run Tests Again
        </button>
      </div>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <div className="font-semibold flex items-center">
          <div className={`mr-2 h-3 w-3 rounded-full ${status === 'Diagnostics complete' ? 'bg-green-500' : status.includes('Error') ? 'bg-red-500' : 'bg-blue-500 animate-pulse'}`}></div>
          Status: {status}
        </div>
        <div className="mt-1 text-sm text-gray-600">
          Testing connection to: https://gezlcxtprkcceizadvre.supabase.co
        </div>
        
        <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-sm font-medium text-yellow-800">Fix for Test Page Timeout:</p>
          <ol className="text-sm text-yellow-700 list-decimal pl-4 mt-1 space-y-1">
            <li>Table name issues have been fixed (using correct table names: questions, answers)</li>
            <li>Optimized data fetching with batch queries (significantly faster loading)</li>
            <li>Added proper error handling and timeout prevention</li>
            <li>Try the test page now for a much faster experience</li>
          </ol>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded overflow-auto">
          <h3 className="text-red-700 font-medium mb-2">Error:</h3>
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
      
      {Object.keys(results).length > 0 && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex border-b">
              <button 
                onClick={() => setActiveTab('connection')} 
                className={`px-4 py-2 font-medium ${activeTab === 'connection' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                Connection Test
              </button>
              <button 
                onClick={() => setActiveTab('schema')} 
                className={`px-4 py-2 font-medium ${activeTab === 'schema' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                Schema Verification
              </button>
              <button 
                onClick={() => setActiveTab('permissions')} 
                className={`px-4 py-2 font-medium ${activeTab === 'permissions' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                Permissions
              </button>
              <button 
                onClick={() => setActiveTab('test')} 
                className={`px-4 py-2 font-medium ${activeTab === 'test' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                Test Page
              </button>
            </div>
            
            <div className="p-4">
              {activeTab === 'connection' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Connection Test Results</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <h4 className="font-medium mb-2">Ping Response</h4>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-sm">Status: <span className={results.connection?.ping?.status === 200 ? 'text-green-600' : 'text-red-600'}>{results.connection?.ping?.status || 'N/A'}</span></p>
                        <p className="text-sm">Message: {results.connection?.ping?.statusText || 'N/A'}</p>
                        <p className="text-sm">Time: {results.connection?.ping?.time || 'N/A'}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Client Comparison</h4>
                      <div className="bg-gray-50 p-2 rounded">
                        <p className="text-sm">Direct Client: <span className={!results.connection?.directClient?.error ? 'text-green-600' : 'text-red-600'}>{!results.connection?.directClient?.error ? 'Working' : 'Error'}</span></p>
                        <p className="text-sm">Regular Client: <span className={!results.connection?.regularClient?.error ? 'text-green-600' : 'text-red-600'}>{!results.connection?.regularClient?.error ? 'Working' : 'Error'}</span></p>
                        
                        {results.connection?.clientComparison && (
                          <div className="mt-2 text-sm">
                            <p><strong>Summary:</strong> {
                              results.connection.clientComparison.bothWork ? '✅ Both clients working' :
                              results.connection.clientComparison.onlyDirectWorks ? '⚠️ Only direct client working' :
                              results.connection.clientComparison.onlyRegularWorks ? '⚠️ Only regular client working' :
                              '❌ Neither client working'
                            }</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <h4 className="font-medium mb-2">Client Error Details (if any)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Direct Client Error:</p>
                      <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto h-24">
                        {results.connection?.directClient?.error || 'No errors'}
                      </pre>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Regular Client Error:</p>
                      <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-auto h-24">
                        {results.connection?.regularClient?.error || 'No errors'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'schema' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Schema Verification Results</h3>
                  
                  <div className="mb-4">
                    <div className={`p-3 rounded ${results.schema?.summary?.allTablesExist ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <p className="font-medium">
                        {results.schema?.summary?.allTablesExist 
                          ? '✅ All expected tables exist in the database' 
                          : `❌ Missing tables: ${results.schema?.summary?.missingTables?.join(', ')}`}
                      </p>
                    </div>
                  </div>
                  
                  <h4 className="font-medium mb-2">Table Status</h4>
                  <div className="overflow-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Table Name</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Exists</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row Count</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {results.schema?.expectedTables?.map((table: string) => (
                          <tr key={table}>
                            <td className="px-4 py-2 text-sm">{table}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={results.schema?.tableResults?.[table]?.exists ? 'text-green-600' : 'text-red-600'}>
                                {results.schema?.tableResults?.[table]?.exists ? '✅' : '❌'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm">{results.schema?.tableResults?.[table]?.count || 0}</td>
                            <td className="px-4 py-2 text-sm text-red-600">{results.schema?.tableResults?.[table]?.error || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              {activeTab === 'permissions' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Permissions Test Results</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className={`p-3 rounded ${results.permissions?.summary?.canReadAllTables ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                      <p className="font-medium">
                        {results.permissions?.summary?.canReadAllTables 
                          ? '✅ Read access to all tables' 
                          : '⚠️ Limited read access'}
                      </p>
                    </div>
                    
                    <div className={`p-3 rounded ${results.permissions?.summary?.canWriteTestSessions ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <p className="font-medium">
                        {results.permissions?.summary?.canWriteTestSessions 
                          ? '✅ Can write to test_sessions' 
                          : '❌ Cannot write to test_sessions'}
                      </p>
                    </div>
                  </div>
                  
                  <h4 className="font-medium mb-2">Read Permissions</h4>
                  <div className="overflow-auto mb-6">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Table</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Can Read</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {results.permissions?.readPermissions && Object.entries(results.permissions.readPermissions).map(([table, result]) => (
                          <tr key={table}>
                            <td className="px-4 py-2 text-sm">{table}</td>
                            <td className="px-4 py-2 text-sm">
                              <span className={(result as any).canRead ? 'text-green-600' : 'text-red-600'}>
                                {(result as any).canRead ? '✅' : '❌'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-red-600">{(result as any).error || ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <h4 className="font-medium mb-2">Write Permissions</h4>
                  <div className="mb-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm">
                      <strong>test_sessions:</strong> {results.permissions?.writePermissions?.testSessions?.canWrite ? 'Writable ✅' : 'Not writable ❌'}
                    </p>
                    {results.permissions?.writePermissions?.testSessions?.error && (
                      <p className="text-sm text-red-600 mt-1">
                        Error: {results.permissions?.writePermissions?.testSessions?.error}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              {activeTab === 'test' && (
                <div>
                  <h3 className="font-semibold text-lg mb-4">Test Page Functionality</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className={`p-3 rounded ${results.testPage?.testExists ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <p className="font-medium">
                        {results.testPage?.testExists 
                          ? `✅ Test found (ID: ${testId})` 
                          : `❌ Test not found (ID: ${testId})`}
                      </p>
                    </div>
                    
                    <div className={`p-3 rounded ${results.testPage?.questionsExist ? 'bg-green-50 text-green-800' : 'bg-yellow-50 text-yellow-800'}`}>
                      <p className="font-medium">
                        {results.testPage?.questionsExist 
                          ? `✅ Questions found (${results.testPage?.questionCount} questions)` 
                          : '⚠️ No questions found for this test'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Test Details</h4>
                    {results.testPage?.testExists ? (
                      <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-40">
                        {JSON.stringify(results.testPage?.testData, null, 2)}
                      </pre>
                    ) : (
                      <p className="text-sm text-gray-600">No test data available</p>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">Optimized Fetcher</h4>
                    <div className={`p-3 rounded mb-3 ${results.testPage?.optimizedFetcher?.works ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      <p className="font-medium">
                        {results.testPage?.optimizedFetcher?.works 
                          ? '✅ Optimized fetcher working correctly' 
                          : '❌ Optimized fetcher failed'}
                      </p>
                    </div>
                    
                    {results.testPage?.optimizedFetcher?.performance && (
                      <div className="bg-gray-50 p-3 rounded mb-3">
                        <h5 className="font-medium mb-1">Performance Comparison</h5>
                        <p className="text-sm">Optimized time: {results.testPage?.optimizedFetcher?.performance.optimizedTime}</p>
                        <p className="text-sm">Standard time: {results.testPage?.optimizedFetcher?.performance.standardTime}</p>
                        <p className="text-sm font-medium text-green-700">
                          Improvement: {results.testPage?.optimizedFetcher?.performance.improvement}
                        </p>
                      </div>
                    )}
                    
                    {results.testPage?.optimizedFetcher?.result && (
                      <div className="bg-gray-50 p-3 rounded">
                        <h5 className="font-medium mb-1">Fetched Test Data</h5>
                        <p className="text-sm">ID: {results.testPage?.optimizedFetcher?.result.id}</p>
                        <p className="text-sm">Title: {results.testPage?.optimizedFetcher?.result.title}</p>
                        <p className="text-sm">Questions: {results.testPage?.optimizedFetcher?.result.questionCount}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}