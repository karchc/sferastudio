"use client";

import Link from "next/link";
import { Search, BookOpen, MessageCircle, Settings, Shield, CreditCard, Users, ArrowRight, ExternalLink, CheckCircle, Clock, HelpCircle } from "lucide-react";
import { Footer } from "../components/Footer";

const supportCategories = [
  {
    title: "Getting Started",
    description: "Learn the basics of using Practice SAP",
    icon: BookOpen,
    color: "bg-[#3EB3E7]",
    articles: [
      { title: "Creating Your Account", link: "#" },
      { title: "Taking Your First Practice Test", link: "#" },
      { title: "Understanding Your Results", link: "#" },
      { title: "Navigating the Dashboard", link: "#" }
    ]
  },
  {
    title: "Account & Profile",
    description: "Manage your account settings and profile",
    icon: Settings,
    color: "bg-[#B1E5D3]",
    articles: [
      { title: "Updating Your Profile", link: "#" },
      { title: "Changing Your Password", link: "#" },
      { title: "Email Preferences", link: "#" },
      { title: "Account Deactivation", link: "#" }
    ]
  },
  {
    title: "Billing & Payments",
    description: "Information about subscriptions and payments",
    icon: CreditCard,
    color: "bg-[#3EB3E7]",
    articles: [
      { title: "Subscription Plans", link: "#" },
      { title: "Payment Methods", link: "#" },
      { title: "Refund Policy", link: "#" },
      { title: "Billing History", link: "#" }
    ]
  },
  {
    title: "Tests & Exams",
    description: "Everything about practice tests and exams",
    icon: MessageCircle,
    color: "bg-[#B1E5D3]",
    articles: [
      { title: "Test Types Available", link: "#" },
      { title: "Time Limits and Scoring", link: "#" },
      { title: "Retaking Tests", link: "#" },
      { title: "Test Results Analysis", link: "#" }
    ]
  },
  {
    title: "Technical Support",
    description: "Troubleshooting and technical issues",
    icon: Shield,
    color: "bg-[#3EB3E7]",
    articles: [
      { title: "Browser Compatibility", link: "#" },
      { title: "Connection Issues", link: "#" },
      { title: "Mobile App Problems", link: "#" },
      { title: "Performance Issues", link: "#" }
    ]
  },
  {
    title: "Community & Resources",
    description: "Connect with other users and resources",
    icon: Users,
    color: "bg-[#B1E5D3]",
    articles: [
      { title: "Study Groups", link: "#" },
      { title: "Discussion Forums", link: "#" },
      { title: "Success Stories", link: "#" },
      { title: "Best Practices", link: "#" }
    ]
  }
];

const quickActions = [
  {
    title: "Contact Support",
    description: "Get help from our support team",
    icon: MessageCircle,
    link: "/contact",
    color: "bg-[#3EB3E7]"
  },
  {
    title: "Check System Status",
    description: "View current system status and updates",
    icon: Shield,
    link: "#",
    color: "bg-green-500"
  },
  {
    title: "Report a Bug",
    description: "Let us know about any issues you've found",
    icon: ExternalLink,
    link: "#",
    color: "bg-orange-500"
  }
];

