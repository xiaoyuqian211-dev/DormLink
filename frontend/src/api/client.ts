import type {
  AssistantAskPayload,
  AssistantAskResponse,
  AssistantContextResponse,
  ChatAnswer,
  EnvironmentState,
  FeedbackPayload,
  FeedbackResponse,
  HistoryResponse,
  PredictionResponse,
  TelemetryReading,
  TelemetrySourceResponse,
  TelemetrySummaryResponse,
  TwinState,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? "" : "http://localhost:8000");

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  getCurrentTelemetry: () =>
    request<TelemetryReading>("/api/v1/telemetry/current"),

  getEnvironmentState: () =>
    request<EnvironmentState>("/api/v1/telemetry/state"),

  getTelemetryHistory: (
    range = "1h",
    options: { roomId?: string; start?: string; end?: string } = {},
  ) => {
    const params = new URLSearchParams({ range });
    if (options.roomId) params.set("room_id", options.roomId);
    if (options.start) params.set("start", options.start);
    if (options.end) params.set("end", options.end);
    return request<HistoryResponse>(
      `/api/telemetry/history?${params.toString()}`,
    );
  },

  getTelemetrySummary: (roomId = "Dorm-A101", window = "1h") =>
    request<TelemetrySummaryResponse>(
      `/api/telemetry/summary?room_id=${encodeURIComponent(roomId)}&window=${encodeURIComponent(window)}`,
    ),

  getTelemetrySource: () =>
    request<TelemetrySourceResponse>("/api/v1/telemetry/source"),

  getPrediction: (horizon = "30min") =>
    request<PredictionResponse>(
      `/api/v1/prediction/short-term?horizon=${encodeURIComponent(horizon)}`,
    ),

  getTwinState: () => request<TwinState>("/api/v1/twin/state"),

  askQuestion: (question: string) =>
    request<ChatAnswer>("/api/v1/chat/ask", {
      method: "POST",
      body: JSON.stringify({ question }),
    }),

  getAssistantContext: (roomId = "Dorm-A101", window = "1h") =>
    request<AssistantContextResponse>(
      `/api/assistant/context?room_id=${encodeURIComponent(roomId)}&window=${encodeURIComponent(window)}`,
    ),

  askAssistant: (payload: AssistantAskPayload) =>
    request<AssistantAskResponse>("/api/assistant/ask", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  submitFeedback: (payload: FeedbackPayload) =>
    request<FeedbackResponse>("/api/v1/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
