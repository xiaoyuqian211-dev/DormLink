import {
  CheckCircle2,
  CircleAlert,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import { aiInsight, dormRoom } from "../../data/mockDormData";
import { twinStatusUi } from "./designTokens";
import {
  getSelectedArea,
  getSelectedSensor,
  roomSnapshot,
  sensorMockData,
  sensorStatusLabel,
  sensors,
} from "./sensorMockData";
import type { SelectableId, SensorReading, SensorStatus } from "./types";

type TwinInfoPanelProps = {
  selectedId: SelectableId;
};

type PanelData = {
  title: string;
  subtitle: string;
  status: SensorStatus;
  statusText: string;
  summary: string;
  suggestion: string;
  metrics: SensorReading[];
  evidence: string[];
};

function MetricRow({ sensor }: { sensor: SensorReading }) {
  const tone = twinStatusUi[sensor.status];

  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] border border-slate-300/[0.18] bg-white/[0.68] px-3 py-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.035)]">
      <div className="flex min-w-0 items-center gap-2">
        <span
          className="h-2 w-2 rounded-full"
          style={{
            backgroundColor: tone.dot,
            boxShadow: `0 0 10px ${tone.dot}`,
          }}
        />
        <span className="truncate text-sm text-slate-600">{sensor.metric}</span>
      </div>
      <span className="text-sm font-semibold text-slate-950">
        {sensor.value}
        <span className="ml-1 text-xs font-medium text-slate-400">
          {sensor.unit}
        </span>
      </span>
    </div>
  );
}

function MiniTrendLine({ status }: { status: SensorStatus }) {
  const stroke = twinStatusUi[status].dot;

  return (
    <svg
      className="h-10 w-full"
      viewBox="0 0 220 54"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 37C28 34 42 28 61 31C82 34 95 42 116 34C139 25 149 16 172 21C191 25 202 20 216 12"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M4 37C28 34 42 28 61 31C82 34 95 42 116 34C139 25 149 16 172 21C191 25 202 20 216 12V54H4V37Z"
        fill={stroke}
        opacity="0.08"
      />
    </svg>
  );
}

function buildEvidence(sensor: SensorReading | null, metrics: SensorReading[]) {
  if (sensor) {
    const threshold = sensor.threshold?.label ?? "阈值策略已启用";
    const confidence = sensor.confidence
      ? `${Math.round(sensor.confidence * 100)}%`
      : `${Math.round(aiInsight.confidence * 100)}%`;

    return [
      `当前值 ${sensor.value}${sensor.unit}，${threshold}。`,
      sensor.trend,
      `影响区域：${sensor.areaName ?? "局部区域"}。`,
      `判断置信度：${confidence}。`,
    ];
  }

  return [
    ...metrics.slice(0, 2).map((metric) => `${metric.metric} ${metric.value}${metric.unit}，${metric.statusText}。`),
    `数据质量 ${dormRoom.dataQuality}%，网关在线。`,
    `判断置信度：${Math.round(aiInsight.confidence * 100)}%。`,
  ];
}

