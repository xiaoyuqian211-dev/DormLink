import type { ButtonHTMLAttributes } from "react";
import { cn } from "./statusStyles";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variantClass = {
  primary:
    "border-transparent bg-[linear-gradient(135deg,#5B6DFF,#4F7CFF_54%,#3B82F6)] text-white shadow-[0_14px_30px_rgba(79,124,255,0.20)] hover:brightness-[1.04]",
  secondary:
    "border-slate-300/28 bg-white/68 text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.045)] hover:border-blue-200 hover:bg-white/88 hover:text-blue-700",
  ghost: "border-transparent bg-transparent text-slate-500 hover:bg-slate-100/75 hover:text-slate-800",
};

export function ActionButton({
  className,
  variant = "secondary",
  ...props
}: ActionButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition duration-200 active:scale-[0.99]",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
