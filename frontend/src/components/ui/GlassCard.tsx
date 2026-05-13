import type { HTMLAttributes } from "react";
import { cn } from "./statusStyles";

type GlassCardProps = HTMLAttributes<HTMLDivElement> & {
  intensity?: "strong" | "medium" | "light";
  interactive?: boolean;
};

const intensityClass = {
  strong:
    "border-slate-300/30 bg-white/84 shadow-[0_28px_90px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.92)]",
  medium:
    "border-slate-300/24 bg-white/74 shadow-[0_20px_60px_rgba(15,23,42,0.075),inset_0_1px_0_rgba(255,255,255,0.90)]",
  light:
    "border-slate-300/18 bg-white/62 shadow-[0_12px_34px_rgba(15,23,42,0.045),inset_0_1px_0_rgba(255,255,255,0.86)]",
};

export function GlassCard({
  className,
  intensity = "medium",
  interactive = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-[26px] border backdrop-blur-xl transition duration-200",
        intensityClass[intensity],
        interactive &&
          "hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.92)]",
        className,
      )}
      {...props}
    />
  );
}
