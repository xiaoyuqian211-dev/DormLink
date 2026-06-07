import type { TelemetryReading, TelemetrySourceResponse } from "../../types";
import { twinStatusUi } from "./designTokens";
import type {
  CameraFocus,
  CameraPreset,
  CameraPresetId,
  SelectableId,
  SensorId,
  SensorReading,
  SensorStatus,
  TwinArea,
  TwinAreaId,
  Vector3Tuple,
} from "./types";

type SensorDefinition = {
  id: SensorId;
  key: keyof Pick<
    TelemetryReading,
    | "temperature"
    | "humidity"
    | "co2"
    | "light"
    | "noise"
    | "air_quality"
    | "tvoc"
    | "motion"
  >;
  name: string;
  metric: string;
  shortLabel: string;
  unit: string;
  position: Vector3Tuple;
  areaId: TwinAreaId;
  areaName: string;
  precision?: number;
  threshold?: {
    warning: number;
    danger?: number;
    direction: "above" | "below";
    label: string;
  };
};

type AreaDefinition = {
  id: TwinAreaId;
  name: string;
  position: Vector3Tuple;
  relatedSensors: SensorId[];
};

export type RoomSnapshot = {
  roomId: string;
  deviceId: string;
  occupancy: string;
  mode: string;
  summary: string;
};

const sensorDefinitions: SensorDefinition[] = [
  {
    id: "sensor_temperature",
    key: "temperature",
    name: "温度传感器",
    metric: "温度",
    shortLabel: "Temp",
    unit: "°C",
    position: [1.2, 1.55, -0.78],
    areaId: "desk",
    areaName: "书桌区域",
    precision: 1,
    threshold: { warning: 28, danger: 32, direction: "above", label: "高于 28°C 需要关注" },
  },
  {
    id: "sensor_humidity",
    key: "humidity",
    name: "湿度传感器",
    metric: "湿度",
    shortLabel: "RH",
    unit: "%",
    position: [-1.1, 1.38, 0.58],
    areaId: "bed",
    areaName: "床铺区域",
    precision: 1,
    threshold: { warning: 70, danger: 82, direction: "above", label: "高于 70% 需要关注" },
  },
  {
    id: "sensor_co2",
    key: "co2",
    name: "CO2 传感器",
    metric: "CO₂",
    shortLabel: "CO₂",
    unit: "ppm",
    position: [0.18, 1.48, 1.06],
    areaId: "door",
    areaName: "门口区域",
    threshold: { warning: 1000, danger: 1200, direction: "above", label: "高于 1000 ppm 需要通风" },
  },
  {
    id: "sensor_light",
    key: "light",
    name: "光照传感器",
    metric: "光照",
    shortLabel: "Lux",
    unit: "lux",
    position: [-1.42, 1.78, -1.22],
    areaId: "window",
    areaName: "窗户区域",
    threshold: { warning: 120, danger: 60, direction: "below", label: "低于 120 lux 需要补光" },
  },
  {
    id: "sensor_noise",
    key: "noise",
    name: "噪声传感器",
    metric: "噪声",
    shortLabel: "Noise",
    unit: "dB",
    position: [1.42, 1.18, 1.18],
    areaId: "door",
    areaName: "门口区域",
    threshold: { warning: 55, danger: 70, direction: "above", label: "高于 55 dB 需要关注" },
  },
  {
    id: "sensor_air_quality",
    key: "air_quality",
    name: "空气质量传感器",
    metric: "空气质量",
    shortLabel: "AQ",
    unit: "",
    position: [0.42, 1.52, 0.84],
    areaId: "door",
    areaName: "空气质量",
    threshold: { warning: 85, danger: 92, direction: "above", label: "高于 85 需要关注" },
  },
  {
    id: "sensor_tvoc",
    key: "tvoc",
    name: "TVOC 传感器",
    metric: "TVOC",
    shortLabel: "TVOC",
    unit: "mg/m³",
    position: [0.56, 1.34, 0.72],
    areaId: "door",
    areaName: "挥发物",
    precision: 2,
    threshold: { warning: 0.6, danger: 1, direction: "above", label: "高于 0.6 mg/m³ 需要通风" },
  },
  {
    id: "sensor_motion",
    key: "motion",
    name: "人体活动传感器",
    metric: "人体活动",
    shortLabel: "Motion",
    unit: "",
    position: [-0.25, 1.18, 0.25],
    areaId: "bed",
    areaName: "宿舍环境",
  },
];

