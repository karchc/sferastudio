"use client";

import Link from "next/link";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Calendar, CheckCircle, Clock, FileBadge } from "lucide-react";

interface TestHistoryCardProps {
  id: string;
  title: string;
  category: string;
  date: string;
  score: number;
  totalQuestions: number;
  compact?: boolean;
}

export function TestHistoryCard({
  id,
  title,
  category,
  date,
  score,
  totalQuestions,
  compact = false
}: TestHistoryCardProps) {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card className="h-full">
      <CardContent className={compact ? "p-4" : "p-6"}>
        <div className="flex flex-col h-full">
          <div className="mb-4">
            <h3 className={`font-medium ${compact ? "text-base" : "text-lg"} mb-1`}>{title}</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full flex items-center gap-1">
                <FileBadge className="h-3 w-3" />
                {category}
              </span>
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(date)}
              </span>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}%</span>
              </div>
              <div>
                <p className="text-sm text-slate-500">Score</p>
                <p className="text-sm">{Math.round(score / 100 * totalQuestions)} / {totalQuestions} correct</p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-4">
            <Link href={`/test-result/${id}`}>
              <Button variant="outline" size="sm">View Results</Button>
            </Link>
            <Link href={`/test/${id}/retry`}>
              <Button size="sm">Retry</Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}