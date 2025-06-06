import { Category } from './types';
import { directSupabase } from './direct-supabase';
import { v4 as uuidv4 } from 'uuid';

// Get all categories using direct connection
export async function fetchCategories() {
  try {
    const { data, error } = await directSupabase
      .from('categories')
      .select('*')
      .order('name');
      
    if (error) throw error;
    
    return data.map((category: any) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: new Date(category.created_at),
      updatedAt: new Date(category.updated_at)
    }));
  } catch (error) {
    console.error('Error fetching categories directly:', error);
    throw error;
  }
}

// Get a single category by ID
export async function fetchCategory(categoryId: string) {
  try {
    const { data, error } = await directSupabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single();
      
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  } catch (error) {
    console.error(`Error fetching category ${categoryId} directly:`, error);
    throw error;
  }
}

// Create a new category
export async function createCategory(categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    // Check if category name already exists
    const { data: existingCategory, error: checkError } = await directSupabase
      .from('categories')
      .select('id')
      .ilike('name', categoryData.name)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is what we want
      throw checkError;
    }
    
    if (existingCategory) {
      throw new Error(`A category with the name "${categoryData.name}" already exists`);
    }
    
    const categoryId = uuidv4();
    
    const { data, error } = await directSupabase
      .from('categories')
      .insert({
        id: categoryId,
        name: categoryData.name,
        description: categoryData.description
      })
      .select();
      
    if (error) throw error;
    
    console.log('Created category:', data);
    return categoryId;
  } catch (error) {
    console.error('Error creating category directly:', error);
    throw error;
  }
}

// Update an existing category
export async function updateCategory(categoryData: Category) {
  try {
    console.log('Direct update for category ID:', categoryData.id);
    
    // Check if another category with the same name exists
    const { data: existingCategory, error: checkError } = await directSupabase
      .from('categories')
      .select('id')
      .ilike('name', categoryData.name)
      .neq('id', categoryData.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is what we want
      throw checkError;
    }
    
    if (existingCategory) {
      throw new Error(`Another category with the name "${categoryData.name}" already exists`);
    }
    
    const { data, error } = await directSupabase
      .from('categories')
      .update({
        name: categoryData.name,
        description: categoryData.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryData.id)
      .select();
      
    if (error) {
      console.error('Direct update error:', error);
      throw error;
    }
    
    console.log('Direct update result:', data);
    return categoryData.id;
  } catch (error) {
    console.error('Error updating category directly:', error);
    throw error;
  }
}

// Delete a category
export async function deleteCategory(categoryId: string) {
  try {
    // First check if category is used by any questions or tests
    const { data: questionsWithCategory, error: questionError } = await directSupabase
      .from('questions')
      .select('id')
      .eq('category_id', categoryId);
      
    if (questionError) throw questionError;
    
    if (questionsWithCategory && questionsWithCategory.length > 0) {
      throw new Error(`Cannot delete category because it's used by ${questionsWithCategory.length} questions`);
    }
    
    const { data: testsWithCategory, error: testError } = await directSupabase
      .from('tests')
      .select('id')
      .eq('category_id', categoryId);
      
    if (testError) throw testError;
    
    if (testsWithCategory && testsWithCategory.length > 0) {
      throw new Error(`Cannot delete category because it's used by ${testsWithCategory.length} tests`);
    }
    
    // If no references, proceed with deletion
    const { error } = await directSupabase
      .from('categories')
      .delete()
      .eq('id', categoryId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting category directly:', error);
    throw error;
  }
}

// Get category usage statistics
export async function getCategoryStats(categoryId: string) {
  try {
    // Get count of questions in this category
    const { data: questions, error: questionError } = await directSupabase
      .from('questions')
      .select('id')
      .eq('category_id', categoryId);
      
    if (questionError) throw questionError;
    
    // Get count of tests in this category
    const { data: tests, error: testError } = await directSupabase
      .from('tests')
      .select('id')
      .eq('category_id', categoryId);
      
    if (testError) throw testError;
    
    return {
      questionCount: questions?.length || 0,
      testCount: tests?.length || 0
    };
  } catch (error) {
    console.error(`Error getting stats for category ${categoryId} directly:`, error);
    throw error;
  }
}