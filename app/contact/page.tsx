"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertCircle, MessageCircle, HelpCircle, ArrowRight } from "lucide-react";
import { Footer } from "../components/Footer";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    // Reset form after successful submission
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };

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
              <MessageCircle className="h-4 w-4 text-[#3EB3E7] mr-2" />
              <span className="text-sm font-medium text-[#3EB3E7]">
                We're Here to Help
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="block">Contact</span>
              <span className="block text-[#3EB3E7] mt-2">
                Our Team
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              Have questions about Practice ERP? We're here to help you succeed in your certification journey
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-[#B1E5D3] mr-2" />
                <span className="text-sm">24/7 Support</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-[#B1E5D3] mr-2" />
                <span className="text-sm">Quick Response</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-[#B1E5D3] mr-2" />
                <span className="text-sm">Expert Support</span>
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

      {/* Contact Form and Info Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-[#F6F7FA] rounded-lg p-8">
              <h2 className="text-2xl font-bold text-[#0B1F3A] mb-6">Send us a Message</h2>
              
              {isSubmitted ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Message Sent Successfully!</h3>
                  <p className="text-green-700">
                    Thank you for contacting us. We'll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[#0B1F3A] mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3EB3E7] focus:border-[#3EB3E7] transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-[#0B1F3A] mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3EB3E7] focus:border-[#3EB3E7] transition-colors"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-[#0B1F3A] mb-2">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3EB3E7] focus:border-[#3EB3E7] transition-colors"
                    >
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="technical">Technical Support</option>
                      <option value="billing">Billing Question</option>
                      <option value="feedback">Feedback</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-[#0B1F3A] mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3EB3E7] focus:border-[#3EB3E7] transition-colors resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#3EB3E7] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#2da0d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-[#0B1F3A] mb-6">Get in Touch</h2>
                <p className="text-[#5C677D] mb-8">
                  We're committed to providing exceptional support to help you succeed. Whether you have questions about our platform, need technical assistance, or want to share feedback, we're here for you.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-[#3EB3E7] bg-opacity-20 rounded-lg p-3 mr-4">
                    <Mail className="h-6 w-6 text-[#3EB3E7]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B1F3A] mb-1">Email Support</h3>
                    <p className="text-[#5C677D] mb-2">For general inquiries and support</p>
                    <a href="mailto:support@practiceerp.com" className="text-[#3EB3E7] hover:text-[#2da0d4] font-medium">
                      support@practiceerp.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-[#B1E5D3] bg-opacity-50 rounded-lg p-3 mr-4">
                    <Phone className="h-6 w-6 text-[#0B1F3A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B1F3A] mb-1">Phone Support</h3>
                    <p className="text-[#5C677D] mb-2">Monday - Friday, 9AM - 6PM PST</p>
                    <a href="tel:+1-555-123-4567" className="text-[#3EB3E7] hover:text-[#2da0d4] font-medium">
                      +1 (555) 123-4567
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-[#3EB3E7] bg-opacity-20 rounded-lg p-3 mr-4">
                    <MapPin className="h-6 w-6 text-[#3EB3E7]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B1F3A] mb-1">Office Address</h3>
                    <p className="text-[#5C677D]">
                      123 Business Park Drive<br />
                      Suite 100<br />
                      San Francisco, CA 94105
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-[#B1E5D3] bg-opacity-50 rounded-lg p-3 mr-4">
                    <Clock className="h-6 w-6 text-[#0B1F3A]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#0B1F3A] mb-1">Business Hours</h3>
                    <div className="text-[#5C677D] space-y-1">
                      <p>Monday - Friday: 9:00 AM - 6:00 PM PST</p>
                      <p>Saturday: 10:00 AM - 4:00 PM PST</p>
                      <p>Sunday: Closed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links Section */}
      <section className="py-16 bg-[#F6F7FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1F3A] mb-4">
              Looking for Something Specific?
            </h2>
            <p className="text-xl text-[#5C677D] max-w-3xl mx-auto">
              Check out these helpful resources for quick answers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/faqs" className="group">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[#3EB3E7] bg-opacity-20 text-[#3EB3E7] rounded-lg mb-4">
                  <HelpCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[#0B1F3A] group-hover:text-[#3EB3E7] transition-colors">
                  FAQs
                </h3>
                <p className="text-[#5C677D] text-sm">
                  Find answers to common questions about our platform
                </p>
              </div>
            </Link>

            <Link href="/support" className="group">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[#B1E5D3] bg-opacity-50 text-[#0B1F3A] rounded-lg mb-4">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[#0B1F3A] group-hover:text-[#3EB3E7] transition-colors">
                  Support Center
                </h3>
                <p className="text-[#5C677D] text-sm">
                  Access our comprehensive help center and guides
                </p>
              </div>
            </Link>

            <Link href="/study-guide" className="group">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[#3EB3E7] bg-opacity-20 text-[#3EB3E7] rounded-lg mb-4">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[#0B1F3A] group-hover:text-[#3EB3E7] transition-colors">
                  Study Guide
                </h3>
                <p className="text-[#5C677D] text-sm">
                  Get tips and strategies for effective exam preparation
                </p>
              </div>
            </Link>

            <Link href="/dashboard" className="group">
              <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-1">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[#B1E5D3] bg-opacity-50 text-[#0B1F3A] rounded-lg mb-4">
                  <ArrowRight className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[#0B1F3A] group-hover:text-[#3EB3E7] transition-colors">
                  Dashboard
                </h3>
                <p className="text-[#5C677D] text-sm">
                  Access your account and practice tests
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}