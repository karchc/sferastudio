"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { ConfirmationModal } from "@/app/components/ui/confirmation-modal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BulkUploadModal from "@/app/components/admin/BulkUploadModal";

interface Test {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  time_limit: number;
  category_ids?: string[];
  categories?: Array<{ id: string; name: string; }>;
  is_active?: boolean;
  is_archived?: boolean;
  created_at?: string;
  question_count?: number;
  price?: number;
  currency?: string;
  is_free?: boolean;
  tag?: string;
  feature?: boolean;
}

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [managingTestId, setManagingTestId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);
  const [syncingWebflow, setSyncingWebflow] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadTests();
  }, []);

  async function loadTests() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/tests');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch tests: ${response.status}`);
      }

      const testsData = await response.json();
      setTests(testsData);
    } catch (err) {
      console.error('Error loading tests:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tests');
    } finally {
      setLoading(false);
    }
  }

  async function deleteTest(testId: string) {
    try {
      setDeletingId(testId);
      
      const response = await fetch(`/api/admin/tests/${testId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete test');
      }

      // Remove test from state
      setTests(tests.filter(test => test.id !== testId));
    } catch (err) {
      console.error('Error deleting test:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete test');
    } finally {
      setDeletingId(null);
    }
  }

  const handleManageTest = (testId: string) => {
    setManagingTestId(testId);
    router.push(`/admin/tests/${testId}/manage`);
  };

  const downloadBlankTemplate = () => {
    // Open the export template endpoint in a new window to trigger download
    window.open('/api/admin/tests/export-template', '_blank');
  };

  const syncToWebflow = async () => {
    try {
      setSyncingWebflow(true);
      setSyncResult(null);
      setError(null);

      const response = await fetch('/api/admin/sync-webflow', {
        method: 'POST',
      });

      const result = await response.json();

      setSyncResult({
        success: result.success,
        message: result.message || (result.success ? 'Sync completed successfully' : 'Sync failed'),
      });

      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error('Error syncing to Webflow:', err);
      setSyncResult({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to sync to Webflow',
      });
    } finally {
      setSyncingWebflow(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Tests Management</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tests Management</h2>
          <p className="text-gray-600 mt-2">
            Manage your tests - {tests.length} {tests.length === 1 ? 'test' : 'tests'} available
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={syncToWebflow}
            disabled={syncingWebflow}
            className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300"
          >
            {syncingWebflow ? 'Syncing...' : 'Sync to Webflow'}
          </Button>
          <Button
            variant="outline"
            onClick={downloadBlankTemplate}
            className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
          >
            Download Template
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowUploadModal(true)}
            className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
          >
            Bulk Upload
          </Button>
          <Link href="/admin/tests/create">
            <Button>
              Create New Test
            </Button>
          </Link>
        </div>
      </div>
      
      {syncResult && (
        <div className={`mb-4 p-4 rounded-md border ${
          syncResult.success
            ? 'bg-green-100 text-green-700 border-green-200'
            : 'bg-red-100 text-red-700 border-red-200'
        }`}>
          <strong>{syncResult.success ? 'Success:' : 'Error:'}</strong> {syncResult.message}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md border border-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      {tests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first test.</p>
            <Link href="/admin/tests/create">
              <Button>Create Your First Test</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{test.title}</h3>
                    {test.description && (
                      <p className="text-gray-600 mt-2">{test.description}</p>
                    )}
                    {test.instructions && (
                      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                        <span className="font-medium text-blue-800">Instructions: </span>
                        <span className="text-blue-700">{test.instructions.length > 100 ? `${test.instructions.substring(0, 100)}...` : test.instructions}</span>
                      </div>
                    )}
                    
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {Math.round(test.time_limit / 60)} minutes
                      </span>

                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {test.question_count || 0} questions
                      </span>

                      {test.categories && test.categories.length > 0 ? (
                        test.categories.map((category) => (
                          <span key={category.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {category.name}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          No categories
                        </span>
                      )}

                      {test.tag && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {test.tag}
                        </span>
                      )}

                      {test.feature && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⭐ Featured
                        </span>
                      )}

                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        test.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {test.is_active ? 'Active' : 'Inactive'}
                      </span>

                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        test.is_free
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {test.is_free ? 'FREE' : `${test.currency || 'USD'} ${(test.price ?? 0).toFixed(2)}`}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-500">
                      Created: {test.created_at ? new Date(test.created_at).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 ml-6">
                    <Button
                      variant="outline"
                      disabled={deletingId === test.id || managingTestId === test.id}
                      loading={managingTestId === test.id}
                      loadingText="Loading..."
                      onClick={() => handleManageTest(test.id)}
                    >
                      Manage
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setTestToDelete(test);
                        setDeleteModalOpen(true);
                      }}
                      disabled={deletingId === test.id}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      {deletingId === test.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => {
          setShowUploadModal(false);
          loadTests();
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTestToDelete(null);
        }}
        onConfirm={() => {
          if (testToDelete) {
            deleteTest(testToDelete.id);
          }
        }}
        title="Delete Test"
        message={`Are you sure you want to delete "${testToDelete?.title}"? This will remove all associated questions and cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}