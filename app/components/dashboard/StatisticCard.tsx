"use client";

import { Card, CardContent } from "../ui/card";
import { LucideIcon } from "lucide-react";

interface StatisticCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: "blue" | "green" | "yellow" | "purple" | "red";
}

export function StatisticCard({
  title,
  value,
  icon: Icon,
  color
}: StatisticCardProps) {
  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return { bg: "bg-blue-100", text: "text-blue-600" };
      case "green":
        return { bg: "bg-green-100", text: "text-green-600" };
      case "yellow":
        return { bg: "bg-yellow-100", text: "text-yellow-600" };
      case "purple":
        return { bg: "bg-purple-100", text: "text-purple-600" };
      case "red":
        return { bg: "bg-red-100", text: "text-red-600" };
      default:
        return { bg: "bg-blue-100", text: "text-blue-600" };
    }
  };

  const { bg, text } = getColorClasses(color);

  return (
    <Card>
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`p-3 rounded-full ${bg}`}>
          <Icon className={`h-5 w-5 ${text}`} />
        </div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}