import type { ReactNode } from "react";
import type { SensorMetric } from "../../types/dorm";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import { TrendLine } from "./TrendLine";
import { statusStyles } from "./statusStyles";

type MetricCardProps = {
  metric: SensorMetric;
  icon?: ReactNode;
};

export function MetricCard({ metric, icon }: MetricCardProps) {
  const tone = statusStyles[metric.status];
  const numericValue =
    typeof metric.value === "number"
      ? metric.value
      : metric.history[metric.history.length - 1] ?? 1;

  return (
    <GlassCard intensity="light" interactive className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/70 bg-white/70 text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.045)]">
            {icon}
          </span>
          <div>
            <p className="text-sm font-medium text-slate-600">{metric.name}</p>
            <p className="mt-0.5 text-xs text-slate-400">{metric.areaName}</p>
          </div>
        </div>
        <StatusBadge status={metric.status} label={metric.statusText} />
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-[34px] font-semibold leading-none tracking-[-0.03em] text-slate-950">
            {metric.value}
            <span className="ml-1 text-sm font-medium tracking-normal text-slate-400">
              {metric.unit}
            </span>
          </p>
          <p className="mt-2 text-xs text-slate-500">{metric.trend}</p>
        </div>
        <div className="h-12 w-28">
          <TrendLine values={[...metric.history, Number(numericValue)]} color={tone.dot} />
        </div>
      </div>
    </GlassCard>
  );
}
