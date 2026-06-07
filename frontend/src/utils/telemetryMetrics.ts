import type {
  HistoryPoint as ApiHistoryPoint,
  TelemetryReading,
  TelemetrySourceResponse,
} from "../types";
import type { MetricKey, SensorMetric, SensorStatus } from "../types/dorm";

export type TelemetryChartMetricKey = Exclude<MetricKey, "occupancy">;

export type TelemetryChartPoint = Record<TelemetryChartMetricKey, number> & {
  timestamp: string;
  time: string;
};

type MetricDefinition = {
  key: MetricKey;
  id: string;
  name: string;
  shortLabel: string;
  unit: string;
  areaId: string;
  areaName: string;
  warning?: number;
  danger?: number;
  direction?: "above" | "below";
  precision?: number;
};

const metricDefinitions: MetricDefinition[] = [
  {
    key: "temperature",
    id: "sensor_temperature",
    name: "温度",
    shortLabel: "Temp",
    unit: "°C",
    areaId: "desk",
    areaName: "宿舍环境",
    warning: 28,
    danger: 32,
    direction: "above",
    precision: 1,
  },
  {
    key: "humidity",
    id: "sensor_humidity",
    name: "湿度",
    shortLabel: "RH",
    unit: "%",
    areaId: "bed",
    areaName: "宿舍环境",
    warning: 70,
    danger: 82,
    direction: "above",
    precision: 1,
  },
  {
    key: "co2",
    id: "sensor_co2",
    name: "CO2",
    shortLabel: "CO2",
    unit: "ppm",
    areaId: "door",
    areaName: "空气质量",
    warning: 1000,
    danger: 1200,
    direction: "above",
  },
  {
    key: "light",
    id: "sensor_light",
    name: "光照",
    shortLabel: "Lux",
    unit: "lux",
    areaId: "window",
    areaName: "采光",
    warning: 120,
    danger: 60,
    direction: "below",
  },
  {
    key: "noise",
    id: "sensor_noise",
    name: "噪声",
    shortLabel: "Noise",
    unit: "dB",
    areaId: "door",
    areaName: "声音环境",
    warning: 55,
    danger: 70,
    direction: "above",
  },
  {
    key: "air_quality",
    id: "sensor_air_quality",
    name: "空气质量",
    shortLabel: "AQ",
    unit: "",
    areaId: "door",
    areaName: "空气质量",
    warning: 85,
    danger: 92,
    direction: "above",
  },
  {
    key: "tvoc",
    id: "sensor_tvoc",
    name: "TVOC",
    shortLabel: "TVOC",
    unit: "mg/m³",
    areaId: "door",
    areaName: "挥发物",
    warning: 0.6,
    danger: 1,
    direction: "above",
    precision: 2,
  },
  {
    key: "occupancy",
    id: "sensor_occupancy",
    name: "人体活动",
    shortLabel: "Motion",
    unit: "",
    areaId: "overview",
    areaName: "宿舍环境",
  },
];

export function rangeToApiRange(range: string) {
  if (range === "today") return "today";
  if (range === "7d") return "7d";
  if (range === "30d") return "30d";
  return "1h";
}

export function hasRealTelemetry(source: TelemetrySourceResponse | null) {
  return Boolean(source?.has_real_data && !source.fallback);
}

export function toTelemetryChartPoints(
  readings: ApiHistoryPoint[],
): TelemetryChartPoint[] {
  return [...readings]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map((reading) => ({
      timestamp: reading.timestamp,
      time: formatChartTime(reading.timestamp),
      temperature: roundMetric(reading.temperature, 1),
      humidity: roundMetric(reading.humidity, 1),
      co2: reading.co2,
      light: reading.light,
      noise: reading.noise,
      air_quality: reading.air_quality,
      tvoc: roundMetric(reading.tvoc, 2),
    }));
}

