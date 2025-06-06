"use client";

import { useEffect, useState } from "react";

export default function TestLoading() {
  const [countdown, setCountdown] = useState(30);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => Math.max(0, prev - 1));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <main className="py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
              <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
              </span>
            </div>
            <p className="mt-6 text-lg font-semibold">Loading Test Data...</p>
            <p className="mt-2 text-gray-600">This may take a few moments as we retrieve your test from the database.</p>
            
            <div className="mt-6 px-4 py-2 bg-gray-50 rounded-md inline-block">
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-sm">Connecting to database {countdown > 0 ? `(${countdown}s)` : ""}</span>
              </div>
            </div>
            
            {countdown === 0 && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                <p className="font-medium">Taking longer than expected?</p>
                <p className="mt-1">We're still trying to connect to the database. Please be patient.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}