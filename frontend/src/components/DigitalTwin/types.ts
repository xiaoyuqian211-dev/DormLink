export type Vector3Tuple = [number, number, number];

export type SensorStatus = "normal" | "warning" | "danger";

export type TwinAreaId =
  | "bed"
  | "desk"
  | "door"
  | "window"
  | "wardrobe"
  | "air_conditioner";

export type SensorId =
  | "sensor_temperature"
  | "sensor_humidity"
  | "sensor_co2"
  | "sensor_light"
  | "sensor_noise";

export type SelectableId = TwinAreaId | SensorId;

export type SensorReading = {
  id: SensorId;
  name: string;
  metric: string;
  shortLabel: string;
  value: number;
  unit: string;
  status: SensorStatus;
  statusText: string;
  position: Vector3Tuple;
  areaId: TwinAreaId;
  suggestion: string;
  trend: string;
  threshold?: {
    warning: number;
    danger?: number;
    direction: "above" | "below";
    label: string;
  };
  confidence?: number;
  areaName?: string;
};

export type TwinArea = {
  id: TwinAreaId;
  name: string;
  status: SensorStatus;
  position: Vector3Tuple;
  summary: string;
  suggestion: string;
  relatedSensors: SensorId[];
};

export type CameraPresetId =
  | "overview"
  | "bed"
  | "desk"
  | "door"
  | "window"
  | "sensors";

export type CameraFocus = {
  position: Vector3Tuple;
  target: Vector3Tuple;
};

export type CameraPreset = CameraFocus & {
  id: CameraPresetId;
  label: string;
};

export type FocusRequest = {
  key: CameraPresetId | SelectableId;
  sequence: number;
};
