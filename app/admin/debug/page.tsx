"use client";

import { useState, useEffect } from "react";
import { createClientSupabase } from "@/app/supabase";

interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminDebugPage() {
  const [steps, setSteps] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string>("Initializing...");
  const [loading, setLoading] = useState(true);

  const addStep = (step: string) => {
    setSteps(prev => [...prev, `${new Date().toLocaleTimeString()}: ${step}`]);
    setCurrentStep(step);
  };

  useEffect(() => {
    runDebugChecks();
  }, []);

  async function runDebugChecks() {
    addStep("Starting debug checks...");

    try {
      // Step 1: Check environment variables
      addStep("Checking environment variables...");
      const envCheck = {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set",
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set"
      };
      setData((prev: any) => ({ ...prev, envCheck }));
      addStep(`✓ Environment variables: URL=${envCheck.url}, KEY=${envCheck.key}`);

      // Step 2: Create Supabase client
      addStep("Creating Supabase client...");
      const supabase = createClientSupabase();
      addStep("✓ Supabase client created");

      // Step 3: Check authentication with timeout
      addStep("Checking authentication...");
      
      let user: any = null;
      try {
        // Add timeout to prevent hanging
        const authPromise = supabase.auth.getUser();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Authentication check timed out after 10 seconds")), 10000)
        );
        
        const authResult = await Promise.race([authPromise, timeoutPromise]) as any;
        const { data: { user: authUser }, error: authError } = authResult;
        user = authUser;
        
        if (authError) {
          addStep(`✗ Auth error: ${authError.message}`);
          throw authError;
        }

        if (!user) {
          addStep("✗ No user found - not authenticated");
          throw new Error("Not authenticated - please log in");
        }

        addStep(`✓ Authenticated as: ${user.email}`);
        setData((prev: any) => ({ ...prev, user: { id: user.id, email: user.email } }));
      } catch (authErr) {
        // Try alternative auth check
        addStep("Trying alternative auth check via getSession...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          addStep(`✗ Session check failed: ${sessionError?.message || 'No session'}`);
          throw new Error("Authentication failed - please log in at /auth/login");
        }
        
        addStep(`✓ Session found for: ${session.user.email}`);
        user = session.user;
        setData((prev: any) => ({ ...prev, user: { id: session.user.id, email: session.user.email } }));
      }

      // Step 4: Fetch ALL categories
      addStep("Fetching all categories from database...");
      const { data: categoriesData, error: catError, count } = await supabase
        .from('categories')
        .select('*', { count: 'exact' })
        .order('name');
      
      if (catError) {
        addStep(`✗ Categories error: ${catError.message}`);
        throw catError;
      }

      addStep(`✓ Categories fetched successfully: ${count} total categories`);
      setCategories(categoriesData || []);
      setData((prev: any) => ({ 
        ...prev, 
        categoriesCount: count,
        categoriesSummary: {
          total: count,
          withDescription: categoriesData?.filter(c => c.description).length || 0,
          withoutDescription: categoriesData?.filter(c => !c.description).length || 0
        }
      }));

      // Step 5: Check user profile
      addStep("Fetching user profile...");
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        addStep(`✗ Profile error: ${profileError.message}`);
      } else {
        addStep(`✓ Profile found: is_admin=${profile?.is_admin}`);
        setData((prev: any) => ({ ...prev, profile }));
      }

      addStep("✅ All debug checks completed successfully!");

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      addStep(`❌ Fatal error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  // Test direct API call
  const testDirectAPI = async () => {
    addStep("Testing direct Supabase API call...");
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        throw new Error("Missing environment variables");
      }

      const response = await fetch(`${url}/rest/v1/categories?select=*&order=name`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });

      addStep(`Direct API response status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        addStep(`✓ Direct API successful: ${data.length} categories`);
        setData((prev: any) => ({ ...prev, directAPIResult: data }));
      } else {
        const errorText = await response.text();
        addStep(`✗ Direct API failed: ${response.statusText} - ${errorText}`);
      }
    } catch (err) {
      addStep(`✗ Direct API error: ${err}`);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin Debug Page - Categories Data</h1>
      
      {/* Current step indicator */}
      <div className="mb-4 p-3 bg-blue-100 rounded">
        <strong>Current Step:</strong> {currentStep}
        {loading && <span className="ml-2 text-sm">(Loading...)</span>}
      </div>

      {/* Steps log */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Debug Steps:</h2>
        <div className="bg-gray-100 p-4 rounded font-mono text-sm space-y-1 max-h-64 overflow-y-auto">
          {steps.map((step, index) => (
            <div key={index} className={
              step.includes('✓') ? 'text-green-600' : 
              step.includes('✗') || step.includes('❌') ? 'text-red-600' : 
              'text-gray-700'
            }>
              {step}
            </div>
          ))}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Summary data */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Summary Data:</h2>
        <div className="bg-gray-100 p-4 rounded">
          <pre className="text-sm overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>

      {/* Categories display */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">
          Categories from Database ({categories.length} total)
        </h2>
        
        {categories.length > 0 ? (
          <div className="space-y-3">
            {categories.map((category, index) => (
              <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {index + 1}. {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-gray-600 mt-1">{category.description}</p>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      <span>ID: {category.id}</span>
                      <span className="mx-2">•</span>
                      <span>Created: {new Date(category.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-100 p-4 rounded text-center text-gray-500">
            No categories found in the database
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Run Tests Again
        </button>
        <button
          onClick={testDirectAPI}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Test Direct API
        </button>
        <button
          onClick={runDebugChecks}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
}