export function TwinInfoPanel({ selectedId }: TwinInfoPanelProps) {
  const [feedbackNotice, setFeedbackNotice] = useState("");
  const selectedSensor = getSelectedSensor(selectedId);
  const selectedArea = getSelectedArea(selectedId);

  const panelData = useMemo<PanelData>(() => {
    if (selectedSensor) {
      return {
        title: `${selectedSensor.metric} 状态监测`,
        subtitle: selectedSensor.name,
        status: selectedSensor.status,
        statusText: selectedSensor.statusText,
        summary: `${selectedSensor.metric} ${selectedSensor.value}${selectedSensor.unit}，${selectedSensor.trend}。`,
        suggestion: selectedSensor.suggestion,
        metrics: [selectedSensor],
        evidence: buildEvidence(selectedSensor, [selectedSensor]),
      };
    }

    const area = selectedArea;
    const related = area
      ? area.relatedSensors.map((id) => sensorMockData[id])
      : sensors;

    return {
      title: area?.name ?? "宿舍全局",
      subtitle: area ? "局部区域洞察" : "Dorm-A101",
      status: area?.status ?? "normal",
      statusText: area ? sensorStatusLabel[area.status] : "稳定",
      summary: area?.summary ?? roomSnapshot.summary,
      suggestion:
        area?.suggestion ?? "保持传感器巡检，优先关注 CO₂ 与噪声变化。",
      metrics: related,
      evidence: buildEvidence(null, related),
    };
  }, [selectedArea, selectedSensor]);

  const tone = twinStatusUi[panelData.status];
  const primaryMetric = panelData.metrics[0] ?? sensorMockData.sensor_co2;

  function recordFeedback(action: string) {
    setFeedbackNotice(`已记录：${action}`);
  }

  return (
    <aside className="twin-enter-panel rounded-[24px] border border-slate-300/[0.24] bg-[linear-gradient(160deg,rgba(255,255,255,0.88),rgba(246,249,254,0.78))] p-4 text-slate-950 shadow-[0_24px_75px_rgba(15,23,42,0.085)] backdrop-blur-xl xl:sticky xl:top-24 xl:self-start">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-blue-500">
            AI INSIGHT
          </p>
          <h3 className="mt-1.5 text-lg font-semibold tracking-normal text-slate-950">
            {panelData.title}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">{panelData.subtitle}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${tone.bg} ${tone.border} ${tone.text}`}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: tone.dot }}
          />
          {panelData.statusText}
        </span>
      </div>

      <div className="mt-4 rounded-[22px] border border-slate-300/[0.18] bg-[linear-gradient(180deg,rgba(248,250,252,0.86),rgba(255,255,255,0.66))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium text-slate-500">当前数值</p>
            <p className="mt-1.5 text-[44px] font-semibold leading-none tracking-tight text-slate-950">
              {primaryMetric.value}
              <span className="ml-2 align-baseline text-sm font-medium text-slate-400">
                {primaryMetric.unit}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-semibold ${tone.text}`}>
              {panelData.statusText}
            </p>
            <p className="mt-1 text-xs text-slate-500">{primaryMetric.trend}</p>
          </div>
        </div>
        <MiniTrendLine status={panelData.status} />
      </div>

      <div className="mt-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
          Metric Summary
        </p>
        <div className="grid gap-2">
          {panelData.metrics.map((sensor) => (
            <MetricRow key={sensor.id} sensor={sensor} />
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-blue-100/80 bg-[linear-gradient(135deg,rgba(239,246,255,0.78),rgba(255,255,255,0.58))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
        <div className="flex items-center gap-2 text-blue-700">
          <TrendingUp size={17} />
          <p className="text-sm font-semibold">状态判断</p>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {panelData.summary}
        </p>
      </div>

      <div className="mt-3 rounded-[20px] border border-indigo-100/80 bg-[linear-gradient(135deg,rgba(238,242,255,0.78),rgba(255,255,255,0.58))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
        <div className="flex items-center gap-2 text-indigo-700">
          <ShieldCheck size={17} />
          <p className="text-sm font-semibold">判断依据</p>
        </div>
        <div className="mt-3 grid gap-2">
          {panelData.evidence.map((item) => (
            <p key={item} className="rounded-2xl bg-white/56 px-3 py-2 text-xs leading-5 text-slate-600">
              {item}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-3 rounded-[20px] border border-amber-100/80 bg-[linear-gradient(135deg,rgba(255,251,235,0.82),rgba(255,255,255,0.58))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
        <div className="flex items-center gap-2 text-amber-700">
          <CircleAlert size={17} />
          <p className="text-sm font-semibold">推荐动作</p>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {panelData.suggestion}
        </p>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Sparkles size={16} className="text-blue-500" />
          人在回路反馈
        </div>
        <div className="mt-3 grid gap-2">
          <button
            type="button"
            onClick={() => recordFeedback("采纳建议")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#647CFF,#4F7CFF)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(79,124,255,0.18)] transition hover:brightness-[1.03] active:scale-[0.99]"
          >
            <CheckCircle2 size={16} />
            采纳建议
          </button>
          <button
            type="button"
            onClick={() => recordFeedback("稍后处理")}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-300/[0.26] bg-white/62 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-white/82 hover:text-blue-700 active:scale-[0.99]"
          >
            稍后处理
          </button>
          <button
            type="button"
            onClick={() => recordFeedback("标记误报")}
            className="inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            标记误报
          </button>
        </div>
        {feedbackNotice ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-teal-200/80 bg-teal-50/80 px-3 py-2 text-sm text-teal-700">
            <MessageSquareText size={16} />
            {feedbackNotice}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
