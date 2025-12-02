"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth-context";

export function Footer() {
  const { user, profile } = useAuth();

  // Dynamic link for Prep Exam based on user status
  const prepExamHref = !user 
    ? "/auth/login" 
    : profile?.is_admin 
      ? "/admin/dashboard" 
      : "/dashboard";

  return (
    <footer className="bg-[#0B1F3A] text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Practice ERP</h3>
            <p className="text-gray-400">
              Your trusted partner for certification exam preparation
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-gray-400 hover:text-white transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  href={prepExamHref} 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Prep Exam
                </Link>
              </li>
              <li>
                <Link href="/study-guide" className="text-gray-400 hover:text-white transition-colors">
                  Study Guide
                </Link>
              </li>
              <li>
                <Link href="/faqs" className="text-gray-400 hover:text-white transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-400 hover:text-white transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <Link href="/terms-privacy" className="text-gray-400 hover:text-white transition-colors">
                  Terms & Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>&copy; 2024 Practice ERP. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}