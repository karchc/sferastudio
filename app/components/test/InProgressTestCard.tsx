"use client";

import Link from "next/link";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Clock } from "lucide-react";

interface InProgressTestCardProps {
  id: string;
  title: string;
  progress: number;
  questions: number;
  lastAccessed: string;
}

export function InProgressTestCard({
  id,
  title,
  progress,
  questions,
  lastAccessed
}: InProgressTestCardProps) {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-medium mb-1">{title}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              <span>Last accessed {formatDate(lastAccessed)}</span>
            </div>
          </div>
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {progress}% complete
          </span>
        </div>
        
        <div className="w-full bg-slate-100 h-2 rounded-full mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500">{questions} questions</span>
          <Link href={`/test/${id}`}>
            <Button variant="outline" size="sm">
              Continue Test
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}