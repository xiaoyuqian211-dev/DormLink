import { Bot } from "lucide-react";
import { StatusBadge } from "../ui/StatusBadge";

export function ChatHeader() {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3.5 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
          <Bot size={18} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">DormLink Assistant</p>
          <p className="mt-0.5 truncate text-xs text-slate-500">基于当前传感器上下文回答</p>
        </div>
      </div>
      <StatusBadge status="normal" label="可解释" />
    </div>
  );
}