const sceneSensorIds: SensorId[] = [
  "sensor_temperature",
  "sensor_humidity",
  "sensor_co2",
  "sensor_light",
  "sensor_noise",
];

const areaDefinitions: AreaDefinition[] = [
  {
    id: "bed",
    name: "床铺区域",
    position: [-1.25, 0.42, 0.58],
    relatedSensors: ["sensor_humidity", "sensor_noise", "sensor_motion"],
  },
  {
    id: "desk",
    name: "书桌区域",
    position: [1.15, 0.68, -0.72],
    relatedSensors: ["sensor_temperature", "sensor_light"],
  },
  {
    id: "door",
    name: "门口区域",
    position: [1.85, 0.85, 0.82],
    relatedSensors: ["sensor_co2", "sensor_noise", "sensor_air_quality", "sensor_tvoc"],
  },
  {
    id: "window",
    name: "窗户/阳台",
    position: [-0.2, 1.28, -1.55],
    relatedSensors: ["sensor_light", "sensor_co2"],
  },
  {
    id: "wardrobe",
    name: "衣柜区域",
    position: [-1.86, 0.92, -1.02],
    relatedSensors: ["sensor_humidity", "sensor_tvoc"],
  },
  {
    id: "air_conditioner",
    name: "空调/通风口",
    position: [1.45, 1.72, -1.56],
    relatedSensors: ["sensor_temperature", "sensor_co2"],
  },
];

export const sensorStatusLabel: Record<SensorStatus, string> = {
  normal: "稳定",
  warning: "关注",
  danger: "告警",
};

export const sensorStatusTone = twinStatusUi;

export const cameraPresets: CameraPreset[] = [
  { id: "overview", label: "俯视全局", position: [4.6, 4.2, 5.0], target: [0, 0.58, 0] },
  { id: "bed", label: "床铺区域", position: [-3.65, 2.75, 2.95], target: [-1.08, 0.62, 0.56] },
  { id: "desk", label: "书桌区域", position: [3.85, 2.7, -2.85], target: [1.08, 0.72, -0.78] },
  { id: "door", label: "门口区域", position: [4.35, 2.65, 3.1], target: [1.24, 0.72, 0.62] },
  { id: "window", label: "窗户/阳台", position: [-3.25, 3.0, -3.45], target: [-0.28, 0.98, -1.12] },
  { id: "sensors", label: "传感器点位", position: [4.85, 3.75, 4.45], target: [0.04, 1.02, 0.04] },
];

const sensorPositions = new Map(sensorDefinitions.map((sensor) => [sensor.id, sensor.position]));

const areaFocus: Record<TwinAreaId, CameraFocus> = {
  bed: cameraPresets[1],
  desk: cameraPresets[2],
  door: cameraPresets[3],
  window: cameraPresets[4],
  wardrobe: {
    position: [-4.05, 2.65, -2.95],
    target: [-1.65, 0.86, -0.88],
  },
  air_conditioner: {
    position: [3.85, 3.05, -3.25],
    target: [1.12, 1.24, -1.16],
  },
};

const sensorFocus = Object.fromEntries(
  sensorDefinitions.map((sensor) => {
    const [x, y, z] = sensor.position;
    return [
      sensor.id,
      {
        position: [x + 2.7, Math.max(2.65, y + 1.25), z + 2.55],
        target: sensor.position,
      },
    ];
  }),
) as Record<SensorId, CameraFocus>;

export const cameraFocusMap: Record<CameraPresetId | SelectableId, CameraFocus> = {
  overview: cameraPresets[0],
  sensors: cameraPresets[5],
  ...areaFocus,
  ...sensorFocus,
};

export const selectableIds = new Set<SelectableId>([
  ...areaDefinitions.map((area) => area.id),
  ...sensorDefinitions.map((sensor) => sensor.id),
]);

