import {
  aiInsight,
  cameraPresets as dormCameraPresets,
  dormRoom,
  environmentScore,
  roomAreas as dormRoomAreas,
  sensorMetrics,
} from "../../data/mockDormData";
import type { SensorMetric } from "../../types/dorm";
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
} from "./types";

const digitalTwinSensorIds: SensorId[] = [
  "sensor_temperature",
  "sensor_humidity",
  "sensor_co2",
  "sensor_light",
  "sensor_noise",
];

function normalizeStatus(status: SensorMetric["status"]): SensorStatus {
  return status === "offline" ? "warning" : status;
}

export const sensorStatusLabel: Record<SensorStatus, string> = {
  normal: "稳定",
  warning: "关注",
  danger: "告警",
};

export const sensorStatusTone = twinStatusUi;

const sensorMetricById = new Map(sensorMetrics.map((metric) => [metric.id, metric]));

export const sensorMockData = Object.fromEntries(
  digitalTwinSensorIds.map((id) => {
    const metric = sensorMetricById.get(id);
    if (!metric || !metric.position) {
      throw new Error(`Missing digital twin sensor metric: ${id}`);
    }

    const reading: SensorReading = {
      id,
      name: metric.name,
      metric: metric.key === "co2" ? "CO₂" : metric.name.replace("传感器", ""),
      shortLabel: metric.shortLabel,
      value: Number(metric.value),
      unit: metric.unit,
      status: normalizeStatus(metric.status),
      statusText: metric.statusText,
      position: metric.position,
      areaId: metric.areaId as TwinAreaId,
      areaName: metric.areaName,
      trend: metric.trend,
      suggestion: metric.suggestion,
      threshold: metric.threshold,
      confidence: metric.confidence,
    };

    return [id, reading];
  }),
) as Record<SensorId, SensorReading>;

export const sensors = Object.values(sensorMockData);

export const twinAreas = Object.fromEntries(
  Object.entries(dormRoomAreas).map(([id, area]) => {
    const twinArea: TwinArea = {
      id: id as TwinAreaId,
      name: area.name,
      status: normalizeStatus(area.status as SensorMetric["status"]),
      position: area.position,
      summary: area.summary,
      suggestion: area.suggestion,
      relatedSensors: area.relatedSensors as SensorId[],
    };

    return [id, twinArea];
  }),
) as Record<TwinAreaId, TwinArea>;

export const twinAreaList = Object.values(twinAreas);

export const cameraPresets = dormCameraPresets.map((preset) => ({
  id: preset.id as CameraPresetId,
  label: preset.label,
  position: preset.position,
  target: preset.target,
})) as CameraPreset[];

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

const sensorFocus = sensors.reduce<Record<SensorId, CameraFocus>>((acc, sensor) => {
  const [x, y, z] = sensor.position;
  acc[sensor.id] = {
    position: [x + 2.7, Math.max(2.65, y + 1.25), z + 2.55],
    target: sensor.position,
  };
  return acc;
}, {} as Record<SensorId, CameraFocus>);

export const cameraFocusMap: Record<CameraPresetId | SelectableId, CameraFocus> = {
  overview: cameraPresets[0],
  sensors: cameraPresets[5],
  ...areaFocus,
  ...sensorFocus,
};

export const selectableIds = new Set<SelectableId>([
  ...twinAreaList.map((area) => area.id),
  ...sensors.map((sensor) => sensor.id),
]);

export function getSelectedSensor(id: SelectableId) {
  return sensorMockData[id as SensorId] ?? null;
}

export function getSelectedArea(id: SelectableId) {
  return twinAreas[id as TwinAreaId] ?? null;
}

export function getStatusOf(id: SelectableId): SensorStatus {
  return getSelectedSensor(id)?.status ?? getSelectedArea(id)?.status ?? "normal";
}

export const roomSnapshot = {
  roomId: dormRoom.id,
  comfortScore: environmentScore.score,
  occupancy: dormRoom.occupancy,
  mode: dormRoom.mode,
  summary: aiInsight.summary,
};
