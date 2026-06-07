import { useEffect, useState } from "react";
import { api } from "../api/client";
import type {
  HistoryPoint as ApiHistoryPoint,
  TelemetryReading,
  TelemetrySourceResponse,
} from "../types";
import { hasRealTelemetry } from "../utils/telemetryMetrics";

type UseRealtimeTelemetryOptions = {
  historyRange?: string;
  intervalMs?: number;
  debugLabel?: string;
};

export function useRealtimeTelemetry({
  historyRange = "1h",
  intervalMs = 5000,
  debugLabel,
}: UseRealtimeTelemetryOptions = {}) {
  const [sourceStatus, setSourceStatus] = useState<TelemetrySourceResponse | null>(null);
  const [latestTelemetry, setLatestTelemetry] = useState<TelemetryReading | null>(null);
  const [historyTelemetry, setHistoryTelemetry] = useState<ApiHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTelemetry() {
      try {
        const [source, current, history] = await Promise.all([
          api.getTelemetrySource(),
          api.getCurrentTelemetry(),
          api.getTelemetryHistory(historyRange),
        ]);

        if (!active) {
          return;
        }

        const realDataReady = hasRealTelemetry(source);
        setSourceStatus(source);
        setLatestTelemetry(realDataReady ? current : null);
        setHistoryTelemetry(realDataReady ? history.data : []);
        setError("");

        if (debugLabel) {
          console.log(`[${debugLabel}] latest telemetry:`, realDataReady ? current : null);
        }
      } catch (err) {
        if (!active) {
          return;
        }

        setSourceStatus(null);
        setLatestTelemetry(null);
        setHistoryTelemetry([]);
        setError(err instanceof Error ? err.message : "Telemetry request failed");

        if (debugLabel) {
          console.log(`[${debugLabel}] latest telemetry:`, null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTelemetry();
    const interval = window.setInterval(loadTelemetry, intervalMs);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [debugLabel, historyRange, intervalMs]);

  return {
    sourceStatus,
    latestTelemetry,
    historyTelemetry,
    loading,
    error,
    hasRealData: hasRealTelemetry(sourceStatus) && latestTelemetry !== null,
  };
}
