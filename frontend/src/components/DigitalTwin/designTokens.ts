import type { SensorStatus } from "./types";

export const twinUi = {
  page:
    "relative overflow-hidden rounded-[30px] border border-slate-300/[0.22] bg-[linear-gradient(135deg,rgba(255,255,255,0.88),rgba(241,246,253,0.78)_45%,rgba(232,240,250,0.72)),radial-gradient(circle_at_18%_10%,rgba(95,150,255,0.16),transparent_30%),radial-gradient(circle_at_82%_30%,rgba(45,212,191,0.12),transparent_26%)] p-3 shadow-[0_28px_90px_rgba(15,23,42,0.09)] sm:p-4",
  card:
    "rounded-[24px] border border-slate-300/[0.24] bg-white/[0.82] shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl",
  cardSoft:
    "rounded-[20px] border border-slate-300/[0.18] bg-white/[0.74] shadow-[0_14px_40px_rgba(15,23,42,0.05)] backdrop-blur-xl",
  hero:
    "rounded-[22px] border border-slate-300/[0.22] bg-[linear-gradient(135deg,rgba(255,255,255,0.86),rgba(245,249,255,0.72))] shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl",
  modelCard:
    "rounded-[26px] border border-slate-300/[0.26] bg-[linear-gradient(145deg,rgba(255,255,255,0.88),rgba(241,247,255,0.78))] shadow-[0_28px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl",
  insightCard:
    "rounded-[24px] border border-slate-300/[0.24] bg-white/[0.82] shadow-[0_24px_75px_rgba(15,23,42,0.085)] backdrop-blur-xl",
  text: "text-slate-950",
  muted: "text-slate-500",
  eyebrow: "text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-500",
};

export const twinStatusUi: Record<
  SensorStatus,
  {
    label: string;
    dot: string;
    text: string;
    border: string;
    bg: string;
    chip: string;
    glow: string;
    scene: string;
    heat: string;
  }
> = {
  normal: {
    label: "稳定",
    dot: "#209E9A",
    text: "text-teal-700",
    border: "border-teal-200/80",
    bg: "bg-teal-50/80",
    chip: "border-teal-200/80 bg-white/78 text-teal-700",
    glow: "shadow-[0_10px_24px_rgba(45,212,191,0.16)]",
    scene: "#2FB8B2",
    heat: "#72DAD4",
  },
  warning: {
    label: "关注",
    dot: "#B9852E",
    text: "text-amber-700",
    border: "border-amber-200/80",
    bg: "bg-amber-50/80",
    chip: "border-amber-200/90 bg-white/82 text-amber-700",
    glow: "shadow-[0_10px_28px_rgba(200,154,58,0.18)]",
    scene: "#C99335",
    heat: "#E0B968",
  },
  danger: {
    label: "告警",
    dot: "#D75D72",
    text: "text-rose-700",
    border: "border-rose-200/85",
    bg: "bg-rose-50/80",
    chip: "border-rose-200/90 bg-white/82 text-rose-700",
    glow: "shadow-[0_10px_28px_rgba(215,93,114,0.18)]",
    scene: "#D75D72",
    heat: "#F0A0AD",
  },
};

export const twinScenePalette = {
  canvas: "#EAF1FA",
  floor: "#DDE8F5",
  floorLine: "#C9D6E5",
  wall: "#F4F8FC",
  wallSide: "#E6EEF7",
  bedFrame: "#8FB2D9",
  mattress: "#FDFEFF",
  pillow: "#CFE2FA",
  desk: "#CAB18F",
  deskLeg: "#93A1B5",
  chair: "#B7C3D2",
  wardrobe: "#C9D8E8",
  window: "#86C7F5",
  door: "#B6C4D4",
  ac: "#F8FAFC",
};
