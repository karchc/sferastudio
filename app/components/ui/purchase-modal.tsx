"use client";

import { useEffect } from "react";
import { Button } from "./button";
import { Clock, BookOpen, Award } from "lucide-react";
import { formatTimeLimit } from "@/app/lib/formatTimeLimit";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  test: {
    id: string;
    title: string;
    description?: string;
    time_limit: number;
    question_count?: number;
    categories?: Array<{ id: string; name: string }>;
  };
  isLoading?: boolean;
}

export function PurchaseModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  test, 
  isLoading = false 
}: PurchaseModalProps) {
  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-auto transform transition-all">
          {/* Content */}
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Award className="h-6 w-6 text-[#3EB3E7]" />
              <h3 className="text-lg font-semibold text-[#0B1F3A]">
                Add Test to Your Library
              </h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              Confirm adding this test to your personal library for unlimited access.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 mb-4">
              <h4 className="font-semibold text-[#0B1F3A]">{test.title}</h4>
              
              {test.description && (
                <p className="text-sm text-[#5C677D] line-clamp-2">
                  {test.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-[#5C677D]">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTimeLimit(test.time_limit)}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {test.question_count || 25} questions
                </span>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-6">
              <p className="text-sm text-blue-800">
                <strong>🎉 Free during MVP:</strong> This test will be added to your library at no cost. 
                You'll have unlimited access to take it anytime!
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                onClick={onConfirm}
                loading={isLoading}
                loadingText="Adding to library..."
                disabled={isLoading}
                className="w-full sm:w-auto order-1 sm:order-2 bg-[#3EB3E7] hover:bg-[#2da0d4] text-white"
              >
                Add to My Library
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}