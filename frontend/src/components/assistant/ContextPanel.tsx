import { CheckCircle2, Database, Home, ShieldCheck } from "lucide-react";
import type { AssistantContext } from "../../utils/assistantTelemetry";
import { GlassCard } from "../ui/GlassCard";
import { StatusBadge } from "../ui/StatusBadge";
import { RecommendationCard } from "./RecommendationCard";
import { ReasoningCard } from "./ReasoningCard";
import { RecentEvents } from "./RecentEvents";

export function ContextPanel({ context }: { context: AssistantContext }) {
  const concernCount = context.metrics.filter((metric) => metric.status !== "normal").length;
  const synced = context.dataMode === "real";

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
                AI 回答使用同一份 MQTT latest/history 数据。
              </p>
            </div>
            <StatusBadge status={synced ? "normal" : "warning"} label={synced ? "已同步" : "演示"} />
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
            <div className="rounded-[18px] border border-slate-300/18 bg-white/60 p-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Home size={14} />
                <p className="text-[11px]">房间</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-950">{context.roomId}</p>
            </div>
            <div className="rounded-[18px] border border-slate-300/18 bg-white/60 p-3">
              <div className="flex items-center gap-2 text-slate-500">
                <ShieldCheck size={14} />
                <p className="text-[11px]">置信度</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-950">
                {context.confidence}%
              </p>
            </div>
            <div className="rounded-[18px] border border-slate-300/18 bg-white/60 p-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Database size={14} />
                <p className="text-[11px]">数据状态</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-950">{context.dataStatusLabel}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard intensity="medium" className="p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-950">关键指标</p>
            <StatusBadge
              status={concernCount ? "warning" : "normal"}
              label={`${concernCount} 个关注项`}
            />
          </div>
          <div className="mt-3 grid gap-2">
            {context.metrics.map((metric) => (
              <div key={metric.key} className="rounded-[18px] border border-slate-300/18 bg-white/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500">{metric.label}</p>
                    <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">
                      {metric.value}
                    </p>
                  </div>
                  <StatusBadge status={metric.status} label={metric.statusText} />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <ReasoningCard basis={context.basis} />
        <RecommendationCard recommendation={context.recommendation} history={context.history} />
        <RecentEvents events={context.recentEvents} />

        <div className="rounded-[22px] border border-slate-300/18 bg-white/58 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-800">
              <CheckCircle2 size={17} className="text-teal-500" />
              <p className="text-sm font-semibold">待处理建议</p>
            </div>
            <StatusBadge
              status={concernCount ? "warning" : "normal"}
              label={`${concernCount} 个待处理`}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
