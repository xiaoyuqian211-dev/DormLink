import type {
  AssistantContextResponse,
  HistoryPoint as ApiHistoryPoint,
  TelemetryReading,
  TelemetrySourceResponse,
} from "../types";
import type { AssistantCard } from "../types/assistant";
import type { SensorStatus } from "../types/dorm";

export type AssistantMetric = {
  key: "temperature" | "humidity" | "co2" | "noise" | "light" | "air_quality" | "tvoc" | "motion";
  label: string;
  value: string;
  status: SensorStatus;
  statusText: string;
};

export type AssistantRecentEvent = {
  id: string;
  time: string;
  title: string;
  description: string;
};

export type AssistantContext = {
  dataMode: "real" | "mock";
  dataStatusLabel: string;
  roomId: string;
  deviceId: string;
  confidence: number;
  summary: string;
  recommendation: string;
  basis: string[];
  metrics: AssistantMetric[];
  recentEvents: AssistantRecentEvent[];
  quickQuestions: string[];
  latest: TelemetryReading | null;
  history: ApiHistoryPoint[];
  window: string;
  sampleCount: number;
};

const quickQuestions = [
  "为什么 CO₂ 偏高？",
  "现在是否适合睡眠？",
  "建议开窗多久？",
  "最近一小时有什么变化？",
  "哪个区域最需要处理？",
];

export function buildAssistantContext({
  latest,
  history,
  sourceStatus,
  hasRealData,
}: {
  latest: TelemetryReading | null;
  history: ApiHistoryPoint[];
  sourceStatus: TelemetrySourceResponse | null;
  hasRealData: boolean;
}): AssistantContext {
  if (!hasRealData || !latest) {
    return {
      dataMode: "mock",
      dataStatusLabel: "演示数据",
      roomId: "Dorm-A101",
      deviceId: "--",
      confidence: 62,
      summary: "后端暂未返回真实 MQTT telemetry，当前解释上下文处于演示/占位状态。",
      recommendation: "请先确认后端 MQTT Bridge 已连接并且 latest API 有真实数据。",
      basis: [
        "未读取到可用 latest telemetry。",
        "页面不会在这种状态下声称数据来自真实设备。",
        "恢复真实上报后会自动切换为 MQTT 实时上下文。",
      ],
      metrics: buildEmptyMetrics(),
      recentEvents: [],
      quickQuestions,
      latest: null,
      history: [],
      window: "1h",
      sampleCount: 0,
    };
  }

  const metrics = buildMetrics(latest);
  const stale = isStale(latest.timestamp);
  const confidence = calculateConfidence(latest, sourceStatus, stale);
  const concernMetrics = metrics.filter((metric) => metric.status !== "normal");
  const summary = buildSummary(latest, concernMetrics);

  return {
    dataMode: "real",
    dataStatusLabel: "MQTT 实时",
    roomId: latest.room_id,
    deviceId: latest.device_id,
    confidence,
    summary,
    recommendation: buildRecommendation(latest, concernMetrics),
    basis: buildBasis(latest, history, concernMetrics, confidence),
    metrics,
    recentEvents: buildRecentEvents(history),
    quickQuestions,
    latest,
    history,
    window: "1h",
    sampleCount: history.length,
  };
}

export function buildAssistantContextFromApi(
  apiContext: AssistantContextResponse | null,
): AssistantContext {
  if (!apiContext?.latest || apiContext.data_status !== "real") {
    return buildAssistantContext({
      latest: null,
      history: [],
      sourceStatus: null,
      hasRealData: false,
    });
  }

  const latest = apiContext.latest;
  const summary = apiContext.recent_summary;
  const metrics = buildMetrics(latest);
  const concernMetrics = metrics.filter((metric) => metric.status !== "normal");
  const confidence = Math.round(apiContext.confidence * 100);

  return {
    dataMode: "real",
    dataStatusLabel: "MQTT 实时",
    roomId: apiContext.room_id,
    deviceId: latest.device_id,
    confidence,
    summary: buildSummary(latest, concernMetrics),
    recommendation: buildRecommendation(latest, concernMetrics),
    basis: buildApiBasis(apiContext, confidence),
    metrics,
    recentEvents: apiContext.recent_events.map((event, index) => ({
      id: `${event.type}-${event.time}-${index}`,
      time: formatTime(event.time),
      title: event.message,
      description: `${event.type}：${event.value}`,
    })),
    quickQuestions,
    latest,
    history: [],
    window: apiContext.window,
    sampleCount: summary.sample_count,
  };
}

