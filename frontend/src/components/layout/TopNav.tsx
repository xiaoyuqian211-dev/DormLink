import {
  Activity,
  Bell,
  Bot,
  ChartNoAxesCombined,
  LayoutDashboard,
  Network,
  UserRound,
} from "lucide-react";
import { cn } from "../ui/statusStyles";

export type PageKey = "dashboard" | "history" | "twin" | "assistant";

const navItems = [
  { key: "dashboard", label: "实时总览", icon: LayoutDashboard },
  { key: "history", label: "历史趋势", icon: ChartNoAxesCombined },
  { key: "twin", label: "数字孪生", icon: Network },
  { key: "assistant", label: "智能解释", icon: Bot },
] as const;

type TopNavProps = {
  activePage: PageKey;
  onNavigate: (page: PageKey) => void;
};

export function TopNav({ activePage, onNavigate }: TopNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/78 shadow-[0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1480px] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[18px] bg-[linear-gradient(145deg,#ffffff_0%,#eef4ff_42%,#5b8def_43%,#4f7cff_100%)] text-white shadow-[0_14px_34px_rgba(79,124,255,0.24),inset_0_1px_0_rgba(255,255,255,0.50)] ring-1 ring-blue-200/60">
            <Activity size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-950">
              DormLink
            </h1>
            <p className="text-xs text-slate-500">AIoT 宿舍环境智联系统</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <nav className="flex flex-wrap gap-1 rounded-2xl border border-slate-200/75 bg-slate-100/60 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.80)]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = activePage === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onNavigate(item.key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition duration-200",
                    selected
                      ? "border-blue-100 bg-blue-50 text-blue-700 shadow-[0_8px_18px_rgba(79,124,255,0.10),inset_0_1px_0_rgba(255,255,255,0.92)]"
                      : "border-transparent bg-transparent text-slate-500 hover:bg-white/80 hover:text-slate-800",
                  )}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              aria-label="通知"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/72 text-slate-500 shadow-[0_8px_18px_rgba(15,23,42,0.05)] transition hover:text-slate-800"
            >
              <Bell size={16} />
            </button>
            <button
              type="button"
              aria-label="用户"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#edf4ff)] text-blue-600 shadow-[0_8px_18px_rgba(15,23,42,0.05)]"
            >
              <UserRound size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
