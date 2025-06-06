"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

interface Category {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  is_archived?: boolean;
  questionCount?: number;
  testCount?: number;
}

interface CategoryFormData {
  name: string;
  description: string;
}

// Enhanced logging utility
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[Categories Page] ${message}`, data ? data : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[Categories Page ERROR] ${message}`, error ? error : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[Categories Page WARNING] ${message}`, data ? data : '');
  },
  debug: (message: string, data?: any) => {
    console.debug(`[Categories Page DEBUG] ${message}`, data ? data : '');
  }
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CategoryFormData>({ name: "", description: "" });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CategoryFormData>({ name: "", description: "" });

  useEffect(() => {
    loadCategories();
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

  async function loadCategories() {
    logger.info("Loading categories using direct fetch...");
    
    try {
      setLoading(true);
      setError(null);
      
      logger.info("Making direct fetch request to Supabase REST API...");
      
      const url = 'https://gezlcxtprkcceizadvre.supabase.co';
      const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';
      
      const response = await fetch(`${url}/rest/v1/categories?select=*&is_archived=eq.false&order=name`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        }
      });
      
      logger.info("Fetch response received:", { status: response.status, ok: response.ok });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      logger.info("Categories data received:", { count: data?.length, data });
      
      if (!Array.isArray(data)) {
        throw new Error("Expected array of categories");
      }
      
      setCategories(data);
      logger.info(`Successfully loaded ${data.length} categories`);
      
    } catch (err) {
      logger.error("Failed to load categories", err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  function validateForm(formData: CategoryFormData): Record<string, string> {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = "Category name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Category name must be at least 2 characters long";
    } else if (formData.name.trim().length > 100) {
      errors.name = "Category name must be less than 100 characters";
    }
    
    // Check for duplicate names (excluding the category being edited)
    const existingCategory = categories.find(cat => 
      cat.name.toLowerCase() === formData.name.trim().toLowerCase() && 
      cat.id !== editingId
    );
    
    if (existingCategory) {
      errors.name = "A category with this name already exists";
    }
    
    if (formData.description.trim().length > 500) {
      errors.description = "Description must be less than 500 characters";
    }
    
    return errors;
  }

  async function updateCategory() {
    if (!editingId) {
      logger.error("No category selected for editing");
      return;
    }
    
    logger.info("Starting category update", { id: editingId, form: editForm });
    
    try {
      // Validate form
      const errors = validateForm(editForm);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        logger.warn("Form validation failed", errors);
        return;
      }
      
      setValidationErrors({});
      
      logger.info("Making direct fetch request to update category...");
      
      const url = 'https://gezlcxtprkcceizadvre.supabase.co';
      const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';
      
      const response = await fetch(`${url}/rest/v1/categories?id=eq.${editingId}`, {
        method: 'PATCH',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
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
      
      logger.info("Category updated successfully, reloading data...");
      await loadCategories();
      
      setSuccessMessage("Category updated successfully!");
      setEditingId(null);
      setEditForm({ name: "", description: "" });
      
    } catch (err) {
      logger.error("Failed to update category", err);
      setError(err instanceof Error ? err.message : 'Failed to update category');
    }
  }

  async function createCategory() {
    logger.info("Starting category creation", createForm);
    
    try {
      // Validate form
      const errors = validateForm(createForm);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        logger.warn("Create form validation failed", errors);
        return;
      }
      
      setValidationErrors({});
      
      logger.info("Making direct fetch request to create category...");
      
      const url = 'https://gezlcxtprkcceizadvre.supabase.co';
      const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';
      
      const response = await fetch(`${url}/rest/v1/categories`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          name: createForm.name.trim(),
          description: createForm.description.trim() || null,
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
      
      logger.info("Category created successfully, reloading data...");
      await loadCategories();
      
      setSuccessMessage("Category created successfully!");
      setShowCreateForm(false);
      setCreateForm({ name: "", description: "" });
      
    } catch (err) {
      logger.error("Failed to create category", err);
      setError(err instanceof Error ? err.message : 'Failed to create category');
    }
  }

  async function deleteCategory(categoryId: string) {
    logger.info("Starting category archival (soft delete)", { id: categoryId });
    
    try {
      setDeletingId(categoryId);
      
      logger.info("Making direct fetch request to archive category...");
      
      const url = 'https://gezlcxtprkcceizadvre.supabase.co';
      const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA';
      
      // Instead of deleting, we'll mark the category as archived
      const archiveResponse = await fetch(`${url}/rest/v1/categories?id=eq.${categoryId}`, {
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
      
      logger.info("Category archived successfully, reloading data...");
      await loadCategories();
      
      setSuccessMessage("Category archived successfully!");
      
    } catch (err) {
      logger.error("Failed to archive category", err);
      setError(err instanceof Error ? err.message : 'Failed to archive category');
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(category: Category) {
    logger.info("Starting edit for category", { id: category.id, name: category.name });
    setEditingId(category.id);
    setEditForm({
      name: category.name,
      description: category.description || ""
    });
    setValidationErrors({});
  }

  function cancelEdit() {
    logger.info("Cancelling edit");
    setEditingId(null);
    setEditForm({ name: "", description: "" });
    setValidationErrors({});
  }

  function startCreate() {
    logger.info("Starting create new category");
    setShowCreateForm(true);
    setCreateForm({ name: "", description: "" });
    setValidationErrors({});
  }

  function cancelCreate() {
    logger.info("Cancelling create");
    setShowCreateForm(false);
    setCreateForm({ name: "", description: "" });
    setValidationErrors({});
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Categories Management</h2>
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
          <h2 className="text-2xl font-bold">Categories Management</h2>
          <p className="text-gray-600 mt-2">
            Displaying {categories.length} categories from the database
          </p>
        </div>
        <Button onClick={startCreate}>
          + Add Category
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
      
      {/* Create Form */}
      {showCreateForm && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Create New Category</h3>
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className={`w-full p-2 border rounded ${validationErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Category name"
                />
                {validationErrors.name && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
                )}
              </div>
              <div>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className={`w-full p-2 border rounded ${validationErrors.description ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Description (optional)"
                  rows={2}
                />
                {validationErrors.description && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={createCategory}
                  disabled={!createForm.name.trim()}
                >
                  Create Category
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
      
      {/* Categories List */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-500 py-8">
              No categories found in the database.
              {!showCreateForm && (
                <span className="block mt-2">
                  <Button variant="outline" onClick={startCreate}>
                    Create your first category
                  </Button>
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-6">
                {editingId === category.id ? (
                  // Edit form
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium mb-4">Edit Category</h3>
                    <div>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className={`w-full p-2 border rounded ${validationErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder="Category name"
                      />
                      {validationErrors.name && (
                        <p className="text-red-600 text-sm mt-1">{validationErrors.name}</p>
                      )}
                    </div>
                    <div>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className={`w-full p-2 border rounded ${validationErrors.description ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder="Description (optional)"
                        rows={2}
                      />
                      {validationErrors.description && (
                        <p className="text-red-600 text-sm mt-1">{validationErrors.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={updateCategory}
                        disabled={!editForm.name.trim()}
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
                      <h3 className="text-lg font-medium">{category.name}</h3>
                      {category.description && (
                        <p className="text-slate-500 mt-1">{category.description}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {category.questionCount || 0} questions
                        </span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                          {category.testCount || 0} tests
                        </span>
                        <span className="text-slate-400">
                          Created: {category.created_at ? new Date(category.created_at).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        ID: {category.id}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => startEdit(category)}
                        disabled={deletingId === category.id}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          if (window.confirm(
                            `Are you sure you want to delete "${category.name}"? This action cannot be undone.` +
                            (category.questionCount || category.testCount 
                              ? `\n\nNote: This category has ${category.questionCount} questions and ${category.testCount} tests.`
                              : '')
                          )) {
                            deleteCategory(category.id);
                          }
                        }}
                        disabled={deletingId === category.id}
                        className="text-red-600 hover:text-red-700"
                      >
                        {deletingId === category.id ? 'Deleting...' : 'Delete'}
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