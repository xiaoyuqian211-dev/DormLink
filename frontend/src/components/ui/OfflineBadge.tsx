import { WifiOff } from "lucide-react";

export function OfflineBadge({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100/80 px-2.5 py-1 text-[11px] font-medium text-slate-600">
      <WifiOff size={13} />
      网关离线
    </span>
  );
}
