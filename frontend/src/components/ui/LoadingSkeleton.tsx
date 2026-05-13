import { cn } from "./statusStyles";

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[22px] border border-slate-300/20 bg-white/64 p-5",
        className,
      )}
    >
      <div className="h-3 w-28 rounded-full bg-slate-200/80" />
      <div className="mt-4 h-8 w-44 rounded-full bg-slate-200/70" />
      <div className="mt-5 grid gap-3">
        <div className="h-3 rounded-full bg-slate-200/60" />
        <div className="h-3 w-3/4 rounded-full bg-slate-200/60" />
      </div>
    </div>
  );
}
