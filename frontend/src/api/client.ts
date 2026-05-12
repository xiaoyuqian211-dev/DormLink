import type {
  ChatAnswer,
  EnvironmentState,
  FeedbackPayload,
  FeedbackResponse,
  HistoryResponse,
  PredictionResponse,
  TelemetryReading,
  TwinState,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

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

  getTelemetryHistory: (range = "1h") =>
    request<HistoryResponse>(
      `/api/v1/telemetry/history?range=${encodeURIComponent(range)}`,
    ),

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

  submitFeedback: (payload: FeedbackPayload) =>
    request<FeedbackResponse>("/api/v1/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