export function buildTwinSensors(latest: TelemetryReading | null, hasRealData: boolean) {
  const sensorsById = Object.fromEntries(
    sensorDefinitions.map((definition) => [
      definition.id,
      buildSensor(definition, latest, hasRealData),
    ]),
  ) as Record<SensorId, SensorReading>;

  const sceneSensors = sceneSensorIds.map((id) => sensorsById[id]);
  return { sensorsById, sceneSensors };
}

export function buildTwinAreas(sensorsById: Record<SensorId, SensorReading>) {
  return Object.fromEntries(
    areaDefinitions.map((definition) => {
      const relatedSensors = definition.relatedSensors
        .map((id) => sensorsById[id])
        .filter(Boolean);
      const status = highestStatus(relatedSensors.map((sensor) => sensor.status));
      const area: TwinArea = {
        id: definition.id,
        name: definition.name,
        status,
        position: definition.position,
        relatedSensors: definition.relatedSensors,
        summary: areaSummary(definition.id, relatedSensors),
        suggestion: areaSuggestion(definition.id, relatedSensors),
      };

      return [definition.id, area];
    }),
  ) as Record<TwinAreaId, TwinArea>;
}

export function buildRoomSnapshot(
  latest: TelemetryReading | null,
  sourceStatus: TelemetrySourceResponse | null,
  hasRealData: boolean,
): RoomSnapshot {
  if (!hasRealData || !latest) {
    return {
      roomId: "Dorm-A101",
      deviceId: "--",
      occupancy: "等待真实上报",
      mode: "演示数据",
      summary: "后端还没有可用的真实 MQTT 数据，数字孪生当前处于演示状态。",
    };
  }

  return {
    roomId: latest.room_id,
    deviceId: latest.device_id,
    occupancy: latest.motion ? "有人活动" : "无人活动",
    mode: sourceStatus?.fallback ? "演示数据" : "ConnectLab MQTT",
    summary: environmentSummary(latest),
  };
}

export function getSelectedSensor(
  id: SelectableId,
  sensorsById: Record<SensorId, SensorReading>,
) {
  return sensorsById[id as SensorId] ?? null;
}

export function getSelectedArea(
  id: SelectableId,
  areas: Record<TwinAreaId, TwinArea>,
) {
  return areas[id as TwinAreaId] ?? null;
}

export function getStatusOf(
  id: SelectableId,
  sensorsById: Record<SensorId, SensorReading>,
  areas: Record<TwinAreaId, TwinArea>,
): SensorStatus {
  return getSelectedSensor(id, sensorsById)?.status ?? getSelectedArea(id, areas)?.status ?? "normal";
}

function buildSensor(
  definition: SensorDefinition,
  latest: TelemetryReading | null,
  hasRealData: boolean,
): SensorReading {
  const numericValue = readNumericValue(definition, latest, hasRealData);
  const value = readDisplayValue(definition, latest, hasRealData, numericValue);
  const status = statusFor(definition, numericValue);

  return {
    id: definition.id,
    name: definition.name,
    metric: definition.metric,
    shortLabel: definition.shortLabel,
    value,
    numericValue,
    unit: definition.unit,
    status,
    statusText: statusText(status, hasRealData),
    position: definition.position,
    areaId: definition.areaId,
    areaName: definition.areaName,
    trend: hasRealData ? trendText(definition, numericValue) : "等待真实数据",
    suggestion: suggestionFor(definition, status, hasRealData),
    threshold: definition.threshold,
    confidence: hasRealData ? 0.98 : 0.4,
  };
}

function readNumericValue(
  definition: SensorDefinition,
  latest: TelemetryReading | null,
  hasRealData: boolean,
) {
  if (!hasRealData || !latest || definition.key === "motion") {
    return null;
  }

  return roundMetric(Number(latest[definition.key]), definition.precision ?? 0);
}

function readDisplayValue(
  definition: SensorDefinition,
  latest: TelemetryReading | null,
  hasRealData: boolean,
  numericValue: number | null,
) {
  if (!hasRealData || !latest) {
    return "--";
  }

  if (definition.key === "motion") {
    return latest.motion ? "有人" : "无人";
  }

  return numericValue ?? "--";
}

