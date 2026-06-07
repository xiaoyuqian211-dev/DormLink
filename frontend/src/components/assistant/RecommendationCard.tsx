import { Brain } from "lucide-react";
import type { HistoryPoint as ApiHistoryPoint } from "../../types";
import { TrendLine } from "../ui/TrendLine";

export function RecommendationCard({
  recommendation,
  history,
}: {
  recommendation: string;
  history: ApiHistoryPoint[];
}) {
  const co2Values = history.length ? history.slice(-12).map((point) => point.co2) : [1];

  return (
    <div className="rounded-[22px] border border-amber-100/80 bg-[linear-gradient(135deg,rgba(255,251,235,0.82),rgba(255,255,255,0.62))] p-4">
      <div className="flex items-center gap-2 text-amber-700">
        <Brain size={17} />
        <p className="text-sm font-semibold">当前建议</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{recommendation}</p>
      <div className="mt-4 h-12 rounded-2xl border border-white/70 bg-white/58 p-2">
        <TrendLine values={co2Values} color="#F59E0B" height={36} />
      </div>
    </div>
  );
}
