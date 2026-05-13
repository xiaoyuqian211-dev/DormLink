import { useEffect, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import type { PageKey } from "./components/layout/AppShell";
import Assistant from "./pages/Assistant";
import Dashboard from "./pages/Dashboard";
import DigitalTwin from "./pages/DigitalTwin";
import History from "./pages/History";

const routeByPage: Record<PageKey, string> = {
  dashboard: "/",
  history: "/history",
  twin: "/digital-twin",
  assistant: "/assistant",
};

function pageFromLocation(): PageKey {
  const normalizedPath = window.location.pathname.replace(/\/+$/, "") || "/";
  const normalizedHash = window.location.hash.replace(/^#/, "");
  const path = normalizedHash || normalizedPath;

  if (path === "/history") return "history";
  if (path === "/digital-twin" || path === "/twin") return "twin";
  if (path === "/assistant") return "assistant";
  return "dashboard";
}

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>(() => pageFromLocation());

  useEffect(() => {
    function handleNavigation() {
      setActivePage(pageFromLocation());
    }

    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("hashchange", handleNavigation);
    return () => {
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("hashchange", handleNavigation);
    };
  }, []);

  function navigate(page: PageKey) {
    setActivePage(page);
    const nextPath = routeByPage[page];
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, "", nextPath);
    }
  }

  return (
    <AppShell activePage={activePage} onNavigate={navigate}>
      {activePage === "dashboard" ? <Dashboard /> : null}
      {activePage === "history" ? <History /> : null}
      {activePage === "twin" ? <DigitalTwin /> : null}
      {activePage === "assistant" ? <Assistant /> : null}
    </AppShell>
  );
}