export function buildAssistantReply(question: string, context: AssistantContext) {
  const normalized = question.toLowerCase();
  const includesCo2 = question.includes("CO₂") || question.includes("CO2") || normalized.includes("co2");

  if (!context.latest) {
    return {
      id: `assistant-${Date.now()}`,
      role: "assistant" as const,
      content: "当前还没有真实 telemetry 上下文。请先确认后端 latest/history API 返回真实 MQTT 数据，页面会自动切换到 MQTT 实时解释。",
      cards: [
        { label: "数据状态", value: context.dataStatusLabel, tone: "amber" as const },
        { label: "房间", value: context.roomId, tone: "slate" as const },
        { label: "置信度", value: `${context.confidence}%`, tone: "amber" as const },
      ],
    };
  }

  const latest = context.latest;
  if (question.includes("睡") || question.includes("休息")) {
    const sleepOk = latest.noise < 45 && latest.co2 < 1000 && latest.temperature < 29;
    return reply(
      sleepOk
        ? `当前较适合休息。噪声 ${formatValue(latest.noise, "dB")}，湿度 ${formatValue(latest.humidity, "%")}，温度 ${formatValue(latest.temperature, "°C")}。`
        : `当前休息条件需要关注。噪声 ${formatValue(latest.noise, "dB")}，CO₂ ${formatValue(latest.co2, "ppm")}，温度 ${formatValue(latest.temperature, "°C")}。`,
      [
        metricCard("噪声", formatValue(latest.noise, "dB"), latest.noise >= 55 ? "amber" : "teal"),
        metricCard("湿度", formatValue(latest.humidity, "%"), latest.humidity >= 70 ? "amber" : "teal"),
        metricCard("CO₂", formatValue(latest.co2, "ppm"), latest.co2 >= 1000 ? "amber" : "teal"),
      ],
    );
  }

  if (question.includes("开窗") || question.includes("多久") || question.includes("通风")) {
    const minutes = latest.co2 >= 1200 || latest.air_quality >= 92 ? 15 : latest.co2 >= 1000 ? 10 : 5;
    return reply(
      `建议先开窗 ${minutes} 分钟。当前 CO₂ 为 ${formatValue(latest.co2, "ppm")}，空气质量 ${latest.air_quality}，TVOC ${formatValue(latest.tvoc, "mg/m³")}。${minutes >= 10 ? "通风后建议再次观察 CO₂ 和 TVOC 是否回落。" : "当前空气指标压力不高，短时通风即可。"}`,
      [
        metricCard("推荐动作", `开窗 ${minutes} 分钟`, "blue"),
        metricCard("CO₂", formatValue(latest.co2, "ppm"), latest.co2 >= 1000 ? "amber" : "teal"),
        metricCard("TVOC", formatValue(latest.tvoc, "mg/m³"), latest.tvoc >= 0.6 ? "amber" : "teal"),
      ],
    );
  }

  if (question.includes("最近") || question.includes("变化") || question.includes("一小时")) {
    const trends = buildTrendCards(context.history, latest);
    return reply(
      `最近一小时基于 ${context.history.length} 条真实历史记录分析。${trendSentence(context.history, latest)}`,
      trends,
    );
  }

  if (question.includes("区域") || question.includes("处理")) {
    const target = mostConcernedArea(latest);
    return reply(
      `当前最需要关注的是${target.area}。原因是${target.reason}。建议动作：${target.action}`,
      [
        metricCard("关注区域", target.area, target.tone),
        metricCard("CO₂", formatValue(latest.co2, "ppm"), latest.co2 >= 1000 ? "amber" : "teal"),
        metricCard("噪声", formatValue(latest.noise, "dB"), latest.noise >= 55 ? "amber" : "teal"),
      ],
    );
  }

  if (includesCo2 || question.includes("二氧化碳")) {
    return reply(
      latest.co2 >= 1000
        ? `CO₂ 当前为 ${formatValue(latest.co2, "ppm")}，偏高通常与室内活动和通风不足有关。建议优先开窗形成短时对流。`
        : `CO₂ 当前为 ${formatValue(latest.co2, "ppm")}，处于可接受范围。当前不需要因为 CO₂ 单独采取强干预。`,
      [
        metricCard("当前值", formatValue(latest.co2, "ppm"), latest.co2 >= 1000 ? "amber" : "teal"),
        metricCard("人体活动", latest.motion ? "有人活动" : "无人活动", latest.motion ? "blue" : "slate"),
        metricCard("置信度", `${context.confidence}%`, "blue"),
      ],
    );
  }

  return reply(context.summary, [
    metricCard("综合判断", context.dataStatusLabel, "blue"),
    metricCard("当前建议", context.recommendation, "teal"),
    metricCard("置信度", `${context.confidence}%`, "blue"),
  ]);
}

