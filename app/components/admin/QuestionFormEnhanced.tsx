"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Question, QuestionType, Answer, MatchItem, SequenceItem, DragDropItem, Category, QuestionFormData } from "@/app/lib/types";
import { generateMockId } from "@/app/components/admin/MockData";

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
        categoryId: initialData.category_id || categories[0]?.id || "",
        difficulty: initialData.difficulty || 'medium',
        points: initialData.points || 1,
        explanation: initialData.explanation || '',
        answers: initialData.answers,
        matchItems: initialData.matchItems,
        sequenceItems: initialData.sequenceItems,
        dragDropItems: initialData.dragDropItems
      };
    }
    
    return {
      text: "",
      type: "single_choice",
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
        delete updated.matchItems;
        delete updated.sequenceItems;
        delete updated.dragDropItems;
      } else if (newType === "true_false") {
        updated.answers = [
          { id: generateMockId(), text: "True", isCorrect: false, position: 0 },
          { id: generateMockId(), text: "False", isCorrect: false, position: 1 }
        ];
        delete updated.matchItems;
        delete updated.sequenceItems;
        delete updated.dragDropItems;
      } else if (newType === "matching") {
        updated.matchItems = prev.matchItems?.length ? prev.matchItems : [
          { id: generateMockId(), leftText: "", rightText: "" },
          { id: generateMockId(), leftText: "", rightText: "" },
          { id: generateMockId(), leftText: "", rightText: "" },
          { id: generateMockId(), leftText: "", rightText: "" }
        ];
        delete updated.answers;
        delete updated.sequenceItems;
        delete updated.dragDropItems;
      } else if (newType === "sequence") {
        updated.sequenceItems = prev.sequenceItems?.length ? prev.sequenceItems : [
          { id: generateMockId(), text: "", correctPosition: 1 },
          { id: generateMockId(), text: "", correctPosition: 2 },
          { id: generateMockId(), text: "", correctPosition: 3 },
          { id: generateMockId(), text: "", correctPosition: 4 }
        ];
        delete updated.answers;
        delete updated.matchItems;
        delete updated.dragDropItems;
      } else if (newType === "drag_drop") {
        updated.dragDropItems = prev.dragDropItems?.length ? prev.dragDropItems : [
          { id: generateMockId(), content: "", targetZone: "Zone A" },
          { id: generateMockId(), content: "", targetZone: "Zone A" },
          { id: generateMockId(), content: "", targetZone: "Zone B" },
          { id: generateMockId(), content: "", targetZone: "Zone B" }
        ];
        delete updated.answers;
        delete updated.matchItems;
        delete updated.sequenceItems;
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

  // Matching items management
  const handleMatchItemChange = (id: string, field: keyof MatchItem, value: string) => {
    setFormData(prev => {
      const matchItems = [...(prev.matchItems || [])];
      const index = matchItems.findIndex(item => item.id === id);
      
      if (index !== -1) {
        matchItems[index] = { ...matchItems[index], [field]: value };
      }
      
      return { ...prev, matchItems };
    });
  };

  const addMatchItem = () => {
    setFormData(prev => ({
      ...prev,
      matchItems: [...(prev.matchItems || []), { id: generateMockId(), leftText: "", rightText: "" }]
    }));
  };

  const removeMatchItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      matchItems: (prev.matchItems || []).filter(item => item.id !== id)
    }));
  };

  // Sequence items management
  const handleSequenceItemChange = (id: string, text: string) => {
    setFormData(prev => {
      const sequenceItems = [...(prev.sequenceItems || [])];
      const index = sequenceItems.findIndex(item => item.id === id);
      
      if (index !== -1) {
        sequenceItems[index] = { ...sequenceItems[index], text };
      }
      
      return { ...prev, sequenceItems };
    });
  };

  const moveSequenceItem = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const sequenceItems = [...(prev.sequenceItems || [])];
      if (direction === 'up' && index > 0) {
        [sequenceItems[index], sequenceItems[index - 1]] = [sequenceItems[index - 1], sequenceItems[index]];
      } else if (direction === 'down' && index < sequenceItems.length - 1) {
        [sequenceItems[index], sequenceItems[index + 1]] = [sequenceItems[index + 1], sequenceItems[index]];
      }
      
      // Update correct positions
      sequenceItems.forEach((item, idx) => {
        item.correctPosition = idx + 1;
      });
      
      return { ...prev, sequenceItems };
    });
  };

  const addSequenceItem = () => {
    setFormData(prev => ({
      ...prev,
      sequenceItems: [...(prev.sequenceItems || []), { 
        id: generateMockId(), 
        text: "", 
        correctPosition: (prev.sequenceItems?.length || 0) + 1 
      }]
    }));
  };

  const removeSequenceItem = (id: string) => {
    setFormData(prev => {
      const filtered = (prev.sequenceItems || []).filter(item => item.id !== id);
      // Update positions
      filtered.forEach((item, idx) => {
        item.correctPosition = idx + 1;
      });
      return { ...prev, sequenceItems: filtered };
    });
  };

  // Drag drop items management
  const handleDragDropItemChange = (id: string, field: keyof DragDropItem, value: string) => {
    setFormData(prev => {
      const dragDropItems = [...(prev.dragDropItems || [])];
      const index = dragDropItems.findIndex(item => item.id === id);
      
      if (index !== -1) {
        dragDropItems[index] = { ...dragDropItems[index], [field]: value };
      }
      
      return { ...prev, dragDropItems };
    });
  };

  const addDragDropItem = () => {
    setFormData(prev => ({
      ...prev,
      dragDropItems: [...(prev.dragDropItems || []), { id: generateMockId(), content: "", targetZone: "Zone A" }]
    }));
  };

  const removeDragDropItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      dragDropItems: (prev.dragDropItems || []).filter(item => item.id !== id)
    }));
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
                <option value="true_false">True/False</option>
                <option value="matching">Matching</option>
                <option value="sequence">Sequence</option>
                <option value="drag_drop">Drag and Drop</option>
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

          {/* True/False */}
          {formData.type === "true_false" && (
            <div className="space-y-4">
              <h3 className="text-md font-medium">Select the correct answer</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="trueFalseAnswer"
                    checked={formData.answers?.[0]?.isCorrect === true}
                    onChange={() => {
                      setFormData(prev => ({
                        ...prev,
                        answers: [
                          { ...prev.answers![0], isCorrect: true },
                          { ...prev.answers![1], isCorrect: false }
                        ]
                      }));
                    }}
                    className="h-4 w-4"
                  />
                  <span>True</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="trueFalseAnswer"
                    checked={formData.answers?.[1]?.isCorrect === true}
                    onChange={() => {
                      setFormData(prev => ({
                        ...prev,
                        answers: [
                          { ...prev.answers![0], isCorrect: false },
                          { ...prev.answers![1], isCorrect: true }
                        ]
                      }));
                    }}
                    className="h-4 w-4"
                  />
                  <span>False</span>
                </label>
              </div>
            </div>
          )}

          {/* Matching items */}
          {formData.type === "matching" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium">Matching Pairs</h3>
                <Button type="button" variant="outline" size="sm" onClick={addMatchItem}>
                  Add Pair
                </Button>
              </div>
              
              {(formData.matchItems || []).map((item, index) => (
                <div key={item.id} className="grid grid-cols-5 items-center gap-2">
                  <input
                    type="text"
                    value={item.leftText}
                    onChange={(e) => handleMatchItemChange(item.id!, "leftText", e.target.value)}
                    placeholder={`Left Item ${index + 1}`}
                    className="col-span-2 p-2 border border-gray-300 rounded-md"
                    required
                  />
                  <div className="text-center">→</div>
                  <input
                    type="text"
                    value={item.rightText}
                    onChange={(e) => handleMatchItemChange(item.id!, "rightText", e.target.value)}
                    placeholder={`Right Item ${index + 1}`}
                    className="col-span-1 p-2 border border-gray-300 rounded-md"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMatchItem(item.id!)}
                    disabled={(formData.matchItems || []).length <= 2}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              <div className="text-sm text-gray-500">
                Create matching pairs. You must have at least 2 pairs.
              </div>
            </div>
          )}

          {/* Sequence items */}
          {formData.type === "sequence" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium">Sequence Items (in correct order)</h3>
                <Button type="button" variant="outline" size="sm" onClick={addSequenceItem}>
                  Add Item
                </Button>
              </div>
              
              {(formData.sequenceItems || []).map((item, index) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <span className="text-sm font-medium w-6">{index + 1}.</span>
                  <input
                    type="text"
                    value={item.text}
                    onChange={(e) => handleSequenceItemChange(item.id!, e.target.value)}
                    placeholder={`Step ${index + 1}`}
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                    required
                  />
                  <div className="flex space-x-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => moveSequenceItem(index, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => moveSequenceItem(index, 'down')}
                      disabled={index === (formData.sequenceItems?.length || 0) - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSequenceItem(item.id!)}
                      disabled={(formData.sequenceItems || []).length <= 2}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="text-sm text-gray-500">
                Enter items in the correct sequence order. Use the arrows to reorder. You must have at least 2 items.
              </div>
            </div>
          )}

          {/* Drag and drop items */}
          {formData.type === "drag_drop" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium">Drag and Drop Items</h3>
                <Button type="button" variant="outline" size="sm" onClick={addDragDropItem}>
                  Add Item
                </Button>
              </div>
              
              {(formData.dragDropItems || []).map((item, index) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={item.content}
                    onChange={(e) => handleDragDropItemChange(item.id!, "content", e.target.value)}
                    placeholder={`Item ${index + 1}`}
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                    required
                  />
                  <select
                    value={item.targetZone}
                    onChange={(e) => handleDragDropItemChange(item.id!, "targetZone", e.target.value)}
                    className="p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="Zone A">Zone A</option>
                    <option value="Zone B">Zone B</option>
                    <option value="Zone C">Zone C</option>
                    <option value="Zone D">Zone D</option>
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDragDropItem(item.id!)}
                    disabled={(formData.dragDropItems || []).length <= 2}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              <div className="text-sm text-gray-500">
                Define items and their target zones. You must have at least 2 items.
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
                (formData.type === "true_false" && (!formData.answers || !formData.answers.some(a => a.isCorrect))) ||
                (formData.type === "matching" && (!formData.matchItems || formData.matchItems.length < 2 || formData.matchItems.some(m => !m.leftText || !m.rightText))) ||
                (formData.type === "sequence" && (!formData.sequenceItems || formData.sequenceItems.length < 2 || formData.sequenceItems.some(s => !s.text))) ||
                (formData.type === "drag_drop" && (!formData.dragDropItems || formData.dragDropItems.length < 2 || formData.dragDropItems.some(d => !d.content)))
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