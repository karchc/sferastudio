"use client";

interface CategoryProgressBarProps {
  category: string;
  score: number;
  testsCompleted: number;
}

export function CategoryProgressBar({
  category,
  score,
  testsCompleted
}: CategoryProgressBarProps) {
  const getBarColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{category}</span>
        <span className="text-sm text-slate-500">{score}%</span>
      </div>
      <div className="w-full bg-slate-100 h-2 rounded-full">
        <div 
          className={`h-2 rounded-full ${getBarColor(score)}`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
      <p className="text-xs text-slate-500 mt-1">
        {testsCompleted} tests completed
      </p>
    </div>
  );
}