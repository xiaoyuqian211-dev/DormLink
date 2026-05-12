import type { ReactNode } from "react";

type Tone = "blue" | "cyan" | "emerald" | "amber" | "rose" | "slate";

type MetricCardProps = {
  title: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  tone?: Tone;
  footer?: string;
};

const toneClasses: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  cyan: "bg-cyan-50 text-cyan-700 border-cyan-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  rose: "bg-rose-50 text-rose-700 border-rose-100",
  slate: "bg-slate-50 text-slate-700 border-slate-100",
};

export function MetricCard({
  title,
  value,
  unit,
  icon,
  tone = "blue",
  footer,
}: MetricCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-semibold text-slate-950">{value}</span>
            {unit ? <span className="text-sm text-slate-500">{unit}</span> : null}
          </div>
        </div>
        <div className={`rounded-lg border p-2.5 ${toneClasses[tone]}`}>{icon}</div>
      </div>
      {footer ? <p className="mt-4 text-sm text-slate-500">{footer}</p> : null}
    </section>
  );
}

