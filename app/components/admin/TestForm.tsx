"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { TestData, Category } from "@/app/lib/types";

interface TestFormProps {
  initialData?: TestData;
  categories: Category[];
  onSubmit: (data: Partial<TestData>) => void;
  onCancel: () => void;
}

export function TestForm({ initialData, categories, onSubmit, onCancel }: TestFormProps) {
  const [formData, setFormData] = useState<Partial<TestData>>(
    initialData || {
      title: "",
      description: "",
      timeLimit: 300, // Default 5 minutes
      questions: [],
      categoryIds: categories[0]?.id ? [categories[0].id] : [],
    }
  );

  // If categories change and we don't have a category selected, set the first one
  useEffect(() => {
    if (categories.length > 0 && (!formData.categoryIds || formData.categoryIds.length === 0)) {
      setFormData(prev => ({ ...prev, categoryIds: [categories[0].id] }));
    }
  }, [categories, formData.categoryIds]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "category") {
      setFormData({
        ...formData,
        categoryIds: value ? [value] : [],
      });
    } else {
      setFormData({
        ...formData,
        [name]: name === "timeLimit" ? parseInt(value, 10) : value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Test Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label htmlFor="timeLimit" className="block text-sm font-medium mb-1">
              Time Limit (seconds)
            </label>
            <input
              type="number"
              id="timeLimit"
              name="timeLimit"
              value={formData.timeLimit}
              onChange={handleInputChange}
              min={60}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              {Math.floor((formData.timeLimit || 0) / 60)} minutes {(formData.timeLimit || 0) % 60} seconds
            </p>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.categoryIds?.[0] || ''}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
              {categories.length === 0 && (
                <option value="" disabled>
                  No categories available
                </option>
              )}
            </select>
          </div>

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={categories.length === 0}>
              {initialData ? "Update Test" : "Create Test"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}