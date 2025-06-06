import { Category } from './types';
import { createClientSupabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import { mockCategories, generateMockId } from './supabase-mock';

// Get all categories
export async function fetchCategories() {
  try {
    const supabase = createClientSupabase();
    
    // First attempt with the correct schema table name
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
      
    if (error) {
      console.error('Error with main fetch, using mock data:', error);
      return mockCategories;
    }
    
    if (!data || data.length === 0) {
      console.log('No data found in categories table, using mock data');
      return mockCategories;
    }
    
    console.log('Categories data fetched successfully:', data.length);
    
    return data.map((category: any) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: new Date(category.created_at),
      updatedAt: new Date(category.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching categories:', error);
    return mockCategories; // Fallback to mock data if there's an error
  }
}

// Get a single category by ID
export async function fetchCategory(categoryId: string) {
  try {
    const supabase = createClientSupabase();
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();
      
    if (error) {
      console.error(`Error fetching category ${categoryId}:`, error);
      // Try to find in mock data as fallback
      const mockCategory = mockCategories.find(c => c.id === categoryId);
      if (mockCategory) return mockCategory;
      throw error;
    }
    
    if (!data) {
      console.log(`No category found with ID ${categoryId}, checking mock data`);
      const mockCategory = mockCategories.find(c => c.id === categoryId);
      if (mockCategory) return mockCategory;
      throw new Error(`Category with ID ${categoryId} not found`);
    }
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error(`Error fetching category ${categoryId}:`, error);
    // Try to find in mock data as fallback
    const mockCategory = mockCategories.find(c => c.id === categoryId);
    if (mockCategory) return mockCategory;
    throw error;
  }
}

// Create a new category
export async function createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const supabase = createClientSupabase();
    const categoryId = uuidv4();
    
    console.log('Creating category:', categoryData);
    
    const { error } = await supabase
      .from('categories')
      .insert({
        id: categoryId,
        name: categoryData.name,
        description: categoryData.description
      });
      
    if (error) {
      console.error('Supabase error creating category:', error);
      
      // Fallback to mock approach for development
      console.log('Using mock approach for development');
      const mockId = generateMockId();
      
      // Add to mock categories for session persistence
      mockCategories.push({
        id: mockId,
        name: categoryData.name,
        description: categoryData.description
      });
      
      console.log('Category created with mock ID:', mockId);
      return mockId;
    }
    
    console.log('Category created successfully with ID:', categoryId);
    return categoryId;
  } catch (error) {
    console.error('Error creating category:', error);
    
    // Fallback to mock approach
    const mockId = generateMockId();
    mockCategories.push({
      id: mockId,
      name: categoryData.name,
      description: categoryData.description
    });
    
    return mockId;
  }
}

// Update an existing category
export async function updateCategory(categoryData: Category) {
  try {
    const supabase = createClientSupabase();
    
    console.log('Updating category with ID:', categoryData.id);
    console.log('Update data:', {
      name: categoryData.name,
      description: categoryData.description
    });
    
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: categoryData.name,
        description: categoryData.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryData.id)
      .select();
      
    if (error) {
      console.error('Supabase update error:', error);
      
      // Handle mock data update
      const categoryIndex = mockCategories.findIndex(c => c.id === categoryData.id);
      if (categoryIndex >= 0) {
        console.log('Updating mock category instead');
        mockCategories[categoryIndex] = {
          ...mockCategories[categoryIndex],
          name: categoryData.name,
          description: categoryData.description,
          updatedAt: new Date()
        };
        return categoryData.id;
      }
      
      throw error;
    }
    
    console.log('Update result:', data);
    return categoryData.id;
  } catch (error) {
    console.error('Error updating category:', error);
    
    // Try to update mock data
    const categoryIndex = mockCategories.findIndex(c => c.id === categoryData.id);
    if (categoryIndex >= 0) {
      mockCategories[categoryIndex] = {
        ...mockCategories[categoryIndex],
        name: categoryData.name,
        description: categoryData.description,
        updatedAt: new Date()
      };
      return categoryData.id;
    }
    
    throw error;
  }
}

// Delete a category
export async function deleteCategory(categoryId: string) {
  try {
    const supabase = createClientSupabase();
    
    console.log('Checking if category is referenced before deletion:', categoryId);
    
    // First check if category is used by any questions or tests
    const { data: questionsWithCategory, error: questionError } = await supabase
      .from('questions') // Use correct table name from the initial schema
      .select('id')
      .eq('category_id', categoryId);
      
    if (questionError) {
      console.error('Error checking questions references:', questionError);
    }
    
    if (questionsWithCategory && questionsWithCategory.length > 0) {
      throw new Error(`Cannot delete category because it's used by ${questionsWithCategory.length} questions`);
    }
    
    const { data: testsWithCategory, error: testError } = await supabase
      .from('tests')
      .select('id')
      .eq('category_id', categoryId);
      
    if (testError) {
      console.error('Error checking tests references:', testError);
    }
    
    if (testsWithCategory && testsWithCategory.length > 0) {
      throw new Error(`Cannot delete category because it's used by ${testsWithCategory.length} tests`);
    }
    
    // If no references, proceed with deletion
    console.log('No references found, proceeding with deletion');
    
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);
      
    if (error) {
      console.error('Supabase deletion error:', error);
      
      // Handle mock data deletion as fallback
      const categoryIndex = mockCategories.findIndex(c => c.id === categoryId);
      if (categoryIndex >= 0) {
        console.log('Deleting from mock categories instead');
        mockCategories.splice(categoryIndex, 1);
        return true;
      }
      
      throw error;
    }
    
    console.log('Category deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    
    // Try to delete from mock data as fallback
    const categoryIndex = mockCategories.findIndex(c => c.id === categoryId);
    if (categoryIndex >= 0) {
      mockCategories.splice(categoryIndex, 1);
      return true;
    }
    
    throw error;
  }
}

// Get category usage statistics
export async function getCategoryStats(categoryId: string) {
  try {
    const supabase = createClientSupabase();
    
    // Get count of questions in this category
    const { data: questions, error: questionError } = await supabase
      .from('questions')
      .select('id')
      .eq('category_id', categoryId);
      
    if (questionError) throw questionError;
    
    // Get count of tests in this category
    const { data: tests, error: testError } = await supabase
      .from('tests')
      .select('id')
      .eq('category_id', categoryId);
      
    if (testError) throw testError;
    
    return {
      questionCount: questions?.length || 0,
      testCount: tests?.length || 0
    };
  } catch (error) {
    console.error(`Error getting stats for category ${categoryId}:`, error);
    throw error;
  }
}