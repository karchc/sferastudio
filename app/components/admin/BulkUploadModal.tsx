"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/app/components/ui/button";

interface ImportResult {
  success: boolean;
  testsCreated?: number;
  categoriesCreated?: number;
  questionsCreated?: number;
  errors?: string[];
  warnings?: string[];
  details?: {
    testName: string;
    testId: string;
    categories: number;
    questions: number;
  }[];
  message?: string;
  error?: string;
}

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkUploadModal({ isOpen, onClose, onSuccess }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      setFile(droppedFile);
      setResult(null);
    } else {
      setResult({
        success: false,
        error: 'Please upload an Excel file (.xlsx or .xls)'
      });
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  }, []);

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/tests/import', {
        method: 'POST',
        body: formData
      });

      const data: ImportResult = await response.json();
      setResult(data);

      if (data.success) {
        // Refresh the tests list after successful import
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to upload file. Please try again.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Bulk Upload Tests</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto max-h-[60vh]">
          {!result ? (
            <>
              {/* Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : file
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {file ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      onClick={handleReset}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-gray-900">
                      Drop your Excel file here
                    </p>
                    <p className="text-sm text-gray-500">or</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Browse files
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Instructions</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>1. Download the template using the "Download Template" button</li>
                  <li>2. Fill in your test data following the template structure</li>
                  <li>3. Upload the completed Excel file here</li>
                  <li>4. Review any warnings or errors before finalizing</li>
                </ul>
              </div>
            </>
          ) : (
            /* Results */
            <div className="space-y-4">
              {result.success ? (
                <>
                  {/* Success Header */}
                  <div className="flex items-center space-x-3 text-green-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xl font-semibold">Import Successful!</span>
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-blue-600">{result.testsCreated}</p>
                      <p className="text-sm text-gray-600">Tests Created</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-green-600">{result.categoriesCreated}</p>
                      <p className="text-sm text-gray-600">Categories</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold text-purple-600">{result.questionsCreated}</p>
                      <p className="text-sm text-gray-600">Questions</p>
                    </div>
                  </div>

                  {/* Test Details */}
                  {result.details && result.details.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b">
                        <h4 className="font-medium text-gray-900">Created Tests</h4>
                      </div>
                      <div className="divide-y">
                        {result.details.map((detail, idx) => (
                          <div key={idx} className="px-4 py-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium text-gray-900">{detail.testName}</p>
                              <p className="text-sm text-gray-500">
                                {detail.categories} categories, {detail.questions} questions
                              </p>
                            </div>
                            <span className="text-xs text-gray-400 font-mono">{detail.testId.slice(0, 8)}...</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings && result.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">Warnings</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {result.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Error Header */}
                  <div className="flex items-center space-x-3 text-red-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-xl font-semibold">
                      {result.message || result.error || 'Import Failed'}
                    </span>
                  </div>

                  {/* Errors */}
                  {result.errors && result.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-2">Errors ({result.errors.length})</h4>
                      <ul className="text-sm text-red-700 space-y-1 max-h-48 overflow-y-auto">
                        {result.errors.map((error, idx) => (
                          <li key={idx} className="flex items-start">
                            <span className="mr-2">-</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {result.warnings && result.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-800 mb-2">Warnings ({result.warnings.length})</h4>
                      <ul className="text-sm text-yellow-700 space-y-1 max-h-32 overflow-y-auto">
                        {result.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Retry button */}
                  <div className="pt-2">
                    <button
                      onClick={handleReset}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Try with a different file
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          {!result ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload & Import'}
              </Button>
            </>
          ) : result.success ? (
            <Button onClick={handleClose}>
              Done
            </Button>
          ) : (
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
