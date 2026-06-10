interface TimerProps {
  seconds: number;
}

export function Timer({ seconds }: TimerProps) {
  const urgent = seconds <= 5;
  return (
    <div className={`min-w-32 rounded-lg px-5 py-3 text-center ${urgent ? "bg-red-50 text-red-700" : "bg-teal/10 text-teal"}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest">Time remaining</p>
      <p className="font-mono text-3xl font-bold">00:{String(seconds).padStart(2, "0")}</p>
    </div>
  );
}
