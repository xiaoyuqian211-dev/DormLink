import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { AssistantHero } from "../components/assistant/AssistantHero";
import { ChatPanel } from "../components/assistant/ChatPanel";
import { ContextPanel } from "../components/assistant/ContextPanel";
import type { AssistantContextResponse } from "../types";
import { buildAssistantContextFromApi } from "../utils/assistantTelemetry";

export default function Assistant() {
  const [apiContext, setApiContext] = useState<AssistantContextResponse | null>(null);
  const [error, setError] = useState("");
  const assistantContext = useMemo(
    () => buildAssistantContextFromApi(apiContext),
    [apiContext],
  );

  useEffect(() => {
    let active = true;

    async function loadContext() {
      try {
        const nextContext = await api.getAssistantContext("Dorm-A101", "1h");
        if (!active) {
          return;
        }
        setApiContext(nextContext);
        setError("");
      } catch (err) {
        if (!active) {
          return;
        }
        setApiContext(null);
        setError(err instanceof Error ? err.message : "assistant context 请求失败");
      }
    }

    loadContext();
    const interval = window.setInterval(loadContext, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    console.log("[Assistant] latest telemetry:", apiContext?.latest ?? null);
    console.log("[Assistant] data source:", assistantContext.dataMode);
    if (error) {
      console.log("[Assistant] context error:", error);
    }
  }, [apiContext, assistantContext.dataMode, error]);

  return (
    <div className="space-y-4">
      <AssistantHero context={assistantContext} />
      <section className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.95fr)]">
        <ChatPanel context={assistantContext} />
        <ContextPanel context={assistantContext} />
      </section>
    </div>
  );
}
