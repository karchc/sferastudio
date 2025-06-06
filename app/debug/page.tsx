"use client";

import { useEffect, useState } from "react";
import { createClientSupabase } from "@/app/supabase";
import Link from "next/link";

export default function DebugPage() {
  const [status, setStatus] = useState("Loading...");
  const [results, setResults] = useState<Record<string, any>>({});
  const [error, setError] = useState<any>(null);
  
  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus("Testing Supabase connection...");
        
        // Create client
        const supabase = createClientSupabase();
        
        // Test ping
        const pingStart = performance.now();
        const pingResponse = await fetch('https://gezlcxtprkcceizadvre.supabase.co/rest/v1/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
          }
        }).catch(e => ({ ok: false, status: 'error', statusText: e.message }));
        const pingTime = performance.now() - pingStart;
        
        // Test basic query
        const queriesStart = performance.now();
        const [countResponse, tableResponse, tableListResponse] = await Promise.allSettled([
          // Count query
          supabase.from('tests').select('count'),
          
          // Table data query
          supabase.from('tests').select('id,title').limit(1),
          
          // List tables (admin level)
          fetch('https://gezlcxtprkcceizadvre.supabase.co/rest/v1/', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
            }
          })
        ]);
        const queriesTime = performance.now() - queriesStart;
        
        // Test permissions by trying a query that would require admin
        let permissionsResponse;
        try {
          permissionsResponse = await supabase.rpc('list_tables');
        } catch (e: any) {
          permissionsResponse = { success: false, error: e.message };
        }
          
        // Test our specific test ID that we're trying to load in the test page
        const testId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
        let testResponse;
        try {
          testResponse = await supabase
            .from('tests')
            .select('*')
            .eq('id', testId)
            .single();
        } catch (e: any) {
          testResponse = { success: false, error: e.message };
        }
          
        // If we have the test, try to get its questions
        let questionsResponse: any = { success: false, message: 'Test not found' };
        if (testResponse.data) {
          try {
            questionsResponse = await supabase
              .from('test_questions')
              .select('*, questions(*)')
              .eq('test_id', testId);
          } catch (e: any) {
            questionsResponse = { success: false, error: e.message };
          }
        }
        
        setResults({
          ping: {
            status: pingResponse.status || 'error',
            statusText: pingResponse.statusText || 'No response',
            time: `${Math.round(pingTime)}ms`
          },
          queries: {
            count: countResponse.status === 'fulfilled' ? countResponse.value : 'Failed',
            tableQuery: tableResponse.status === 'fulfilled' ? tableResponse.value : 'Failed',
            listTables: tableListResponse.status === 'fulfilled' ? tableListResponse.value : 'Failed',
            time: `${Math.round(queriesTime)}ms`
          },
          permissions: permissionsResponse,
          testPage: {
            testId: testId,
            test: testResponse,
            questions: questionsResponse
          }
        });
        
        setStatus('Connection test complete');
      } catch (e) {
        console.error('Debug error:', e);
        setError(e);
        setStatus('Error testing connection');
      }
    };
    
    testConnection();
  }, []);
  
  const tryAgain = () => {
    setStatus("Loading...");
    setResults({});
    setError(null);
    window.location.reload();
  };
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Supabase Connection Debug</h1>
      <p className="mb-6 text-gray-600">This page tests the connection to Supabase to diagnose any issues.</p>
      
      <div className="flex space-x-4 mb-8">
        <Link href="/test" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Go to Test Page
        </Link>
        <Link href="/direct-test" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Go to Direct Test
        </Link>
        <Link href="/debug/test-debugger" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
          Test Debugger
        </Link>
        <button onClick={tryAgain} className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200">
          Run Tests Again
        </button>
      </div>
      
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <div className="font-semibold flex items-center">
          <div className={`mr-2 h-3 w-3 rounded-full ${status === 'Connection test complete' ? 'bg-green-500' : status.includes('Error') ? 'bg-red-500' : 'bg-blue-500 animate-pulse'}`}></div>
          Status: {status}
        </div>
        <div className="mt-1 text-sm text-gray-600">
          Testing connection to: https://gezlcxtprkcceizadvre.supabase.co
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded overflow-auto">
          <h3 className="text-red-700 font-medium mb-2">Error:</h3>
          <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
      
      {Object.keys(results).length > 0 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b">
              <h2 className="font-semibold">Basic Connection Test</h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Ping Response</h3>
                  <p className="mt-1 text-sm">Status: <span className={results.ping?.status === 200 ? 'text-green-600' : 'text-red-600'}>{results.ping?.status || 'N/A'}</span></p>
                  <p className="text-sm">Message: {results.ping?.statusText || 'N/A'}</p>
                  <p className="text-sm">Time: {results.ping?.time || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="font-medium">Query Response Time</h3>
                  <p className="text-sm">Total time: {results.queries?.time || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b">
              <h2 className="font-semibold">Data Access</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Tests Table Count</h3>
                  <pre className="mt-1 text-sm bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(results.queries?.count, null, 2)}</pre>
                </div>
                
                <div>
                  <h3 className="font-medium">Tests Table Sample</h3>
                  <pre className="mt-1 text-sm bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(results.queries?.tableQuery, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b">
              <h2 className="font-semibold">Test Page Specific Data</h2>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">JavaScript Basics Test (ID: {results.testPage?.testId})</h3>
                  <pre className="mt-1 text-sm bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(results.testPage?.test, null, 2)}</pre>
                </div>
                
                <div>
                  <h3 className="font-medium">Test Questions</h3>
                  <pre className="mt-1 text-sm bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(results.testPage?.questions, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}