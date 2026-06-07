export type TelemetryReading = {
  room_id: string;
  device_id: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  light: number;
  air_quality: number;
  co2: number;
  tvoc: number;
  motion: boolean;
  noise: number;
  signal_strength: number;
  persons: number;
};

export type HistoryPoint = Pick<
  TelemetryReading,
  | "timestamp"
  | "room_id"
  | "device_id"
  | "temperature"
  | "humidity"
  | "light"
  | "air_quality"
  | "co2"
  | "tvoc"
  | "motion"
  | "noise"
  | "signal_strength"
  | "persons"
>;

export type HistoryResponse = {
  room_id: string;
  range: string;
  data: HistoryPoint[];
  data_status?: "real" | "mock" | string;
  sample_count?: number;
};

export type TelemetryLatestResponse = {
  source: "database" | "mock" | string;
  data_status: "real" | "mock" | string;
  data: TelemetryReading | null;
};

export type MetricStat = {
  avg: number | null;
  min: number | null;
  max: number | null;
  delta: number | null;
};

export type TelemetrySummaryResponse = {
  room_id: string;
  window: string;
  latest: TelemetryReading | null;
  stats: Record<"temperature" | "humidity" | "co2" | "noise" | "light", MetricStat>;
  sample_count: number;
  data_status: "real" | "mock" | string;
};

export type TelemetrySourceResponse = {
  mode: string;
  topic: string;
  has_real_data: boolean;
  last_seen: string | null;
  fallback: boolean;
};

export type EnvironmentState = {
  room_id: string;
  comfort_level:
    | "comfortable"
    | "acceptable"
    | "slightly_uncomfortable"
    | "uncomfortable";
  comfort_score: number;
  temperature_state: "cold" | "cool" | "normal" | "hot";
  humidity_state: "dry" | "normal" | "humid";
  air_state: "good" | "moderate" | "poor";
  light_state: "dim" | "normal" | "bright";
  occupancy_state: "occupied" | "vacant";
  summary: string;
};

export type PredictionResponse = {
  room_id: string;
  horizon: string;
  temperature_trend: "rising" | "falling" | "stable";
  humidity_trend: "rising" | "falling" | "stable";
  air_quality_trend: "improving" | "worsening" | "stable";
  risk_level: "low" | "medium" | "high";
  risk_summary: string;
};

export type TwinZone = {
  zone_id: "window" | "desk" | "bed" | "door" | string;
  name: string;
  state: string;
  risk_level: "low" | "medium" | "high";
};

export type TwinState = {
  room_id: string;
  room_status: "occupied" | "vacant";
  comfort_score: number;
  zones: TwinZone[];
  future_hint: string;
  recommended_actions: string[];
};

export type FeedbackPayload = {
  room_id: string;
  feedback_type: string;
  system_judgement: string;
  user_response: string;
  scene_label: string;
  comment: string;
};

export type FeedbackResponse = {
  success: boolean;
  message: string;
};

export type ChatAnswer = {
  answer: string;
  data_status?: "real" | "mock" | string;
  confidence?: number;
  context?: AssistantContextResponse;
};

export type AssistantRecentEventResponse = {
  type: string;
  time: string;
  value: number | string | boolean | null;
  message: string;
};

export type AssistantContextResponse = {
  room_id: string;
  window: string;
  data_status: "real" | "mock" | string;
  latest: TelemetryReading | null;
  recent_summary: TelemetrySummaryResponse;
  recent_events: AssistantRecentEventResponse[];
  thresholds: Record<string, number>;
  confidence: number;
};

export type AssistantAskPayload = {
  room_id: string;
  question: string;
  window: string;
};

export type AssistantAskResponse = {
  answer: string;
  data_status: "real" | "mock" | string;
  confidence: number;
  context: AssistantContextResponse;
};
