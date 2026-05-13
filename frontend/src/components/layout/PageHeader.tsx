import type { ReactNode } from "react";
import { GlassCard } from "../ui/GlassCard";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge?: ReactNode;
  children?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
  children,
}: PageHeaderProps) {
  return (
    <GlassCard intensity="medium" className="relative overflow-hidden p-5 sm:p-6">
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-white/90" />
      <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-72 rounded-full bg-blue-200/24 blur-3xl" />
      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-blue-500">
              {eyebrow}
            </p>
            {badge}
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950 sm:text-[28px]">
            {title}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>
        {children ? <div className="relative">{children}</div> : null}
      </div>
    </GlassCard>
  );
}