export default function Support() {
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
              <HelpCircle className="h-4 w-4 text-[#3EB3E7] mr-2" />
              <span className="text-sm font-medium text-[#3EB3E7]">
                Help & Support Center
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="block">Support</span>
              <span className="block text-[#3EB3E7] mt-2">
                Center
              </span>
            </h1>
            
            <p className="text-xl sm:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              Find answers, get help, and learn how to make the most of Practice SAP
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-[#B1E5D3] mr-2" />
                <span className="text-sm">24/7 Available</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-[#B1E5D3] mr-2" />
                <span className="text-sm">Expert Guides</span>
              </div>
              <div className="flex items-center">
                <Users className="h-5 w-5 text-[#B1E5D3] mr-2" />
                <span className="text-sm">Community Support</span>
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

      {/* Quick Actions Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#0B1F3A] mb-4">
              Quick Actions
            </h2>
            <p className="text-xl text-[#5C677D] max-w-3xl mx-auto">
              Need immediate help? Try these quick actions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.link} className="group">
                <div className="bg-[#F6F7FA] rounded-lg p-6 hover:shadow-lg transition-all transform hover:-translate-y-1 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 ${action.color} text-white rounded-full mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-[#0B1F3A] group-hover:text-[#3EB3E7] transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-[#5C677D] text-sm">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Support Categories Section */}
      <section className="py-16 bg-[#F6F7FA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1F3A] mb-4">
              Browse Help Topics
            </h2>
            <p className="text-xl text-[#5C677D] max-w-3xl mx-auto">
              Find detailed guides and articles organized by topic
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {supportCategories.map((category, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 ${category.color} ${category.color === 'bg-[#B1E5D3]' ? 'text-[#0B1F3A]' : 'text-white'} rounded-lg mr-4`}>
                      <category.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#0B1F3A]">
                      {category.title}
                    </h3>
                  </div>
                  <p className="text-[#5C677D] mb-6">
                    {category.description}
                  </p>
                  <ul className="space-y-2">
                    {category.articles.map((article, articleIndex) => (
                      <li key={articleIndex}>
                        <a
                          href={article.link}
                          className="text-[#3EB3E7] hover:text-[#2da0d4] text-sm flex items-center group"
                        >
                          <ArrowRight className="h-3 w-3 mr-2 group-hover:translate-x-1 transition-transform" />
                          {article.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#0B1F3A] mb-4">
              Popular Articles
            </h2>
            <p className="text-xl text-[#5C677D] max-w-3xl mx-auto">
              The most helpful articles from our community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#F6F7FA] rounded-lg p-6">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Getting Started Guides
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#3EB3E7] mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <a href="#" className="text-[#0B1F3A] hover:text-[#3EB3E7] font-medium">
                      How to Create Your First Practice Test
                    </a>
                    <p className="text-sm text-[#5C677D] mt-1">
                      Step-by-step guide to getting started with Practice SAP
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#3EB3E7] mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <a href="#" className="text-[#0B1F3A] hover:text-[#3EB3E7] font-medium">
                      Understanding Your Test Results
                    </a>
                    <p className="text-sm text-[#5C677D] mt-1">
                      Learn how to interpret your performance analytics
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#3EB3E7] mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <a href="#" className="text-[#0B1F3A] hover:text-[#3EB3E7] font-medium">
                      Optimizing Your Study Schedule
                    </a>
                    <p className="text-sm text-[#5C677D] mt-1">
                      Tips for effective exam preparation and time management
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-[#F6F7FA] rounded-lg p-6">
              <h3 className="text-xl font-semibold text-[#0B1F3A] mb-4">
                Troubleshooting
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#3EB3E7] mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <a href="#" className="text-[#0B1F3A] hover:text-[#3EB3E7] font-medium">
                      Fixing Connection Issues
                    </a>
                    <p className="text-sm text-[#5C677D] mt-1">
                      Resolve common connectivity problems
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#3EB3E7] mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <a href="#" className="text-[#0B1F3A] hover:text-[#3EB3E7] font-medium">
                      Browser Compatibility Issues
                    </a>
                    <p className="text-sm text-[#5C677D] mt-1">
                      Ensure your browser works perfectly with our platform
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-[#3EB3E7] mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <a href="#" className="text-[#0B1F3A] hover:text-[#3EB3E7] font-medium">
                      Payment and Billing Problems
                    </a>
                    <p className="text-sm text-[#5C677D] mt-1">
                      Get help with subscription and payment issues
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-16 bg-gradient-to-r from-[#0B1F3A] to-[#1a3454]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Still Need Help?
          </h2>
          <p className="text-xl text-white opacity-90 mb-8">
            Our support team is here to help you succeed. Get in touch with us today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-md text-[#0B1F3A] bg-white hover:bg-[#F6F7FA] transition-all transform hover:scale-105 shadow-lg"
            >
              Contact Support
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              href="/faqs"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-white hover:bg-white hover:text-[#0B1F3A] transition-all rounded-md font-medium"
            >
              View FAQs
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}