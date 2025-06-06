"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

interface Test {
  id: string;
  title: string;
  description?: string;
  time_limit: number;
  category_ids?: string[]; // Array of category IDs stored directly in tests table
  categories?: Array<{ id: string; name: string; }>; // Expanded category data for display
  category_names?: string; // Comma-separated category names for display
  created_by?: string;
  is_active?: boolean;
  is_archived?: boolean;
  created_at?: string;
  updated_at?: string;
  questionCount?: number;
}

interface TestFormData {
  title: string;
  description: string;
  time_limit: number;
  category_ids: string[]; // Changed from single category_id to array
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
  description?: string;
}

// Enhanced logging utility
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[Tests Page] ${message}`, data ? data : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Tests Page ERROR] ${message}`, error ? error : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Tests Page WARNING] ${message}`, data ? data : '');
  },
  debug: (message: string, data?: any) => {
    console.debug(`[Tests Page DEBUG] ${message}`, data ? data : '');
  }
};

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TestFormData>({ 
    title: "", 
    description: "", 
    time_limit: 60, 
    category_ids: [],
    is_active: true 
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<TestFormData>({ 
    title: "", 
    description: "", 
    time_limit: 60, 
    category_ids: [],
    is_active: true 
  });

  useEffect(() => {
    loadData();
  }, []);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || error) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  async function loadData() {
    logger.info("Loading tests and categories using direct fetch...");
    
    try {
      setLoading(true);
      setError(null);
      
      logger.info("Making direct fetch requests to Supabase REST API...");
      
      const url = 'https://gezlcxtprkcceizadvre.supabase.co';
      const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';
      
      // Load both tests and all categories in parallel
      const [testsResponse, categoriesResponse] = await Promise.all([
        fetch(`${url}/rest/v1/tests?select=*&is_archived=eq.false&order=created_at.desc`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${url}/rest/v1/categories?select=*&is_archived=eq.false&order=name`, {
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          }
        })
      ]);
      
      logger.info("Fetch responses received:", { 
        testsStatus: testsResponse.status, 
        categoriesStatus: categoriesResponse.status 
      });
      
      if (!testsResponse.ok || !categoriesResponse.ok) {
        throw new Error(`HTTP Error: Tests ${testsResponse.status}, Categories ${categoriesResponse.status}`);
      }
      
      const [testsData, categoriesData] = await Promise.all([
        testsResponse.json(),
        categoriesResponse.json()
      ]);
      
      logger.info("Data received:", { 
        testsCount: testsData?.length, 
        categoriesCount: categoriesData?.length 
      });
      
      if (!Array.isArray(testsData) || !Array.isArray(categoriesData)) {
        throw new Error("Expected arrays of tests and categories");
      }
      
      // Transform tests data to include categories array and category names
      const transformedTests = testsData.map((test: any) => {
        // Get categories data for the test's category_ids
        const testCategoryIds = test.category_ids || [];
        const categories = categoriesData.filter((cat: any) => 
          testCategoryIds.includes(cat.id)
        );
        const categoryNames = categories.map((cat: any) => cat.name).join(', ') || 'No Categories';
        
        return {
          ...test,
          categories,
          category_names: categoryNames,
          questionCount: 0 // Will be loaded separately if needed
        };
      });
      
      setTests(transformedTests);
      setCategories(categoriesData);
      logger.info(`Successfully loaded ${transformedTests.length} tests and ${categoriesData.length} categories`);
      
    } catch (err) {
      logger.error("Failed to load data", err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }


  function validateForm(formData: TestFormData): Record<string, string> {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = "Test title is required";
    } else if (formData.title.trim().length < 3) {
      errors.title = "Test title must be at least 3 characters long";
    } else if (formData.title.trim().length > 200) {
      errors.title = "Test title must be less than 200 characters";
    }
    
    // Check for duplicate titles (excluding the test being edited)
    const existingTest = tests.find(test => 
      test.title.toLowerCase() === formData.title.trim().toLowerCase() && 
      test.id !== editingId
    );
    
    if (existingTest) {
      errors.title = "A test with this title already exists";
    }
    
    if (formData.description.trim().length > 1000) {
      errors.description = "Description must be less than 1000 characters";
    }
    
    if (!formData.time_limit || formData.time_limit < 1) {
      errors.time_limit = "Time limit must be at least 1 minute";
    } else if (formData.time_limit > 300) {
      errors.time_limit = "Time limit cannot exceed 300 minutes (5 hours)";
    }
    
    if (!formData.category_ids || formData.category_ids.length === 0) {
      errors.category_ids = "Please select at least one category";
    }
    
    return errors;
  }

  async function updateTest() {
    if (!editingId) {
      logger.error("No test selected for editing");
      return;
    }
    
    logger.info("Starting test update", { id: editingId, form: editForm });
    
    try {
      // Validate form
      const errors = validateForm(editForm);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        logger.warn("Form validation failed", errors);
        return;
      }
      
      setValidationErrors({});
      
      logger.info("Making direct fetch request to update test...");
      
      const url = 'https://gezlcxtprkcceizadvre.supabase.co';
      const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9zZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';
      
      const response = await fetch(`${url}/rest/v1/tests?id=eq.${editingId}`, {
        method: 'PATCH',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          title: editForm.title.trim(),
          description: editForm.description.trim() || null,
          time_limit: editForm.time_limit,
          category_ids: editForm.category_ids,
          is_active: editForm.is_active,
          updated_at: new Date().toISOString()
        })
      });
      
      logger.info("Update response received:", { status: response.status, ok: response.ok });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      logger.info("Update successful, response:", data);
      
      logger.info("Test updated successfully, reloading data...");
      await loadData();
      
      setSuccessMessage("Test updated successfully!");
      setEditingId(null);
      setEditForm({ title: "", description: "", time_limit: 60, category_ids: [], is_active: true });
      
    } catch (err) {
      logger.error("Failed to update test", err);
      setError(err instanceof Error ? err.message : 'Failed to update test');
    }
  }

  async function createTest() {
    logger.info("Starting test creation", createForm);
    
    try {
      // Validate form
      const errors = validateForm(createForm);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        logger.warn("Create form validation failed", errors);
        return;
      }
      
      setValidationErrors({});
      
      logger.info("Making direct fetch request to create test...");
      
      const url = 'https://gezlcxtprkcceizadvre.supabase.co';
      const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9zZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';
      
      const response = await fetch(`${url}/rest/v1/tests`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          title: createForm.title.trim(),
          description: createForm.description.trim() || null,
          time_limit: createForm.time_limit,
          category_ids: createForm.category_ids,
          is_active: createForm.is_active,
          is_archived: false
        })
      });
      
      logger.info("Create response received:", { status: response.status, ok: response.ok });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      logger.info("Create successful, response:", data);
      
      logger.info("Test created successfully, reloading data...");
      await loadData();
      
      setSuccessMessage("Test created successfully!");
      setShowCreateForm(false);
      setCreateForm({ title: "", description: "", time_limit: 60, category_ids: [], is_active: true });
      
    } catch (err) {
      logger.error("Failed to create test", err);
      setError(err instanceof Error ? err.message : 'Failed to create test');
    }
  }

  async function deleteTest(testId: string) {
    logger.info("Starting test archival (soft delete)", { id: testId });
    
    try {
      setDeletingId(testId);
      
      logger.info("Making direct fetch request to archive test...");
      
      const url = 'https://gezlcxtprkcceizadvre.supabase.co';
      const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9zZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';
      
      // Instead of deleting, we'll mark the test as archived
      const archiveResponse = await fetch(`${url}/rest/v1/tests?id=eq.${testId}`, {
        method: 'PATCH',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          is_archived: true,
          updated_at: new Date().toISOString()
        })
      });
      
      logger.info("Archive response received:", { status: archiveResponse.status, ok: archiveResponse.ok });
      
      if (!archiveResponse.ok) {
        const errorText = await archiveResponse.text();
        throw new Error(`HTTP ${archiveResponse.status}: ${errorText}`);
      }
      
      logger.info("Test archived successfully, reloading data...");
      await loadData();
      
      setSuccessMessage("Test archived successfully!");
      
    } catch (err) {
      logger.error("Failed to archive test", err);
      setError(err instanceof Error ? err.message : 'Failed to archive test');
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(test: Test) {
    logger.info("Starting edit for test", { id: test.id, title: test.title });
    setEditingId(test.id);
    
    // Use category_ids directly from the test object
    const categoryIds = test.category_ids || [];
    
    setEditForm({
      title: test.title,
      description: test.description || "",
      time_limit: test.time_limit,
      category_ids: categoryIds,
      is_active: test.is_active !== false
    });
    setValidationErrors({});
  }

  function cancelEdit() {
    logger.info("Cancelling edit");
    setEditingId(null);
    setEditForm({ title: "", description: "", time_limit: 60, category_ids: [], is_active: true });
    setValidationErrors({});
  }

  function startCreate() {
    logger.info("Starting create new test");
    setShowCreateForm(true);
    setCreateForm({ title: "", description: "", time_limit: 60, category_ids: [], is_active: true });
    setValidationErrors({});
  }

  function cancelCreate() {
    logger.info("Cancelling create");
    setShowCreateForm(false);
    setCreateForm({ title: "", description: "", time_limit: 60, category_ids: [], is_active: true });
    setValidationErrors({});
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Tests Management</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
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
            Displaying {tests.length} tests from the database
          </p>
        </div>
        <Button onClick={startCreate} disabled={categories.length === 0}>
          + Add Test
        </Button>
      </div>
      
      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md border border-red-200">
          <strong>Error:</strong> {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md border border-green-200">
          {successMessage}
        </div>
      )}
      
      {/* Warning if no categories */}
      {categories.length === 0 && (
        <div className="mb-4 p-4 bg-yellow-100 text-yellow-700 rounded-md border border-yellow-200">
          You need to create categories before creating tests.{" "}
          <Link href="/admin/categories" className="underline font-medium">
            Create Categories
          </Link>
        </div>
      )}
      
      {/* Create Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Create New Test</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Test Title</label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className={`w-full p-2 border rounded ${validationErrors.title ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Enter test title"
                />
                {validationErrors.title && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.title}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className={`w-full p-2 border rounded ${validationErrors.description ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Test description (optional)"
                  rows={3}
                />
                {validationErrors.description && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.description}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Time Limit (minutes)</label>
                  <input
                    type="number"
                    value={createForm.time_limit}
                    onChange={(e) => setCreateForm({ ...createForm, time_limit: parseInt(e.target.value) || 60 })}
                    className={`w-full p-2 border rounded ${validationErrors.time_limit ? 'border-red-300' : 'border-gray-300'}`}
                    min="1"
                    max="300"
                  />
                  {validationErrors.time_limit && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.time_limit}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Categories</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                    {categories.map((category) => (
                      <label key={category.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={createForm.category_ids.includes(category.id)}
                          onChange={(e) => {
                            const categoryIds = e.target.checked 
                              ? [...createForm.category_ids, category.id]
                              : createForm.category_ids.filter(id => id !== category.id);
                            setCreateForm({ ...createForm, category_ids: categoryIds });
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{category.name}</span>
                      </label>
                    ))}
                  </div>
                  {createForm.category_ids.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Selected: {createForm.category_ids.length} categories
                    </p>
                  )}
                  {validationErrors.category_ids && (
                    <p className="text-red-600 text-sm mt-1">{validationErrors.category_ids}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={createForm.is_active}
                    onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Active (visible to users)</span>
                </label>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={createTest}
                  disabled={!createForm.title.trim() || createForm.category_ids.length === 0}
                >
                  Create Test
                </Button>
                <Button 
                  variant="outline" 
                  onClick={cancelCreate}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Tests List */}
      {tests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-500 py-8">
              No tests found in the database.
              {!showCreateForm && categories.length > 0 && (
                <span className="block mt-2">
                  <Button variant="outline" onClick={startCreate}>
                    Create your first test
                  </Button>
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <Card key={test.id}>
              <CardContent className="p-6">
                {editingId === test.id ? (
                  // Edit form
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium mb-4">Edit Test</h3>
                    <div>
                      <label className="block text-sm font-medium mb-1">Test Title</label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className={`w-full p-2 border rounded ${validationErrors.title ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder="Enter test title"
                      />
                      {validationErrors.title && (
                        <p className="text-red-600 text-sm mt-1">{validationErrors.title}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className={`w-full p-2 border rounded ${validationErrors.description ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder="Test description (optional)"
                        rows={3}
                      />
                      {validationErrors.description && (
                        <p className="text-red-600 text-sm mt-1">{validationErrors.description}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Time Limit (minutes)</label>
                        <input
                          type="number"
                          value={editForm.time_limit}
                          onChange={(e) => setEditForm({ ...editForm, time_limit: parseInt(e.target.value) || 60 })}
                          className={`w-full p-2 border rounded ${validationErrors.time_limit ? 'border-red-300' : 'border-gray-300'}`}
                          min="1"
                          max="300"
                        />
                        {validationErrors.time_limit && (
                          <p className="text-red-600 text-sm mt-1">{validationErrors.time_limit}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Categories</label>
                        <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                          {categories.map((category) => (
                            <label key={category.id} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={editForm.category_ids.includes(category.id)}
                                onChange={(e) => {
                                  const categoryIds = e.target.checked 
                                    ? [...editForm.category_ids, category.id]
                                    : editForm.category_ids.filter(id => id !== category.id);
                                  setEditForm({ ...editForm, category_ids: categoryIds });
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm">{category.name}</span>
                            </label>
                          ))}
                        </div>
                        {editForm.category_ids.length > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            Selected: {editForm.category_ids.length} categories
                          </p>
                        )}
                        {validationErrors.category_ids && (
                          <p className="text-red-600 text-sm mt-1">{validationErrors.category_ids}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.is_active}
                          onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm font-medium">Active (visible to users)</span>
                      </label>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={updateTest}
                        disabled={!editForm.title.trim() || editForm.category_ids.length === 0}
                      >
                        Save Changes
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={cancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{test.title}</h3>
                      {test.description && (
                        <p className="text-slate-500 mt-1">{test.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {test.time_limit} minutes
                        </span>
                        {test.categories && test.categories.length > 0 ? (
                          test.categories.map((cat) => (
                            <span key={cat.id} className="bg-green-100 text-green-800 px-2 py-1 rounded">
                              {cat.name}
                            </span>
                          ))
                        ) : (
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">No Categories</span>
                        )}
                        <span className={`px-2 py-1 rounded ${test.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {test.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="text-slate-400">
                          Created: {test.created_at ? new Date(test.created_at).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        ID: {test.id}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => startEdit(test)}
                        disabled={deletingId === test.id}
                      >
                        Edit
                      </Button>
                      <Link href={`/admin/tests/${test.id}/questions`}>
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={deletingId === test.id}
                        >
                          Questions
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (window.confirm(
                            `Are you sure you want to delete "${test.title}"? This action cannot be undone.`
                          )) {
                            deleteTest(test.id);
                          }
                        }}
                        disabled={deletingId === test.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {deletingId === test.id ? 'Deleting...' : 'Delete'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}