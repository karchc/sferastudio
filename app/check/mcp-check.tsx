"use client";

import { useState, useEffect } from "react";
import { mcp__supabase__list_organizations, isMCPSupabaseAvailable } from "@/app/lib/mcp-supabase";

export default function MCPCheck() {
  const [mcpStatus, setMcpStatus] = useState<{
    organizations: any[];
    projects: any[];
    isLoading: boolean;
    error: string | null;
  }>({
    organizations: [],
    projects: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function checkMCPConnection() {
      try {
        // Check for MCP Supabase functions
        if (!isMCPSupabaseAvailable()) {
          setMcpStatus({
            organizations: [],
            projects: [],
            isLoading: false,
            error: "MCP Supabase functions not available",
          });
          return;
        }

        // Attempt to list organizations
        try {
          const organizations = await mcp__supabase__list_organizations();
          
          setMcpStatus(prev => ({
            ...prev,
            organizations: organizations || [],
            isLoading: false,
          }));
        } catch (error) {
          setMcpStatus({
            organizations: [],
            projects: [],
            isLoading: false,
            error: error instanceof Error ? error.message : "Error listing organizations",
          });
        }
      } catch (error) {
        setMcpStatus({
          organizations: [],
          projects: [],
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error checking MCP",
        });
      }
    }

    checkMCPConnection();
  }, []);

  if (mcpStatus.isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">MCP Supabase Status</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          <span className="ml-3">Checking MCP Supabase connection...</span>
        </div>
      </div>
    );
  }

  if (mcpStatus.error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">MCP Supabase Status</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">MCP Supabase Connection Failed</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{mcpStatus.error}</p>
                <p className="mt-2">Make sure you're running the application with the MCP CLI.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4">MCP Supabase Status</h2>
      
      {mcpStatus.organizations.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No Organizations Found</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>MCP Supabase is available, but no organizations were found.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">MCP Supabase Connected</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Successfully connected to MCP Supabase.</p>
                </div>
              </div>
            </div>
          </div>
          
          <h3 className="font-medium text-gray-700 mb-3">Available Organizations</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mcpStatus.organizations.map((org) => (
                  <tr key={org.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {org.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {org.name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}