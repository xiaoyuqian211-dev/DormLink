import { Bot, Home, ShieldCheck } from "lucide-react";
import type { AssistantContext } from "../../utils/assistantTelemetry";
import { GlassCard } from "../ui/GlassCard";
import { StatusBadge } from "../ui/StatusBadge";

export function AssistantHero({ context }: { context: AssistantContext }) {
  const synced = context.dataMode === "real";

  return (
    <GlassCard intensity="medium" className="relative overflow-hidden px-4 py-3.5 sm:px-5">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-white/90" />
      <div className="pointer-events-none absolute -right-14 -top-20 h-36 w-64 rounded-full bg-blue-200/24 blur-3xl" />
      <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-500">
              AI Explanation
            </p>
            <StatusBadge
              status={synced ? "normal" : "warning"}
              label={synced ? "上下文已同步" : "等待真实数据"}
            />
          </div>
          <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
            AI 环境解释助手
          </h2>
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-500">
            把传感器读数、历史变化和系统建议组织成可追溯的环境解释。
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          <div className="rounded-[18px] border border-slate-300/20 bg-white/62 p-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 text-slate-500">
              <Home size={14} />
              <p className="text-[11px]">当前房间</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-950">{context.roomId}</p>
          </div>
          <div className="rounded-[18px] border border-slate-300/20 bg-white/62 p-3 shadow-[0_10px_28px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-2 text-slate-500">
              <ShieldCheck size={14} />
              <p className="text-[11px]">置信度</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {context.confidence}%
            </p>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-3 right-5 hidden text-blue-500/20 lg:block">
        <Bot size={72} strokeWidth={1.2} />
      </div>
    </GlassCard>
  );
}
