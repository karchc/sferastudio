"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  
  return (
    <main className="py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">Test Engine Home</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Available Tests</h2>
            <ul className="space-y-3">
              <li>
                <Link href="/test/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" 
                  className="text-blue-600 hover:underline block p-3 bg-blue-50 rounded-md">
                  JavaScript Basics
                </Link>
              </li>
              <li>
                <Link href="/test/cccccccc-cccc-cccc-cccc-cccccccccccc" 
                  className="text-blue-600 hover:underline block p-3 bg-blue-50 rounded-md">
                  Advanced Algebra
                </Link>
              </li>
              <li>
                <Link href="/test/dddddddd-dddd-dddd-dddd-dddddddddddd" 
                  className="text-blue-600 hover:underline block p-3 bg-blue-50 rounded-md">
                  Basic Chemistry
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Administration</h2>
            <div className="space-y-3">
              <Link href="/admin" 
                className="inline-block w-full text-center py-2 px-4 bg-gray-800 text-white rounded-md hover:bg-gray-700">
                Admin Dashboard
              </Link>
              <Link href="/admin/tests" 
                className="inline-block w-full text-center py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-500">
                Manage Tests
              </Link>
              <Link href="/admin/categories" 
                className="inline-block w-full text-center py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-500">
                Manage Categories
              </Link>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Click on any test to begin or use the admin interface to create new tests.
          </p>
        </div>
      </div>
    </main>
  );
}