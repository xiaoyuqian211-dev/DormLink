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
};

export type HistoryPoint = Pick<
  TelemetryReading,
  "timestamp" | "temperature" | "humidity" | "air_quality" | "co2" | "light"
>;

export type HistoryResponse = {
  room_id: string;
  range: string;
  data: HistoryPoint[];
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
};

