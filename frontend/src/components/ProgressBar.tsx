interface ProgressBarProps {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="h-1.5 w-full bg-slate-200">
      <div className="h-full bg-teal transition-all duration-300" style={{ width: `${(current / total) * 100}%` }} />
    </div>
  );
}