function buildMetrics(latest: TelemetryReading): AssistantMetric[] {
  return [
    {
      key: "temperature",
      label: "温度传感器",
      value: formatValue(latest.temperature, "°C"),
      ...metricStatus(latest.temperature, 28, 32, "above"),
    },
    {
      key: "humidity",
      label: "湿度传感器",
      value: formatValue(latest.humidity, "%"),
      ...metricStatus(latest.humidity, 70, 82, "above"),
    },
    {
      key: "co2",
      label: "CO₂ 传感器",
      value: formatValue(latest.co2, "ppm"),
      ...metricStatus(latest.co2, 1000, 1200, "above"),
    },
    {
      key: "noise",
      label: "噪声传感器",
      value: formatValue(latest.noise, "dB"),
      ...metricStatus(latest.noise, 55, 70, "above"),
    },
  ];
}

function buildEmptyMetrics(): AssistantMetric[] {
  return [
    { key: "temperature", label: "温度传感器", value: "--", status: "offline", statusText: "等待" },
    { key: "humidity", label: "湿度传感器", value: "--", status: "offline", statusText: "等待" },
    { key: "co2", label: "CO₂ 传感器", value: "--", status: "offline", statusText: "等待" },
    { key: "noise", label: "噪声传感器", value: "--", status: "offline", statusText: "等待" },
  ];
}

function metricStatus(value: number, warning: number, danger: number, direction: "above" | "below") {
  const status =
    direction === "above"
      ? value >= danger
        ? "danger"
        : value >= warning
          ? "warning"
          : "normal"
      : value <= danger
        ? "danger"
        : value <= warning
          ? "warning"
          : "normal";
  return {
    status: status as SensorStatus,
    statusText: status === "danger" ? "告警" : status === "warning" ? "关注" : "稳定",
  };
}

function calculateConfidence(
  latest: TelemetryReading,
  sourceStatus: TelemetrySourceResponse | null,
  stale: boolean,
) {
  const required = [
    latest.temperature,
    latest.humidity,
    latest.co2,
    latest.noise,
    latest.light,
    latest.air_quality,
    latest.tvoc,
  ];
  const completeFields = required.filter((value) => Number.isFinite(Number(value))).length;
  let confidence = 92 + Math.round((completeFields / required.length) * 6);
  if (stale) confidence -= 12;
  if (!sourceStatus || sourceStatus.fallback) confidence -= 16;
  return Math.max(45, Math.min(98, confidence));
}

