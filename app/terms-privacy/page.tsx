"use client";

import Link from "next/link";
import { Shield, Lock, Eye, FileText, Clock, CheckCircle, ArrowRight, Mail } from "lucide-react";
import { Footer } from "../components/Footer";

export default function TermsPrivacy() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#0B1F3A] via-[#1a3454] to-[#0f2847] text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F3A]/90 to-[#1a3454]/90"></div>
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-[#3EB3E7]/10 rounded-full animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-[#B1E5D3]/20 rounded-lg animate-bounce delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-16 h-16 bg-[#3EB3E7]/15 rotate-45 animate-spin delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-[#3EB3E7]/20 backdrop-blur-sm rounded-full border border-[#3EB3E7]/30 mb-6">
              <Shield className="h-4 w-4 text-[#3EB3E7] mr-2" />
              <span className="text-sm font-medium text-[#3EB3E7]">
                Legal & Privacy Information
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="block">Terms of Service</span>
              <span className="block text-[#3EB3E7] mt-2">
                & Privacy Policy
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              Your privacy and trust are important to us. Learn about our terms and how we protect your information.
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center">
                <Lock className="h-5 w-5 text-[#B1E5D3] mr-2" />
                <span className="text-sm">Secure & Private</span>
              </div>
              <div className="flex items-center">
                <Eye className="h-5 w-5 text-[#B1E5D3] mr-2" />
                <span className="text-sm">Transparent</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-[#B1E5D3] mr-2" />
                <span className="text-sm">GDPR Compliant</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-20">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 70C840 80 960 100 1080 110C1200 120 1320 120 1380 120L1440 120V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V120Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Last Updated Section */}
      <section className="py-8 bg-[#F6F7FA] border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-[#3EB3E7] mr-2" />
              <span className="text-[#5C677D]">Last updated: December 1, 2024</span>
            </div>
            <div className="text-sm text-[#5C677D]">
              Effective: December 1, 2024
            </div>
          </div>
        </div>
      </section>

      {/* Terms of Service Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="flex items-center mb-4">
              <FileText className="h-8 w-8 text-[#3EB3E7] mr-3" />
              <h2 className="text-3xl font-bold text-[#0B1F3A]">Terms of Service</h2>
            </div>
            <p className="text-[#5C677D] text-lg">
              Please read these Terms of Service carefully before using Practice ERP.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-3">1. Acceptance of Terms</h3>
                <p className="text-[#5C677D] leading-relaxed">
                  By accessing and using Practice ERP ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-3">2. Description of Service</h3>
                <p className="text-[#5C677D] leading-relaxed">
                  Practice ERP is an online platform that provides certification exam preparation services, including practice tests, study materials, and performance analytics for ERP and Business Technology certifications.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-3">3. User Accounts</h3>
                <p className="text-[#5C677D] leading-relaxed mb-3">
                  To access certain features of our Service, you must register for an account. When you register, you agree to:
                </p>
                <ul className="list-disc list-inside text-[#5C677D] space-y-2 ml-4">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain and update your information to keep it accurate</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-3">4. Payment and Billing</h3>
                <p className="text-[#5C677D] leading-relaxed">
                  Certain features of our Service require payment. You agree to pay all fees and charges incurred in connection with your account. All fees are non-refundable except as expressly stated in our refund policy.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-3">5. Intellectual Property</h3>
                <p className="text-[#5C677D] leading-relaxed">
                  The Service and its original content, features, and functionality are and will remain the exclusive property of Practice ERP and its licensors. The Service is protected by copyright, trademark, and other laws.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-3">6. Prohibited Uses</h3>
                <p className="text-[#5C677D] leading-relaxed mb-3">
                  You may not use our Service:
                </p>
                <ul className="list-disc list-inside text-[#5C677D] space-y-2 ml-4">
                  <li>For any unlawful purpose or to solicit others to unlawful acts</li>
                  <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                  <li>To transmit or procure the sending of any advertising or promotional material</li>
                  <li>To impersonate or attempt to impersonate the company, employees, another user, or any other person or entity</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-3">7. Termination</h3>
                <p className="text-[#5C677D] leading-relaxed">
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Policy Section */}
      <section className="py-16 bg-[#F6F7FA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="flex items-center mb-4">
              <Lock className="h-8 w-8 text-[#3EB3E7] mr-3" />
              <h2 className="text-3xl font-bold text-[#0B1F3A]">Privacy Policy</h2>
            </div>
            <p className="text-[#5C677D] text-lg">
              This Privacy Policy describes how we collect, use, and protect your information.
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-3">Information We Collect</h3>
                <p className="text-[#5C677D] leading-relaxed mb-3">
                  We collect information you provide directly to us, such as when you:
                </p>
                <ul className="list-disc list-inside text-[#5C677D] space-y-2 ml-4">
                  <li>Create an account or update your profile</li>
                  <li>Take practice tests or use our services</li>
                  <li>Contact us for support or feedback</li>
                  <li>Subscribe to our newsletter or promotional communications</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-3">How We Use Your Information</h3>
                <p className="text-[#5C677D] leading-relaxed mb-3">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-[#5C677D] space-y-2 ml-4">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Send technical notices, updates, and support messages</li>
                  <li>Provide performance analytics and personalized recommendations</li>
                  <li>Monitor and analyze trends and usage</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-3">Information Sharing</h3>
                <p className="text-[#5C677D] leading-relaxed">
                  We do not sell, trade, or otherwise transfer your personal information to third parties except as described in this policy. We may share your information with service providers who assist us in operating our platform, conducting business, or serving users.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-3">Data Security</h3>
                <p className="text-[#5C677D] leading-relaxed">
                  We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-3">Data Retention</h3>
                <p className="text-[#5C677D] leading-relaxed">
                  We retain your personal information only for as long as necessary to provide our services and fulfill the purposes outlined in this policy, unless a longer retention period is required by law.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-3">Your Rights</h3>
                <p className="text-[#5C677D] leading-relaxed mb-3">
                  Depending on your location, you may have certain rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside text-[#5C677D] space-y-2 ml-4">
                  <li>Access and receive a copy of your personal information</li>
                  <li>Rectify inaccurate personal information</li>
                  <li>Request deletion of your personal information</li>
                  <li>Object to or restrict processing of your personal information</li>
                  <li>Data portability</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-3">Cookies and Tracking</h3>
                <p className="text-[#5C677D] leading-relaxed">
                  We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and improve our services. You can control cookie settings through your browser preferences.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#0B1F3A] mb-3">Changes to This Policy</h3>
                <p className="text-[#5C677D] leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#3EB3E7] to-[#2da0d4] rounded-lg p-8 text-white">
            <Mail className="h-16 w-16 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-4">
              Questions About Our Terms or Privacy?
            </h2>
            <p className="text-xl mb-6 opacity-90">
              We're here to help clarify any questions you may have about our policies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white hover:bg-white hover:text-[#3EB3E7] transition-all rounded-lg font-medium"
              >
                Contact Us
              </Link>
              <Link
                href="/support"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-[#3EB3E7] hover:bg-gray-100 transition-all rounded-lg font-medium"
              >
                Visit Support Center
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 text-sm opacity-75">
              <p>Email us directly at: <a href="mailto:privacy@practiceerp.com" className="underline">privacy@practiceerp.com</a></p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}