"use client";

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function CircularProgress({
  value,
  size = 144,
  strokeWidth = 8,
  label
}: CircularProgressProps) {
  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * value / 100);

  return (
    <div className="relative inline-block">
      <div 
        className="rounded-full bg-slate-100 flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-3xl font-bold">{value}%</span>
      </div>
      <div className="absolute inset-0">
        <svg viewBox="0 0 100 100" width={size} height={size}>
          <circle 
            cx="50" cy="50" r={radius / (size / 100)}
            fill="none" 
            stroke="#f1f5f9" 
            strokeWidth={strokeWidth / (size / 100)}
          />
          <circle 
            cx="50" cy="50" r={radius / (size / 100)}
            fill="none" 
            stroke="#2563eb" 
            strokeWidth={strokeWidth / (size / 100)}
            strokeDasharray={circumference / (size / 100)}
            strokeDashoffset={offset / (size / 100)}
            transform="rotate(-90 50 50)"
          />
        </svg>
      </div>
      {label && <p className="mt-4 text-slate-500 text-center">{label}</p>}
    </div>
  );
}