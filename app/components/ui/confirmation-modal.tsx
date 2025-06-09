'use client';

import { useEffect } from 'react';
import { Button } from './button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmationModalProps) {
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

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: '⚠️',
          confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
          titleClass: 'text-red-800'
        };
      case 'warning':
        return {
          icon: '⚠️',
          confirmButtonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          titleClass: 'text-yellow-800'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
          titleClass: 'text-blue-800'
        };
      default:
        return {
          icon: '⚠️',
          confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white',
          titleClass: 'text-red-800'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 backdrop-blur-md transition-all duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto transform transition-all">
          {/* Content */}
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-2xl">{styles.icon}</div>
              <h3 className={`text-lg font-semibold ${styles.titleClass}`}>
                {title}
              </h3>
            </div>
            
            <p className="text-gray-700 mb-6 leading-relaxed">
              {message}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                {cancelText}
              </Button>
              <Button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`w-full sm:w-auto order-1 sm:order-2 ${styles.confirmButtonClass}`}
              >
                {confirmText}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}