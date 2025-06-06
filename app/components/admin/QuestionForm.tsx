"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Question, QuestionType, Answer, MatchItem, Category } from "@/app/lib/types";
import { generateMockId } from "@/app/components/admin/MockData";

interface QuestionFormProps {
  initialData?: Question;
  categories: Category[];
  onSubmit: (data: Question) => void;
  onCancel: () => void;
}

export function QuestionForm({ initialData, categories, onSubmit, onCancel }: QuestionFormProps) {
  const [formData, setFormData] = useState<Question>(
    initialData || {
      id: generateMockId(),
      text: "",
      type: "multiple-choice",
      categoryId: categories[0]?.id || "",
      answers: [
        { id: generateMockId(), questionId: generateMockId(), text: "", isCorrect: false },
        { id: generateMockId(), questionId: generateMockId(), text: "", isCorrect: false },
        { id: generateMockId(), questionId: generateMockId(), text: "", isCorrect: false },
        { id: generateMockId(), questionId: generateMockId(), text: "", isCorrect: false }
      ] as Answer[]
    }
  );

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
      [name]: value,
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as QuestionType;
    
    setFormData(prev => {
      const updated = { ...prev, type: newType };
      
      // Initialize appropriate answer format based on question type
      if (newType === "multiple-choice" || newType === "single-choice") {
        updated.answers = prev.answers?.length ? prev.answers : [
          { id: generateMockId(), questionId: prev.id, text: "", isCorrect: false },
          { id: generateMockId(), questionId: prev.id, text: "", isCorrect: false },
          { id: generateMockId(), questionId: prev.id, text: "", isCorrect: false },
          { id: generateMockId(), questionId: prev.id, text: "", isCorrect: false }
        ] as Answer[];
      } else if (newType === "matching") {
        updated.answers = (prev.answers as MatchItem[])?.length ? prev.answers : [
          { id: generateMockId(), questionId: prev.id, leftText: "", rightText: "" },
          { id: generateMockId(), questionId: prev.id, leftText: "", rightText: "" },
          { id: generateMockId(), questionId: prev.id, leftText: "", rightText: "" },
          { id: generateMockId(), questionId: prev.id, leftText: "", rightText: "" }
        ];
      }
      
      return updated;
    });
  };

  // Multiple choice answer management
  const handleAnswerChange = (id: string, field: keyof Answer, value: string | boolean) => {
    setFormData(prev => {
      const answers = [...((prev.answers as Answer[]) || [])] as Answer[];
      const index = answers.findIndex(a => a.id === id);
      
      if (index !== -1) {
        // For isCorrect field in single-choice questions, handle radio button behavior
        if (field === 'isCorrect' && prev.type === 'single-choice' && value === true) {
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
      answers: [...((prev.answers as Answer[]) || []), { id: generateMockId(), questionId: prev.id, text: "", isCorrect: false }] as Answer[]
    }));
  };

  const removeAnswer = (id: string) => {
    setFormData(prev => ({
      ...prev,
      answers: ((prev.answers as Answer[]) || []).filter(a => a.id !== id)
    }));
  };

  // Matching items management
  const handleMatchItemChange = (id: string, field: keyof MatchItem, value: string) => {
    setFormData(prev => {
      const matchItems = [...((prev.answers as MatchItem[]) || [])];
      const index = matchItems.findIndex(item => item.id === id);
      
      if (index !== -1) {
        matchItems[index] = { ...matchItems[index], [field]: value };
      }
      
      return { ...prev, answers: matchItems };
    });
  };

  const addMatchItem = () => {
    setFormData(prev => ({
      ...prev,
      answers: [...((prev.answers as MatchItem[]) || []), { id: generateMockId(), questionId: prev.id, leftText: "", rightText: "" }]
    }));
  };

  const removeMatchItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      answers: ((prev.answers as MatchItem[]) || []).filter(item => item.id !== id)
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

          <div className="grid grid-cols-2 gap-4">
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
                <option value="multiple-choice">Multiple Choice</option>
                <option value="single-choice">Single Choice</option>
                <option value="matching">Matching</option>
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
          </div>

          {/* Multiple choice answers */}
          {(formData.type === "multiple-choice" || formData.type === "single-choice") && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium">Answers</h3>
                <Button type="button" variant="outline" onClick={addAnswer}>
                  Add Answer
                </Button>
              </div>
              
              {((formData.answers as Answer[]) || []).map((answer, index) => (
                <div key={answer.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={answer.isCorrect}
                    onChange={(e) => handleAnswerChange(answer.id, "isCorrect", e.target.checked)}
                    className="h-4 w-4"
                  />
                  <textarea
                    value={answer.text}
                    onChange={(e) => handleAnswerChange(answer.id, "text", e.target.value)}
                    placeholder={`Answer ${index + 1} (You can use line breaks and bullet points with - or * symbols)`}
                    className="flex-1 p-2 border border-gray-300 rounded-md min-h-[80px]"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeAnswer(answer.id)}
                    disabled={(formData.answers || []).length <= 2}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              <div className="text-sm text-gray-500">
                <p>Check the box next to correct answer(s). You must have at least 2 answers.</p>
                <p className="mt-1">Formatting tips:</p>
                <ul className="list-disc pl-6 mt-1">
                  <li>Use line breaks for paragraph separation</li>
                  <li>Use - or * at start of line for bullet points</li>
                  <li>Example: "Business Expense<br/>- Operational expenditure<br/>- Capital expenditure"</li>
                </ul>
              </div>
            </div>
          )}

          {/* Matching items */}
          {formData.type === "matching" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-medium">Matching Items</h3>
                <Button type="button" variant="outline" onClick={addMatchItem}>
                  Add Item
                </Button>
              </div>
              
              {((formData.answers as MatchItem[]) || []).map((item, index) => (
                <div key={item.id} className="grid grid-cols-5 items-center gap-2">
                  <input
                    type="text"
                    value={item.leftText}
                    onChange={(e) => handleMatchItemChange(item.id, "leftText", e.target.value)}
                    placeholder={`Left Item ${index + 1}`}
                    className="col-span-2 p-2 border border-gray-300 rounded-md"
                    required
                  />
                  <div className="text-center">→</div>
                  <input
                    type="text"
                    value={item.rightText}
                    onChange={(e) => handleMatchItemChange(item.id, "rightText", e.target.value)}
                    placeholder={`Right Item ${index + 1}`}
                    className="col-span-1 p-2 border border-gray-300 rounded-md"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeMatchItem(item.id)}
                    disabled={((formData.answers as MatchItem[]) || []).length <= 2}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              <div className="text-sm text-gray-500">
                Create matching pairs by entering text on the left and right sides. You must have at least 2 pairs.
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={
                categories.length === 0 || 
                !formData.text ||
                ((formData.type === "multiple-choice" || formData.type === "single-choice") && 
                  (!formData.answers || formData.answers.length < 2 || (formData.answers as Answer[]).some(a => !a.text))) ||
                (formData.type === "matching" && (!formData.answers || (formData.answers as MatchItem[]).length < 2 || (formData.answers as MatchItem[]).some(m => !m.leftText || !m.rightText)))
              }
            >
              {initialData ? "Update Question" : "Create Question"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}