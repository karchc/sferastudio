"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award,
  Target,
  CheckCircle,
  XCircle,
  BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

interface TestSession {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  score: number;
  time_spent: number;
  created_at: string;
  totalQuestions: number;
  totalAnswered: number;
  correctAnswers: number;
  percentage: number;
  avgTimePerQuestion: number;
  skippedQuestions: number;
}

interface TestHistory {
  test: {
    id: string;
    title: string;
    description: string;
    time_limit: number;
  };
  sessions: TestSession[];
  overallStats: {
    totalAttempts: number;
    completedAttempts: number;
    averageScore: number;
    bestScore: number;
    averageTime: number;
  };
}

export default function TestHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<TestHistory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTestHistory() {
      try {
        const response = await fetch(`/api/test/${testId}/history`);
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to view test history');
            // Don't force redirect, let user choose
            return;
          }
          if (response.status === 404) {
            setError('Test not found');
            return;
          }
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch test history');
        }

        const data = await response.json();
        console.log('Test history data received:', data);
        console.log('Sessions with scores:', data.sessions?.map((s: any) => ({
          id: s.id,
          score: s.score,
          percentage: s.percentage,
          correctAnswers: s.correctAnswers,
          totalQuestions: s.totalQuestions
        })));
        setHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (testId) {
      fetchTestHistory();
    }
  }, [testId, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-yellow-600';
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent">
                <span className="sr-only">Loading...</span>
              </div>
              <p className="mt-4 text-lg text-gray-600">Loading test history...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <p className="text-red-600 text-lg mb-4">{error || 'Failed to load test history'}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.back()}>Go Back</Button>
              {error?.includes('log in') && (
                <Button onClick={() => router.push('/auth/login')}>
                  Log In
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Test History</h1>
          <p className="text-lg text-gray-600">{history.test.title}</p>
          {history.test.description && (
            <p className="text-sm text-gray-500 mt-1">{history.test.description}</p>
          )}
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Attempts</p>
                  <p className="text-2xl font-bold text-gray-900">{history.overallStats.totalAttempts}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Best Score</p>
                  <p className="text-2xl font-bold text-gray-900">{history.overallStats.bestScore}%</p>
                </div>
                <Award className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{history.overallStats.averageScore}%</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Avg. Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatTime(history.overallStats.averageTime)}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session History */}
        <Card>
          <CardHeader>
            <CardTitle>Attempt History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.sessions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No test attempts yet</p>
                <Button 
                  className="mt-4"
                  onClick={() => router.push(`/test/${testId}`)}
                >
                  Take Test Now
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.sessions.map((session, index) => (
                  <div 
                    key={session.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-sm font-medium text-gray-500">
                            Attempt #{history.sessions.length - index}
                          </span>
                          <span className={`text-sm font-medium ${getStatusColor(session.status)}`}>
                            {session.status.charAt(0).toUpperCase() + session.status.slice(1).replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                          <Calendar className="h-4 w-4" />
                          {formatDate(session.created_at)}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Score</p>
                            <p className={`font-semibold ${getScoreColor(session.percentage)}`}>
                              {session.percentage}%
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">Questions</p>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              <span className="text-sm">{session.correctAnswers}/{session.totalQuestions}</span>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">Time Spent</p>
                            <p className="text-sm font-medium">{formatTime(session.time_spent)}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500">Skipped</p>
                            <p className="text-sm font-medium">{session.skippedQuestions}</p>
                          </div>
                        </div>
                      </div>
                      
                      {index === 0 && session.percentage > 0 && (
                        <div className="ml-4">
                          {session.percentage >= history.overallStats.averageScore ? (
                            <TrendingUp className="h-5 w-5 text-green-500" />
                          ) : (
                            <TrendingUp className="h-5 w-5 text-red-500 transform rotate-180" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={() => router.push(`/test/${testId}`)}
          >
            Take Test Again
          </Button>
        </div>
      </div>
    </div>
  );
}