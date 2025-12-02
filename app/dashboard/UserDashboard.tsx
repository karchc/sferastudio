"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { TestData } from "@/app/lib/types";
import { ChevronRight, Clock, Medal, TrendingUp, BookOpen, LineChart, Star, CheckCircle, XCircle } from "lucide-react";

// Sample user data (replace with real data from your backend)
const mockUserData = {
  name: "Jane Smith",
  email: "jane.smith@example.com",
  avatar: "https://i.pravatar.cc/150?u=jane",
  memberSince: "2024-01-15",
  testsCompleted: 12,
  averageScore: 78,
  bestCategory: "ERP Technology",
  inProgressTests: [
    { id: "test1", title: "ERP HANA Fundamentals", progress: 60, questions: 10, lastAccessed: "2024-05-12" },
    { id: "test2", title: "ERP S/4HANA Implementation", progress: 30, questions: 15, lastAccessed: "2024-05-14" }
  ],
  testHistory: [
    { id: "hist1", title: "ERP ABAP Basics", score: 85, totalQuestions: 20, date: "2024-05-10", category: "ERP Development" },
    { id: "hist2", title: "ERP FIORI Design", score: 72, totalQuestions: 15, date: "2024-05-08", category: "ERP UI/UX" },
    { id: "hist3", title: "ERP Business Technology Platform", score: 90, totalQuestions: 25, date: "2024-05-01", category: "ERP Technology" },
    { id: "hist4", title: "ERP S/4HANA Cloud", score: 65, totalQuestions: 30, date: "2024-04-25", category: "ERP Cloud Solutions" }
  ],
  categoryPerformance: [
    { category: "ERP Fundamentals", score: 72, testsCompleted: 3 },
    { category: "ERP Technology", score: 90, testsCompleted: 2 },
    { category: "ERP Development", score: 85, testsCompleted: 4 },
    { category: "ERP UI/UX", score: 68, testsCompleted: 2 },
    { category: "ERP Cloud Solutions", score: 65, testsCompleted: 1 }
  ],
  improvementSuggestions: [
    { category: "ERP Cloud Solutions", message: "Focus on Cloud deployment models and integration scenarios" },
    { category: "ERP UI/UX", message: "Practice more FIORI design principles and UI5 questions" }
  ]
};

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600">
            {mockUserData.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{mockUserData.name}</h1>
            <p className="text-slate-500">{mockUserData.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/test">
            <Button>Take New Test</Button>
          </Link>
          <Link href="/profile">
            <Button variant="outline">Edit Profile</Button>
          </Link>
        </div>
      </div>
      
      {/* Dashboard Navigation */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-3 px-1 relative ${
              activeTab === "overview"
                ? "text-blue-600 font-medium"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Overview
            {activeTab === "overview" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("tests")}
            className={`py-3 px-1 relative ${
              activeTab === "tests"
                ? "text-blue-600 font-medium"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Test History
            {activeTab === "tests" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("statistics")}
            className={`py-3 px-1 relative ${
              activeTab === "statistics"
                ? "text-blue-600 font-medium"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Statistics
            {activeTab === "statistics" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
            )}
          </button>
        </nav>
      </div>
      
      {/* Dashboard Content */}
      <div className="pb-12">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-blue-100">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Tests Completed</p>
                    <h3 className="text-2xl font-bold">{mockUserData.testsCompleted}</h3>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-100">
                    <Medal className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Average Score</p>
                    <h3 className="text-2xl font-bold">{mockUserData.averageScore}%</h3>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <Star className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Best Category</p>
                    <h3 className="text-lg font-bold">{mockUserData.bestCategory}</h3>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 rounded-full bg-purple-100">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Member Since</p>
                    <h3 className="text-lg font-bold">{formatDate(mockUserData.memberSince)}</h3>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* In-Progress Tests */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">In-Progress Tests</h2>
                <Link href="/test" className="text-sm text-blue-600 hover:underline flex items-center">
                  View All <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              
              {mockUserData.inProgressTests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockUserData.inProgressTests.map((test) => (
                    <Card key={test.id}>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-medium mb-1">{test.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Clock className="h-4 w-4" />
                              <span>Last accessed {formatDate(test.lastAccessed)}</span>
                            </div>
                          </div>
                          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            {test.progress}% complete
                          </span>
                        </div>
                        
                        <div className="w-full bg-slate-100 h-2 rounded-full mb-4">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${test.progress}%` }}
                          ></div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-500">{test.questions} questions</span>
                          <Link href={`/test/${test.id}`}>
                            <Button variant="outline" size="sm">
                              Continue Test
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center py-12">
                    <p className="text-slate-500 mb-4">You don't have any tests in progress.</p>
                    <Link href="/test">
                      <Button>Start a New Test</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Recent Test History */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Recent Test History</h2>
                <button 
                  onClick={() => setActiveTab("tests")}
                  className="text-sm text-blue-600 hover:underline flex items-center"
                >
                  View All <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              {mockUserData.testHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 font-medium text-slate-500">Test Name</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-500">Category</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-500">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-500">Score</th>
                        <th className="text-left py-3 px-4 font-medium text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockUserData.testHistory.slice(0, 3).map((test) => (
                        <tr key={test.id} className="border-b border-slate-100">
                          <td className="py-3 px-4">{test.title}</td>
                          <td className="py-3 px-4">
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                              {test.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{formatDate(test.date)}</td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${
                              test.score >= 80 ? "text-green-600" : 
                              test.score >= 60 ? "text-yellow-600" : "text-red-600"
                            }`}>
                              {test.score}%
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Link href={`/test-result/${test.id}`}>
                              <Button variant="outline" size="sm">
                                View Results
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center py-12">
                    <p className="text-slate-500 mb-4">You haven't completed any tests yet.</p>
                    <Link href="/test">
                      <Button>Take Your First Test</Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Improvement Suggestions */}
            <div>
              <h2 className="text-xl font-bold mb-4">Suggestions for Improvement</h2>
              
              {mockUserData.improvementSuggestions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockUserData.improvementSuggestions.map((suggestion, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full mb-3 inline-block">
                          {suggestion.category}
                        </span>
                        <p className="text-slate-700">{suggestion.message}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-slate-500">Complete more tests to get personalized suggestions for improvement.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
        
        {activeTab === "tests" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Test History</h2>
              <div className="flex items-center gap-2">
                <select className="border border-slate-300 rounded-md p-2 text-sm">
                  <option value="all">All Categories</option>
                  <option value="erp-fundamentals">ERP Fundamentals</option>
                  <option value="erp-technology">ERP Technology</option>
                  <option value="erp-development">ERP Development</option>
                  <option value="erp-ui-ux">ERP UI/UX</option>
                  <option value="erp-cloud">ERP Cloud Solutions</option>
                </select>
                <select className="border border-slate-300 rounded-md p-2 text-sm">
                  <option value="recent">Most Recent</option>
                  <option value="highest">Highest Score</option>
                  <option value="lowest">Lowest Score</option>
                </select>
              </div>
            </div>
            
            {mockUserData.testHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Test Name</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Score</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Questions</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockUserData.testHistory.map((test) => (
                      <tr key={test.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">{test.title}</td>
                        <td className="py-3 px-4">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                            {test.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">{formatDate(test.date)}</td>
                        <td className="py-3 px-4">
                          <span className={`font-medium ${
                            test.score >= 80 ? "text-green-600" : 
                            test.score >= 60 ? "text-yellow-600" : "text-red-600"
                          }`}>
                            {test.score}%
                          </span>
                        </td>
                        <td className="py-3 px-4">{test.totalQuestions}</td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Link href={`/test-result/${test.id}`}>
                              <Button variant="outline" size="sm">
                                View Results
                              </Button>
                            </Link>
                            <Link href={`/test/${test.id}/retry`}>
                              <Button size="sm">
                                Retry
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center py-12">
                  <p className="text-slate-500 mb-4">You haven't completed any tests yet.</p>
                  <Link href="/test">
                    <Button>Take Your First Test</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {activeTab === "statistics" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance by Category */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockUserData.categoryPerformance.map((category) => (
                      <div key={category.category}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium">{category.category}</span>
                          <span className="text-sm text-slate-500">{category.score}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full">
                          <div 
                            className={`h-2 rounded-full ${
                              category.score >= 80 ? "bg-green-600" : 
                              category.score >= 60 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${category.score}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {category.testsCompleted} tests completed
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              {/* Overall Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center py-6">
                    <div className="text-center">
                      <div className="relative inline-block">
                        <div className="w-36 h-36 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="text-3xl font-bold">{mockUserData.averageScore}%</span>
                        </div>
                        <div className="absolute inset-0">
                          <svg viewBox="0 0 100 100" width="144" height="144">
                            <circle 
                              cx="50" cy="50" r="45" 
                              fill="none" 
                              stroke="#f1f5f9" 
                              strokeWidth="8"
                            />
                            <circle 
                              cx="50" cy="50" r="45" 
                              fill="none" 
                              stroke="#2563eb" 
                              strokeWidth="8" 
                              strokeDasharray="283"
                              strokeDashoffset={283 - (283 * mockUserData.averageScore / 100)}
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                        </div>
                      </div>
                      <p className="mt-4 text-slate-500">Average Score</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{mockUserData.testsCompleted}</div>
                      <p className="text-sm text-slate-500">Tests Completed</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {mockUserData.testHistory.reduce((a, b) => Math.max(a, b.score), 0)}%
                      </div>
                      <p className="text-sm text-slate-500">Highest Score</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{mockUserData.categoryPerformance.length}</div>
                      <p className="text-sm text-slate-500">Categories Tested</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {mockUserData.categoryPerformance
                      .filter(category => category.score >= 80)
                      .map((category) => (
                        <li key={category.category} className="flex items-center gap-2">
                          <div className="p-1 rounded-full bg-green-100">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <span>
                            {category.category} <span className="text-green-600">({category.score}%)</span>
                          </span>
                        </li>
                      ))}
                    {mockUserData.categoryPerformance.filter(category => category.score >= 80).length === 0 && (
                      <p className="text-slate-500">Complete more tests to identify your strengths.</p>
                    )}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Areas to Improve</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {mockUserData.categoryPerformance
                      .filter(category => category.score < 70)
                      .map((category) => (
                        <li key={category.category} className="flex items-center gap-2">
                          <div className="p-1 rounded-full bg-red-100">
                            <XCircle className="h-4 w-4 text-red-600" />
                          </div>
                          <span>
                            {category.category} <span className="text-red-600">({category.score}%)</span>
                          </span>
                        </li>
                      ))}
                    {mockUserData.categoryPerformance.filter(category => category.score < 70).length === 0 && (
                      <p className="text-slate-500">Great job! You're performing well in all categories.</p>
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}