export function buildTelemetryMetrics(
  latest: TelemetryReading,
  history: ApiHistoryPoint[],
  fallbackMetrics: SensorMetric[],
): SensorMetric[] {
  const chartPoints = toTelemetryChartPoints(history);
  return metricDefinitions.map((definition) => {
    const fallback = fallbackMetrics.find((metric) => metric.key === definition.key);
    const value = readLatestMetric(latest, definition);
    const historyValues = buildMetricHistory(definition.key, chartPoints, latest);
    const status = statusFor(definition, value);
    const trendDelta = trendFor(historyValues, definition.unit, definition.precision);

    return {
      id: definition.id,
      key: definition.key,
      name: definition.name,
      shortLabel: definition.shortLabel,
      value:
        definition.key === "occupancy"
          ? latest.motion
            ? "有人"
            : "无人"
          : value,
      unit: definition.unit,
      status,
      statusText: statusText(status),
      areaId: definition.areaId,
      areaName: definition.areaName,
      position: fallback?.position,
      trend: trendDelta === "稳定" ? "最近数据稳定" : `最近变化 ${trendDelta}`,
      trendDelta,
      suggestion: suggestionFor(definition.key, status),
      threshold: definition.warning
        ? {
            warning: definition.warning,
            danger: definition.danger,
            direction: definition.direction ?? "above",
            label: thresholdLabel(definition),
          }
        : fallback?.threshold,
      confidence: 0.98,
      history: historyValues.length ? historyValues : fallback?.history ?? [Number(value) || 0],
    };
  });
}

export function chartMetricValue(
  point: TelemetryChartPoint,
  key: TelemetryChartMetricKey,
) {
  return point[key];
}

function buildMetricHistory(
  key: MetricKey,
  chartPoints: TelemetryChartPoint[],
  latest: TelemetryReading,
) {
  if (key === "occupancy") {
    return chartPoints.length
      ? chartPoints.map((point) => (point.timestamp ? (latest.motion ? 1 : 0) : 0))
      : [latest.motion ? 1 : 0];
  }

  const values = chartPoints
    .map((point) => point[key as TelemetryChartMetricKey])
    .filter((value) => Number.isFinite(value));

  if (values.length) {
    return values.slice(-12);
  }

  return [Number(readLatestMetric(latest, { key } as MetricDefinition)) || 0];
}

function readLatestMetric(latest: TelemetryReading, definition: MetricDefinition) {
  if (definition.key === "occupancy") {
    return latest.motion ? 1 : 0;
  }
  const value = latest[definition.key as keyof TelemetryReading];
  return roundMetric(Number(value), definition.precision ?? 0);
}

function statusFor(definition: MetricDefinition, value: number): SensorStatus {
  if (!definition.warning) {
    return "normal";
  }

  const danger = definition.danger ?? definition.warning;
  if (definition.direction === "below") {
    if (value <= danger) return "danger";
    if (value <= definition.warning) return "warning";
    return "normal";
  }

  if (value >= danger) return "danger";
  if (value >= definition.warning) return "warning";
  return "normal";
}

function statusText(status: SensorStatus) {
  if (status === "danger") return "告警";
  if (status === "warning") return "关注";
  if (status === "offline") return "离线";
  return "正常";
}

function suggestionFor(key: MetricKey, status: SensorStatus) {
  if (status === "normal") {
    return "当前指标处于正常范围。";
  }
  if (key === "co2" || key === "air_quality" || key === "tvoc") {
    return "建议优先开窗通风，并观察后续数据变化。";
  }
  if (key === "light") {
    return "建议补充照明或检查光照传感器位置。";
  }
  if (key === "noise") {
    return "建议确认噪声来源并降低持续干扰。";
  }
  return "建议关注该指标的连续变化。";
}

function thresholdLabel(definition: MetricDefinition) {
  if (!definition.warning) return "阈值策略";
  const direction = definition.direction === "below" ? "低于" : "高于";
  return `${direction} ${definition.warning}${definition.unit} 需要关注`;
}

function trendFor(values: number[], unit: string, precision = 0) {
  if (values.length < 2) {
    return "稳定";
  }
  const delta = roundMetric(values[values.length - 1] - values[0], precision);
  if (Math.abs(delta) < 0.01) {
    return "稳定";
  }
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta}${unit}`;
}

function roundMetric(value: number, precision = 0) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(value.toFixed(precision));
}

function formatChartTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}
