import type { ReactNode } from "react";
import { TopNav } from "./TopNav";
import type { PageKey } from "./TopNav";

type AppShellProps = {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
};

export function AppShell({ activePage, onNavigate, children }: AppShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F5F7FB] text-slate-950">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(79,124,255,0.14),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(20,184,166,0.10),transparent_28%),linear-gradient(180deg,#F8FAFC_0%,#EEF4FB_100%)]" />
      <TopNav activePage={activePage} onNavigate={onNavigate} />
      <main className="mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

export type { PageKey };
