import type { SensorStatus } from "../../types/dorm";
import { cn, statusStyles } from "./statusStyles";

type StatusBadgeProps = {
  status: SensorStatus;
  label?: string;
  size?: "sm" | "md";
  className?: string;
};

export function StatusBadge({
  status,
  label,
  size = "sm",
  className,
}: StatusBadgeProps) {
  const tone = statusStyles[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]",
        tone.chip,
        size === "sm" ? "gap-1.5 px-2.5 py-1 text-[11px]" : "gap-2 px-3 py-1.5 text-xs",
        className,
      )}
    >
      <span
        className={cn("rounded-full", size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")}
        style={{
          backgroundColor: tone.dot,
          boxShadow: `0 0 10px ${tone.dot}66`,
        }}
      />
      {label ?? tone.label}
    </span>
  );
}
