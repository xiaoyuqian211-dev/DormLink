import { CheckCircle2, Database, Home, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import {
  aiInsight,
  alertEvents,
  dormRoom,
  sensorMetrics,
} from "../../data/mockDormData";
import { GlassCard } from "../ui/GlassCard";
import { StatusBadge } from "../ui/StatusBadge";
import { RecommendationCard } from "./RecommendationCard";
import { ReasoningCard } from "./ReasoningCard";
import { RecentEvents } from "./RecentEvents";

export function ContextPanel() {
  const contextMetrics = useMemo(
    () =>
      sensorMetrics.filter((metric) =>
        ["temperature", "humidity", "co2", "noise"].includes(metric.key),
      ),
    [],
  );

  return (
    <aside className="xl:sticky xl:top-24 xl:max-h-[calc(100vh-112px)] xl:overflow-y-auto xl:pr-1">
      <div className="space-y-4">
        <GlassCard intensity="medium" className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-500">
                Context
              </p>
              <h3 className="mt-1.5 text-lg font-semibold tracking-[-0.02em] text-slate-950">
                当前上下文
              </h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                AI 回答使用的实时环境依据。
              </p>
            </div>
            <StatusBadge status="normal" label="已同步" />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <div className="rounded-[18px] border border-slate-300/18 bg-white/60 p-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Home size={14} />
                <p className="text-[11px]">房间</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-950">{dormRoom.id}</p>
            </div>
            <div className="rounded-[18px] border border-slate-300/18 bg-white/60 p-3">
              <div className="flex items-center gap-2 text-slate-500">
                <ShieldCheck size={14} />
                <p className="text-[11px]">置信度</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {Math.round(aiInsight.confidence * 100)}%
              </p>
            </div>
            <div className="rounded-[18px] border border-slate-300/18 bg-white/60 p-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Database size={14} />
                <p className="text-[11px]">数据状态</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-950">{dormRoom.mode}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard intensity="medium" className="p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-950">关键指标</p>
            <StatusBadge status="warning" label={`${alertEvents.length} 个关注项`} />
          </div>
          <div className="mt-3 grid gap-2">
            {contextMetrics.map((metric) => (
              <div key={metric.id} className="rounded-[18px] border border-slate-300/18 bg-white/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">{metric.name}</p>
                    <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                      {metric.value}
                      <span className="ml-1 text-xs font-medium text-slate-400">{metric.unit}</span>
                    </p>
                  </div>
                  <StatusBadge status={metric.status} label={metric.statusText} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <ReasoningCard />
        <RecommendationCard />
        <RecentEvents />

        <div className="rounded-[22px] border border-slate-300/18 bg-white/58 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-800">
              <CheckCircle2 size={17} className="text-teal-500" />
              <p className="text-sm font-semibold">已采纳建议</p>
            </div>
            <StatusBadge
              status={alertEvents.length ? "warning" : "normal"}
              label={`${alertEvents.length} 个待处理`}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
