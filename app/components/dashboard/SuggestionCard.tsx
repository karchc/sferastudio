"use client";

import { Card, CardContent } from "../ui/card";

interface SuggestionCardProps {
  category: string;
  message: string;
}

export function SuggestionCard({ category, message }: SuggestionCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full mb-3 inline-block">
          {category}
        </span>
        <p className="text-slate-700">{message}</p>
      </CardContent>
    </Card>
  );
}