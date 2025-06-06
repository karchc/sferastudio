"use client";

import { useState, useEffect } from "react";
import { createDirectSupabase } from "@/app/lib/direct-supabase";
import { createClientSupabase } from "@/app/supabase";
import dynamic from "next/dynamic";

// Dynamically import the MCP check component with no SSR
// This prevents errors if MCP functions aren't available
const MCPCheck = dynamic(() => import("./mcp-check"), { ssr: false });

export default function CheckPage() {
  const [connectionStatus, setConnectionStatus] = useState<{
    direct: { status: string; time?: number; error?: string };
    client: { status: string; time?: number; error?: string };
    url: string;
    anon_key: string;
    tables: { name: string; count: number }[];
  }>({
    direct: { status: "pending" },
    client: { status: "pending" },
    url: "",
    anon_key: "",
    tables: [],
  });

  useEffect(() => {
    async function checkSupabaseConnection() {
      // Get the Supabase URL and anon key from environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

      // Create both types of clients
      const directClient = createDirectSupabase();
      const regularClient = createClientSupabase();

      // Update URL and anon key display (mask the anon key for security)
      setConnectionStatus(prev => ({
        ...prev,
        url: supabaseUrl,
        anon_key: supabaseAnonKey ? 
          `${supabaseAnonKey.substring(0, 8)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 8)}` :
          "Not found"
      }));

      // Test the direct client
      try {
        console.log("Testing direct Supabase client...");
        const startTime = performance.now();
        const { data, error } = await directClient.from('tests').select('count').single();
        const endTime = performance.now();
        
        if (error) {
          setConnectionStatus(prev => ({
            ...prev,
            direct: { 
              status: "error", 
              error: error.message,
              time: endTime - startTime
            }
          }));
        } else {
          setConnectionStatus(prev => ({
            ...prev,
            direct: { 
              status: "connected", 
              time: endTime - startTime
            }
          }));
        }
      } catch (error) {
        setConnectionStatus(prev => ({
          ...prev,
          direct: { 
            status: "error", 
            error: error instanceof Error ? error.message : "Unknown error" 
          }
        }));
      }

      // Test the regular client
      try {
        console.log("Testing regular Supabase client...");
        const startTime = performance.now();
        const { data, error } = await regularClient.from('tests').select('count').single();
        const endTime = performance.now();
        
        if (error) {
          setConnectionStatus(prev => ({
            ...prev,
            client: { 
              status: "error", 
              error: error.message,
              time: endTime - startTime
            }
          }));
        } else {
          setConnectionStatus(prev => ({
            ...prev,
            client: { 
              status: "connected",
              time: endTime - startTime
            }
          }));
        }
      } catch (error) {
        setConnectionStatus(prev => ({
          ...prev,
          client: { 
            status: "error", 
            error: error instanceof Error ? error.message : "Unknown error" 
          }
        }));
      }

      // Get table information if we have a successful connection
      try {
        const tables = [
          'tests',
          'questions',
          'answers',
          'test_questions',
          'categories',
          'users',
          'profiles'
        ];

        const tableData = await Promise.all(
          tables.map(async (tableName) => {
            try {
              const { count, error } = await directClient
                .from(tableName)
                .select('*', { count: 'exact', head: true });
              
              return {
                name: tableName,
                count: error ? -1 : (count || 0)
              };
            } catch (e) {
              return { name: tableName, count: -1 };
            }
          })
        );

        setConnectionStatus(prev => ({
          ...prev,
          tables: tableData
        }));
      } catch (error) {
        console.error("Error fetching table information:", error);
      }
    }

    checkSupabaseConnection();
  }, []);

  // Helper function to get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "connected":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-yellow-600";
    }
  };

  // Helper function to get status badge color
  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800 border-green-300";
      case "error":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
  };

  return (
    <main className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Supabase Connection Status</h1>
          <a href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
            ← Back to Home
          </a>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-4">
              <h3 className="font-medium text-gray-700">Supabase URL</h3>
              <p className="mt-2 text-sm break-all">{connectionStatus.url || "Not available"}</p>
            </div>
            <div className="border rounded p-4">
              <h3 className="font-medium text-gray-700">Anon Key (Partial)</h3>
              <p className="mt-2 text-sm break-all">{connectionStatus.anon_key}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded p-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-700">Direct Supabase Client</h3>
                <span 
                  className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(connectionStatus.direct.status)}`}
                >
                  {connectionStatus.direct.status}
                </span>
              </div>
              {connectionStatus.direct.time && (
                <p className="mt-2 text-sm">Response time: {connectionStatus.direct.time.toFixed(2)}ms</p>
              )}
              {connectionStatus.direct.error && (
                <p className="mt-2 text-sm text-red-600">Error: {connectionStatus.direct.error}</p>
              )}
            </div>
            
            <div className="border rounded p-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-700">Regular Supabase Client</h3>
                <span 
                  className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeColor(connectionStatus.client.status)}`}
                >
                  {connectionStatus.client.status}
                </span>
              </div>
              {connectionStatus.client.time && (
                <p className="mt-2 text-sm">Response time: {connectionStatus.client.time.toFixed(2)}ms</p>
              )}
              {connectionStatus.client.error && (
                <p className="mt-2 text-sm text-red-600">Error: {connectionStatus.client.error}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Table Information</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Table Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Row Count
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {connectionStatus.tables.map((table) => (
                  <tr key={table.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {table.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {table.count >= 0 ? table.count : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span 
                        className={`px-2 py-1 text-xs font-medium rounded-full border ${
                          table.count >= 0 
                            ? "bg-green-100 text-green-800 border-green-300" 
                            : "bg-red-100 text-red-800 border-red-300"
                        }`}
                      >
                        {table.count >= 0 ? "Accessible" : "Inaccessible"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="flex justify-center space-x-4 mt-8">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Refresh Connection Status
          </button>
          
          <a 
            href="/debug/test-debugger"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors"
          >
            Open Test Debugger
          </a>
        </div>
        {/* MCP Supabase Check */}
        <MCPCheck />
      </div>
    </main>
  );
}