function statusFor(definition: SensorDefinition, numericValue: number | null): SensorStatus {
  if (numericValue === null || !definition.threshold) {
    return "normal";
  }

  const danger = definition.threshold.danger ?? definition.threshold.warning;
  if (definition.threshold.direction === "below") {
    if (numericValue <= danger) return "danger";
    if (numericValue <= definition.threshold.warning) return "warning";
    return "normal";
  }

  if (numericValue >= danger) return "danger";
  if (numericValue >= definition.threshold.warning) return "warning";
  return "normal";
}

function statusText(status: SensorStatus, hasRealData: boolean) {
  if (!hasRealData) return "演示";
  if (status === "danger") return "告警";
  if (status === "warning") return "关注";
  return "稳定";
}

function suggestionFor(definition: SensorDefinition, status: SensorStatus, hasRealData: boolean) {
  if (!hasRealData) {
    return "等待 MQTT 实时数据后生成建议。";
  }
  if (status === "normal") {
    return `${definition.metric} 当前稳定，保持现有环境策略。`;
  }
  if (definition.id === "sensor_co2" || definition.id === "sensor_air_quality" || definition.id === "sensor_tvoc") {
    return "建议优先开窗通风，并观察 CO₂、空气质量和 TVOC 后续变化。";
  }
  if (definition.id === "sensor_noise") {
    return "建议确认噪声来源，避免持续干扰。";
  }
  if (definition.id === "sensor_light") {
    return "建议补充照明或检查光照传感器位置。";
  }
  return "建议关注该指标的连续变化。";
}

function trendText(definition: SensorDefinition, numericValue: number | null) {
  if (numericValue === null) {
    return "实时状态已同步";
  }
  return `当前值 ${formatValue(numericValue, definition.unit)}`;
}

function areaSummary(id: TwinAreaId, sensors: SensorReading[]) {
  const warnings = sensors.filter((sensor) => sensor.status !== "normal");
  if (!warnings.length) {
    return "相关指标处于稳定范围，当前区域状态舒适。";
  }

  const warningText = warnings
    .map((sensor) => `${sensor.metric} ${formatSensorValue(sensor)}`)
    .join("，");
  if (id === "door") {
    return `门口空气相关指标需要关注：${warningText}。`;
  }
  return `该区域存在需要关注的指标：${warningText}。`;
}

function areaSuggestion(id: TwinAreaId, sensors: SensorReading[]) {
  const hasCo2Risk = sensors.some((sensor) => sensor.id === "sensor_co2" && sensor.status !== "normal");
  const hasNoiseRisk = sensors.some((sensor) => sensor.id === "sensor_noise" && sensor.status !== "normal");
  if (hasCo2Risk) {
    return "CO₂ 偏高，建议打开窗户或形成短时对流。";
  }
  if (hasNoiseRisk) {
    return "噪声偏高，建议定位噪声来源并降低持续影响。";
  }
  if (id === "bed") {
    return "湿度和噪声稳定，适合休息。";
  }
  if (id === "desk") {
    return "温度和光照稳定，适合学习。";
  }
  return "保持当前通风和传感器巡检节奏。";
}

function environmentSummary(latest: TelemetryReading) {
  const parts = [
    `温度 ${formatValue(latest.temperature, "°C")}`,
    `湿度 ${formatValue(latest.humidity, "%")}`,
    `CO₂ ${formatValue(latest.co2, "ppm")}`,
    `噪声 ${formatValue(latest.noise, "dB")}`,
  ];
  const motion = latest.motion ? "检测到有人活动" : "未检测到明显活动";
  return `${parts.join("，")}，${motion}。`;
}

function highestStatus(statuses: SensorStatus[]): SensorStatus {
  if (statuses.includes("danger")) return "danger";
  if (statuses.includes("warning")) return "warning";
  return "normal";
}

function formatSensorValue(sensor: SensorReading) {
  if (sensor.value === "--") {
    return "--";
  }
  return `${sensor.value}${sensor.unit}`;
}

function formatValue(value: number, unit: string) {
  const precision = Math.abs(value) < 10 && !Number.isInteger(value) ? 2 : 1;
  const formatted = Number(value.toFixed(precision));
  return `${formatted}${unit}`;
}

function roundMetric(value: number, precision = 0) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(value.toFixed(precision));
}

export function sensorPosition(id: SensorId) {
  return sensorPositions.get(id);
}
