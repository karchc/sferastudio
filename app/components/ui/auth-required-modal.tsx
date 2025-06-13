"use client";

import { useEffect } from "react";
import { Button } from "./button";
import { User, UserPlus, LogIn } from "lucide-react";
import Link from "next/link";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  test?: {
    id: string;
    title: string;
  };
}

export function AuthRequiredModal({ 
  isOpen, 
  onClose, 
  test 
}: AuthRequiredModalProps) {
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

  const redirectPath = test ? `/?purchased=${test.id}` : '/';
  const signupUrl = `/auth/signup?redirect=${encodeURIComponent(redirectPath)}`;
  const loginUrl = `/auth/login?redirect=${encodeURIComponent(redirectPath)}`;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto transform transition-all">
          {/* Content */}
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <User className="h-6 w-6 text-[#3EB3E7]" />
              <h3 className="text-lg font-semibold text-[#0B1F3A]">
                Account Required
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                {test ? (
                  <>
                    To add <strong>"{test.title}"</strong> to your library, you need to sign in or create an account.
                  </>
                ) : (
                  "To purchase tests and track your progress, you need to sign in or create an account."
                )}
              </p>
              
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                <p className="text-sm text-blue-800">
                  ✨ <strong>It's free!</strong> Create an account to access your personal test library and track your progress.
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Link href={signupUrl} className="block">
                <Button
                  className="w-full bg-[#3EB3E7] hover:bg-[#2da0d4] text-white"
                  onClick={onClose}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Free Account
                </Button>
              </Link>
              
              <Link href={loginUrl} className="block">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={onClose}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              
              <Button
                variant="ghost"
                onClick={onClose}
                className="w-full text-gray-500"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}