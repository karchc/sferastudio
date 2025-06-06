import { createClient } from '@supabase/supabase-js';
import { Category, Question, Test } from './types';
import { v4 as uuidv4 } from 'uuid';

// Create a client using the anon key (for authentication)
const supabase = createClient(
  'https://gezlcxtprkcceizadvre.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlemxjeHRwcmtjY2VpemFkdnJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcyMTExNjMsImV4cCI6MjA2Mjc4NzE2M30.QGmCK5yN4MyPSSzZGSHN4Oqx8C7dUAwfi6sW4jUjWoA'
);

// Categories CRUD operations
export const categoriesApi = {
  // Get all categories
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
      
    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
    
    return data.map((category: any) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: new Date(category.created_at),
      updatedAt: new Date(category.updated_at)
    }));
  },
  
  // Get a single category
  async getById(id: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error(`Error fetching category ${id}:`, error);
      throw error;
    }
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  },
  
  // Create a category
  async create(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
    const categoryId = uuidv4();
    
    const { data, error } = await supabase
      .from('categories')
      .insert({
        id: categoryId,
        name: categoryData.name,
        description: categoryData.description
      })
      .select();
      
    if (error) {
      console.error('Error creating category:', error);
      throw error;
    }
    
    console.log('Category created:', data);
    return categoryId;
  },
  
  // Update a category
  async update(id: string, categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: categoryData.name,
        description: categoryData.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
      
    if (error) {
      console.error(`Error updating category ${id}:`, error);
      throw error;
    }
    
    console.log('Category updated:', data);
    return id;
  },
  
  // Delete a category
  async delete(id: string) {
    // First check if category is used by any questions or tests
    const { data: questionsWithCategory, error: questionError } = await supabase
      .from('questions')
      .select('id')
      .eq('category_id', id);
      
    if (questionError) {
      console.error(`Error checking questions for category ${id}:`, questionError);
      throw questionError;
    }
    
    if (questionsWithCategory && questionsWithCategory.length > 0) {
      throw new Error(`Cannot delete category because it's used by ${questionsWithCategory.length} questions`);
    }
    
    const { data: testsWithCategory, error: testError } = await supabase
      .from('tests')
      .select('id')
      .eq('category_id', id);
      
    if (testError) {
      console.error(`Error checking tests for category ${id}:`, testError);
      throw testError;
    }
    
    if (testsWithCategory && testsWithCategory.length > 0) {
      throw new Error(`Cannot delete category because it's used by ${testsWithCategory.length} tests`);
    }
    
    // If no references, proceed with deletion
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error(`Error deleting category ${id}:`, error);
      throw error;
    }
    
    return true;
  }
};

// Questions CRUD operations
export const questionsApi = {
  // Similar functions for questions...
};

// Tests CRUD operations
export const testsApi = {
  // Similar functions for tests...
};