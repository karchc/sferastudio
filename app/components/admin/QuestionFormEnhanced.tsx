"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Question, QuestionType, Answer, DropdownItem, Category, QuestionFormData } from "@/app/lib/types";
import { generateMockId } from "@/app/components/admin/MockData";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface QuestionFormProps {
  initialData?: Question;
  categories: Category[];
  onSubmit: (data: QuestionFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function QuestionForm({ initialData, categories, onSubmit, onCancel, isSubmitting = false }: QuestionFormProps) {
  const [formData, setFormData] = useState<QuestionFormData>(() => {
    if (initialData) {
      return {
        type: initialData.type,
        text: initialData.text,
        mediaUrl: initialData.mediaUrl || '',
        categoryId: initialData.category_id || categories[0]?.id || "",
        difficulty: initialData.difficulty || 'medium',
        points: initialData.points || 1,
        explanation: initialData.explanation || '',
        answers: initialData.answers,
        dropdownItems: initialData.dropdownItems
      };
    }
    
    return {
      text: "",
      type: "single_choice",
      mediaUrl: '',
      categoryId: categories[0]?.id || "",
      difficulty: 'medium',
      points: 1,
      explanation: '',
      answers: [
        { id: generateMockId(), text: "", isCorrect: false, position: 0 },
        { id: generateMockId(), text: "", isCorrect: false, position: 1 },
        { id: generateMockId(), text: "", isCorrect: false, position: 2 },
        { id: generateMockId(), text: "", isCorrect: false, position: 3 }
      ]
    };
  });

  // If categories change and we don't have a category selected, set the first one
  useEffect(() => {
    if (categories.length > 0 && !formData.categoryId) {
      setFormData(prev => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [categories, formData.categoryId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'points' ? parseInt(value) || 1 : value,
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as QuestionType;
    
    setFormData(prev => {
      const updated: QuestionFormData = { ...prev, type: newType };
      
      // Initialize appropriate answer format based on question type
      if (newType === "multiple_choice" || newType === "single_choice") {
        updated.answers = prev.answers?.length ? prev.answers : [
          { id: generateMockId(), text: "", isCorrect: false, position: 0 },
          { id: generateMockId(), text: "", isCorrect: false, position: 1 },
          { id: generateMockId(), text: "", isCorrect: false, position: 2 },
          { id: generateMockId(), text: "", isCorrect: false, position: 3 }
        ];
        delete updated.dropdownItems;
      } else if (newType === "dropdown") {
        updated.dropdownItems = prev.dropdownItems?.length ? prev.dropdownItems : [
          { 
            id: generateMockId(), 
            statement: "", 
            correctAnswer: "", 
            options: ["Option 1", "Option 2", "Option 3"], 
            position: 0 
          },
          { 
            id: generateMockId(), 
            statement: "", 
            correctAnswer: "", 
            options: ["Option 1", "Option 2", "Option 3"], 
            position: 1 
          }
        ];
        delete updated.answers;
      }
      
      return updated;
    });
  };

  // Multiple choice answer management
  const handleAnswerChange = (id: string, field: keyof Answer, value: string | boolean) => {
    setFormData(prev => {
      const answers = [...(prev.answers || [])];
      const index = answers.findIndex(a => a.id === id);
      
      if (index !== -1) {
        // For isCorrect field in single-choice questions, handle radio button behavior
        if (field === 'isCorrect' && (prev.type === 'single_choice' || prev.type === 'true_false') && value === true) {
          // Uncheck all other answers first
          answers.forEach(answer => {
            answer.isCorrect = false;
          });
        }
        
        answers[index] = { ...answers[index], [field]: value };
      }
      
      return { ...prev, answers };
    });
  };

  const addAnswer = () => {
    setFormData(prev => ({
      ...prev,
      answers: [...(prev.answers || []), { id: generateMockId(), text: "", isCorrect: false, position: (prev.answers?.length || 0) }]
    }));
  };

  const removeAnswer = (id: string) => {
    setFormData(prev => ({
      ...prev,
      answers: (prev.answers || []).filter(a => a.id !== id)
    }));
  };


  // Dropdown items management
  const handleDropdownItemChange = (id: string, field: keyof DropdownItem, value: string | string[]) => {
    setFormData(prev => {
      const dropdownItems = [...(prev.dropdownItems || [])];
      const index = dropdownItems.findIndex(item => item.id === id);
      
      if (index !== -1) {
        dropdownItems[index] = { ...dropdownItems[index], [field]: value };
      }
      
      return { ...prev, dropdownItems };
    });
  };

  const addDropdownItem = () => {
    setFormData(prev => ({
      ...prev,
      dropdownItems: [...(prev.dropdownItems || []), { 
        id: generateMockId(), 
        statement: "", 
        correctAnswer: "", 
        options: ["Option 1", "Option 2", "Option 3"], 
        position: (prev.dropdownItems?.length || 0) 
      }]
    }));
  };

  const removeDropdownItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      dropdownItems: (prev.dropdownItems || []).filter(item => item.id !== id)
    }));
  };

  const updateDropdownOptions = (id: string, options: string[]) => {
    handleDropdownItemChange(id, 'options', options);
  };

  // Image upload handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, we'll use a simple base64 data URL
      // In production, you'd upload to a cloud storage service
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setFormData(prev => ({ ...prev, mediaUrl: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, mediaUrl: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up form data before submitting
    const cleanedFormData = { ...formData };
    
    // For dropdown questions, filter out empty options
    if (cleanedFormData.type === 'dropdown' && cleanedFormData.dropdownItems) {
      cleanedFormData.dropdownItems = cleanedFormData.dropdownItems.map(item => ({
        ...item,
        options: item.options.filter(opt => opt.trim() !== '')
      }));
    }
    
    onSubmit(cleanedFormData);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="text" className="block text-sm font-medium mb-1">
              Question Text
            </label>
            <textarea
              id="text"
              name="text"
              value={formData.text}
              onChange={handleInputChange}
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Question Image (Optional)
            </label>
            
            {formData.mediaUrl ? (
              <div className="space-y-3">
                {/* Image Preview */}
                <div className="relative inline-block">
                  <img 
                    src={formData.mediaUrl} 
                    alt="Question image" 
                    className="max-w-xs max-h-48 object-contain border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Replace Image Button */}
                <div>
                  <label className="inline-flex items-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-200 transition-colors">
                    <Upload className="h-4 w-4 mr-2" />
                    Replace Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              /* Upload Button */
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <label className="cursor-pointer">
                  <div className="space-y-2">
                    <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600 hover:text-blue-500">
                        Click to upload
                      </span> or drag and drop
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="type" className="block text-sm font-medium mb-1">
                Question Type
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleTypeChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="single_choice">Single Choice</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="dropdown">Dropdown</option>
              </select>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">
                Category
              </label>
              <select
                id="category"
                name="categoryId"
                value={formData.categoryId || ''}
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

            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium mb-1">
                Difficulty
              </label>
              <select
                id="difficulty"
                name="difficulty"
                value={formData.difficulty}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label htmlFor="points" className="block text-sm font-medium mb-1">
                Points
              </label>
              <input
                id="points"
                name="points"
                type="number"
                min="1"
                max="10"
                value={formData.points}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <label htmlFor="explanation" className="block text-sm font-medium mb-1">
              Explanation (Optional)
            </label>
            <textarea
              id="explanation"
              name="explanation"
              value={formData.explanation}
              onChange={handleInputChange}
              rows={2}
              placeholder="Provide an explanation for the correct answer..."
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          {/* Multiple choice / Single choice answers */}
          {(formData.type === "multiple_choice" || formData.type === "single_choice") && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium">
                  Answers {formData.type === "single_choice" ? "(Select one correct)" : "(Select all correct)"}
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addAnswer}>
                  Add Answer
                </Button>
              </div>
              
              {(formData.answers || []).map((answer, index) => (
                <div key={answer.id} className="flex items-center space-x-2">
                  <input
                    type={formData.type === "single_choice" ? "radio" : "checkbox"}
                    name={formData.type === "single_choice" ? "correctAnswer" : undefined}
                    checked={answer.isCorrect}
                    onChange={(e) => handleAnswerChange(answer.id!, "isCorrect", e.target.checked)}
                    className="h-4 w-4"
                  />
                  <textarea
                    value={answer.text}
                    onChange={(e) => handleAnswerChange(answer.id!, "text", e.target.value)}
                    placeholder={`Answer ${index + 1}`}
                    className="flex-1 p-2 border border-gray-300 rounded-md min-h-[60px]"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeAnswer(answer.id!)}
                    disabled={(formData.answers || []).length <= 2}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              <div className="text-sm text-gray-500">
                <p>{formData.type === "single_choice" ? "Select the one correct answer." : "Check all correct answers."} You must have at least 2 answers.</p>
              </div>
            </div>
          )}

          {/* Dropdown items */}
          {formData.type === "dropdown" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium">Dropdown Statements</h3>
                <Button type="button" variant="outline" size="sm" onClick={addDropdownItem}>
                  Add Statement
                </Button>
              </div>
              
              {(formData.dropdownItems || []).map((item, index) => (
                <div key={item.id} className="space-y-3 p-4 border border-gray-200 rounded-md">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Statement {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeDropdownItem(item.id!)}
                      disabled={(formData.dropdownItems || []).length <= 1}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Statement</label>
                    <input
                      type="text"
                      value={item.statement}
                      onChange={(e) => handleDropdownItemChange(item.id!, "statement", e.target.value)}
                      placeholder="Enter the statement..."
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Dropdown Options</label>
                      <p className="text-xs text-gray-500 mb-2">Enter each option on a new line. Press Enter to add more options.</p>
                      <textarea
                        value={item.options.join('\n')}
                        onChange={(e) => {
                          // Split by newlines but keep empty lines during editing for better UX
                          const allLines = e.target.value.split('\n');
                          // Only filter out completely empty lines, keep lines with just spaces for now
                          const options = allLines.map(line => line.trimEnd()); // Remove trailing spaces but keep the line
                          updateDropdownOptions(item.id!, options);
                        }}
                        placeholder="Option 1
Option 2
Option 3"
                        className="w-full p-2 border border-gray-300 rounded-md h-24"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Correct Answer</label>
                      <select
                        value={item.correctAnswer}
                        onChange={(e) => handleDropdownItemChange(item.id!, "correctAnswer", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                        required
                      >
                        <option value="">Select correct answer...</option>
                        {item.options.filter(opt => opt.trim() !== '').map((option, optIndex) => (
                          <option key={optIndex} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="text-sm text-gray-500">
                Create statements with dropdown options. Each statement should have multiple options with one correct answer. Type each option on a separate line in the options box.
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                isSubmitting ||
                categories.length === 0 || 
                !formData.text ||
                ((formData.type === "multiple_choice" || formData.type === "single_choice") && 
                  (!formData.answers || formData.answers.length < 2 || formData.answers.some(a => !a.text) || !formData.answers.some(a => a.isCorrect))) ||
                (formData.type === "dropdown" && 
                  (!formData.dropdownItems || formData.dropdownItems.length < 1 || 
                   formData.dropdownItems.some(d => !d.statement || !d.correctAnswer || d.options.filter(opt => opt.trim()).length < 2)))
              }
            >
              {isSubmitting ? 'Saving...' : (initialData ? "Update Question" : "Create Question")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}