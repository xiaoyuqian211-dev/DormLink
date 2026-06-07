export type SensorStatus = "normal" | "warning" | "danger" | "offline";

export type MetricKey =
  | "temperature"
  | "humidity"
  | "co2"
  | "light"
  | "noise"
  | "air_quality"
  | "tvoc"
  | "occupancy";

export type Vector3Tuple = [number, number, number];

export type DormRoom = {
  id: string;
  name: string;
  building: string;
  floor: string;
  mode: "演示数据" | "实时数据" | "本地联调";
  online: boolean;
  updatedAt: string;
  occupancy: string;
  gatewayStatus: SensorStatus;
  dataQuality: number;
};

export type SensorMetric = {
  id: string;
  key: MetricKey;
  name: string;
  shortLabel: string;
  value: number | string;
  unit: string;
  status: SensorStatus;
  statusText: string;
  areaId: string;
  areaName: string;
  position?: Vector3Tuple;
  trend: string;
  trendDelta: string;
  suggestion: string;
  threshold?: {
    warning: number;
    danger?: number;
    direction: "above" | "below";
    label: string;
  };
  confidence?: number;
  history: number[];
};

export type AlertEvent = {
  id: string;
  time: string;
  metric: string;
  title: string;
  status: SensorStatus;
  area: string;
  reason: string;
  suggestion: string;
};

export type TimelineEvent = {
  id: string;
  time: string;
  title: string;
  description: string;
  status: SensorStatus;
};

export type AIInsight = {
  title: string;
  summary: string;
  judgement: string;
  basis: string[];
  recommendation: string;
  confidence: number;
};

export type CameraPresetId =
  | "overview"
  | "bed"
  | "desk"
  | "door"
  | "window"
  | "sensors";

export type CameraPreset = {
  id: CameraPresetId;
  label: string;
  position: Vector3Tuple;
  target: Vector3Tuple;
};

export type HistoryPoint = {
  time: string;
  temperature: number;
  humidity: number;
  co2: number;
  light: number;
  noise: number;
  air_quality?: number;
  tvoc?: number;
};
