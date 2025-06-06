"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { createClient } from '@supabase/supabase-js';

// Create a direct Supabase client
const supabase = createClient(
  'https://gezlcxtprkcceizadvre.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
);

// Direct, simplified component for testing category operations
export default function CategoryFormBasic() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      setCategories(data || []);
      setSuccess("Fetched " + (data?.length || 0) + " categories");
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: name.trim(),
          description: description.trim() || null
        })
        .select();
        
      if (error) throw error;
      
      setSuccess("Category created successfully!");
      setName("");
      setDescription("");
      
      // Refresh categories
      fetchCategories();
    } catch (err) {
      console.error("Error creating category:", err);
      setError(err instanceof Error ? err.message : "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setSuccess("Category deleted successfully!");
      
      // Refresh categories
      fetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
      setError(err instanceof Error ? err.message : "Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Basic Category Form</h2>
      
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1">
                Category Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-100 text-green-700 rounded-md">
                {success}
              </div>
            )}
            
            <div className="flex space-x-2">
              <Button
                onClick={createCategory}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Processing..." : "Create Category"}
              </Button>
              
              <Button
                onClick={fetchCategories}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                Fetch Categories
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {categories.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-medium">Categories ({categories.length})</h3>
          
          {categories.map((category) => (
            <Card key={category.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-lg font-medium">{category.name}</h4>
                    {category.description && (
                      <p className="text-gray-500 text-sm">{category.description}</p>
                    )}
                    <p className="text-gray-400 text-xs mt-1">ID: {category.id}</p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteCategory(category.id)}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}