function buildSummary(latest: TelemetryReading, concerns: AssistantMetric[]) {
  const base = `当前房间 ${latest.room_id}：温度 ${formatValue(latest.temperature, "°C")}，湿度 ${formatValue(latest.humidity, "%")}，CO₂ ${formatValue(latest.co2, "ppm")}，噪声 ${formatValue(latest.noise, "dB")}。`;
  if (!concerns.length) {
    return `${base} 各项关键指标整体稳定。`;
  }
  return `${base} 需要关注 ${concerns.map((metric) => metric.label.replace("传感器", "")).join("、")}。`;
}

function buildRecommendation(latest: TelemetryReading, concerns: AssistantMetric[]) {
  if (latest.co2 >= 1000 || latest.air_quality >= 85 || latest.tvoc >= 0.6) {
    return "建议优先短时开窗通风，并观察 CO₂、空气质量和 TVOC 后续变化。";
  }
  if (latest.noise >= 55) {
    return "建议先确认噪声来源，避免持续干扰休息或学习。";
  }
  if (latest.light < 120) {
    return "光照偏低，如需学习建议补充照明。";
  }
  if (!concerns.length) {
    return "当前环境较稳定，保持传感器在线和常规通风即可。";
  }
  return "建议关注异常指标的连续变化，再决定是否干预。";
}

function buildBasis(
  latest: TelemetryReading,
  history: ApiHistoryPoint[],
  concerns: AssistantMetric[],
  confidence: number,
) {
  return [
    `latest telemetry 来自 ${latest.device_id}，房间 ${latest.room_id}。`,
    `关键读数：温度 ${formatValue(latest.temperature, "°C")}，湿度 ${formatValue(latest.humidity, "%")}，CO₂ ${formatValue(latest.co2, "ppm")}，噪声 ${formatValue(latest.noise, "dB")}。`,
    `空气质量 ${latest.air_quality}，TVOC ${formatValue(latest.tvoc, "mg/m³")}，人体活动：${latest.motion ? "有人" : "无人"}，信号强度 ${latest.signal_strength} dBm。`,
    `最近历史记录 ${history.length} 条，当前规则置信度 ${confidence}%。`,
    concerns.length
      ? `关注项：${concerns.map((metric) => `${metric.label} ${metric.value}`).join("，")}。`
      : "没有检测到需要立即处理的关键异常。",
  ];
}

function buildApiBasis(apiContext: AssistantContextResponse, confidence: number) {
  const latest = apiContext.latest;
  const stats = apiContext.recent_summary.stats;
  if (!latest) {
    return ["未读取到可用 latest telemetry。"];
  }
  return [
    `latest telemetry 来自 ${latest.device_id}，房间 ${latest.room_id}。`,
    `当前读数：温度 ${formatValue(latest.temperature, "°C")}，湿度 ${formatValue(latest.humidity, "%")}，CO₂ ${formatValue(latest.co2, "ppm")}，噪声 ${formatValue(latest.noise, "dB")}。`,
    `最近 ${apiContext.window} 统计：CO₂ 最高 ${formatOptional(stats.co2?.max, "ppm")}，噪声最高 ${formatOptional(stats.noise?.max, "dB")}，温度变化 ${formatOptional(stats.temperature?.delta, "°C")}。`,
    `近期事件 ${apiContext.recent_events.length} 条，样本 ${apiContext.recent_summary.sample_count} 条，当前置信度 ${confidence}%。`,
    `空气质量 ${latest.air_quality}，TVOC ${formatValue(latest.tvoc, "mg/m³")}，人体活动：${latest.motion ? "有人" : "无人"}，信号强度 ${latest.signal_strength} dBm。`,
  ];
}

