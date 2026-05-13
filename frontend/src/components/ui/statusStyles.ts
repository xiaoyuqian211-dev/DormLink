import type { SensorStatus } from "../../types/dorm";

export const statusStyles: Record<
  SensorStatus,
  {
    label: string;
    dot: string;
    text: string;
    bg: string;
    border: string;
    chip: string;
  }
> = {
  normal: {
    label: "稳定",
    dot: "#14B8A6",
    text: "text-teal-700",
    bg: "bg-teal-50/80",
    border: "border-teal-100/80",
    chip: "border-teal-100/80 bg-teal-50/75 text-teal-700",
  },
  warning: {
    label: "关注",
    dot: "#F59E0B",
    text: "text-amber-700",
    bg: "bg-amber-50/80",
    border: "border-amber-100/80",
    chip: "border-amber-100/80 bg-amber-50/75 text-amber-700",
  },
  danger: {
    label: "风险",
    dot: "#EF4444",
    text: "text-red-700",
    bg: "bg-red-50/80",
    border: "border-red-100/80",
    chip: "border-red-100/80 bg-red-50/75 text-red-700",
  },
  offline: {
    label: "离线",
    dot: "#94A3B8",
    text: "text-slate-600",
    bg: "bg-slate-100/80",
    border: "border-slate-200/80",
    chip: "border-slate-200/80 bg-slate-100/75 text-slate-600",
  },
};

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
