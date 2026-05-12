import {
  Activity,
  Bot,
  ChartNoAxesCombined,
  LayoutDashboard,
  Network,
} from "lucide-react";
import { useState } from "react";
import Assistant from "./pages/Assistant";
import Dashboard from "./pages/Dashboard";
import DigitalTwin from "./pages/DigitalTwin";
import History from "./pages/History";

type PageKey = "dashboard" | "history" | "twin" | "assistant";

const navItems = [
  { key: "dashboard", label: "实时总览", icon: LayoutDashboard },
  { key: "history", label: "历史趋势", icon: ChartNoAxesCombined },
  { key: "twin", label: "数字孪生", icon: Network },
  { key: "assistant", label: "智能解释", icon: Bot },
] as const;

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-white">
              <Activity size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">DormLink</h1>
              <p className="text-sm text-slate-500">AIoT 宿舍环境智联系统原型</p>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const selected = activePage === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActivePage(item.key)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                    selected
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700"
                  }`}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {activePage === "dashboard" ? <Dashboard /> : null}
        {activePage === "history" ? <History /> : null}
        {activePage === "twin" ? <DigitalTwin /> : null}
        {activePage === "assistant" ? <Assistant /> : null}
      </main>
    </div>
  );
}