function buildRecentEvents(history: ApiHistoryPoint[]): AssistantRecentEvent[] {
  return history
    .slice(-2)
    .reverse()
    .map((point) => ({
      id: point.timestamp,
      time: formatTime(point.timestamp),
      title: `CO₂ ${formatValue(point.co2, "ppm")} · 噪声 ${formatValue(point.noise, "dB")}`,
      description: `温度 ${formatValue(point.temperature, "°C")}，湿度 ${formatValue(point.humidity, "%")}，光照 ${formatValue(point.light, "lux")}。`,
    }));
}

function buildTrendCards(history: ApiHistoryPoint[], latest: TelemetryReading): AssistantCard[] {
  if (history.length < 2) {
    return [
      metricCard("CO₂", formatValue(latest.co2, "ppm"), latest.co2 >= 1000 ? "amber" : "teal"),
      metricCard("噪声", formatValue(latest.noise, "dB"), latest.noise >= 55 ? "amber" : "teal"),
      metricCard("记录数量", `${history.length} 条`, "slate"),
    ];
  }

  const first = history[0];
  return [
    metricCard("CO₂ 趋势", signedDelta(latest.co2 - first.co2, "ppm"), Math.abs(latest.co2 - first.co2) > 150 ? "amber" : "teal"),
    metricCard("噪声趋势", signedDelta(latest.noise - first.noise, "dB"), Math.abs(latest.noise - first.noise) > 8 ? "amber" : "teal"),
    metricCard("记录数量", `${history.length} 条`, "blue"),
  ];
}

function trendSentence(history: ApiHistoryPoint[], latest: TelemetryReading) {
  if (history.length < 2) {
    return `当前 CO₂ ${formatValue(latest.co2, "ppm")}，噪声 ${formatValue(latest.noise, "dB")}，历史点较少，暂不判断明显趋势。`;
  }
  const first = history[0];
  return `CO₂ 从 ${formatValue(first.co2, "ppm")} 变化到 ${formatValue(latest.co2, "ppm")}，噪声从 ${formatValue(first.noise, "dB")} 变化到 ${formatValue(latest.noise, "dB")}。`;
}

function mostConcernedArea(latest: TelemetryReading) {
  if (latest.co2 >= 1000 || latest.air_quality >= 85 || latest.tvoc >= 0.6) {
    return {
      area: "门口/窗户通风区域",
      reason: `空气相关指标需要关注，CO₂ ${formatValue(latest.co2, "ppm")}，空气质量 ${latest.air_quality}`,
      action: "优先开窗形成短时对流。",
      tone: "amber" as const,
    };
  }
  if (latest.noise >= 55) {
    return {
      area: "门口/噪声来源区域",
      reason: `噪声达到 ${formatValue(latest.noise, "dB")}`,
      action: "先确认噪声来源，再决定是否处理。",
      tone: "amber" as const,
    };
  }
  return {
    area: "宿舍全局",
    reason: "关键指标整体稳定",
    action: "保持当前通风和巡检节奏。",
    tone: "teal" as const,
  };
}

function reply(content: string, cards: AssistantCard[]) {
  return {
    id: `assistant-${Date.now()}`,
    role: "assistant" as const,
    content,
    cards,
  };
}

function metricCard(label: string, value: string, tone: AssistantCard["tone"]): AssistantCard {
  return { label, value, tone };
}

function signedDelta(value: number, unit: string) {
  const rounded = Number(value.toFixed(Math.abs(value) < 10 ? 1 : 0));
  return `${rounded > 0 ? "+" : ""}${rounded} ${unit}`;
}

function formatValue(value: number, unit: string) {
  const precision = Math.abs(value) < 10 && !Number.isInteger(value) ? 2 : 1;
  const formatted = Number(value.toFixed(precision));
  if (unit === "°C" || unit === "%") {
    return `${formatted}${unit}`;
  }
  return `${formatted} ${unit}`;
}

function formatOptional(value: number | null | undefined, unit: string) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "--";
  }
  return formatValue(Number(value), unit);
}

function formatTime(timestamp: string) {
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

function isStale(timestamp: string) {
  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) {
    return true;
  }
  return Date.now() - time > 5 * 60 * 1000;
}
