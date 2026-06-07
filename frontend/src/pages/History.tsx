import {
  Activity,
  CalendarDays,
  Clock3,
  Gauge,
  Lightbulb,
  Sparkles,
  Thermometer,
  TrendingUp,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api/client";
import { PageHeader } from "../components/layout/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { GlassCard } from "../components/ui/GlassCard";
import { LoadingSkeleton } from "../components/ui/LoadingSkeleton";
import { SectionTitle } from "../components/ui/SectionTitle";
import { StatusBadge } from "../components/ui/StatusBadge";
import { cn, statusStyles } from "../components/ui/statusStyles";
import type { HistoryPoint as ApiHistoryPoint, TelemetrySourceResponse } from "../types";
import type {
  TelemetryChartMetricKey,
  TelemetryChartPoint,
} from "../utils/telemetryMetrics";
import {
  chartMetricValue,
  hasRealTelemetry,
  rangeToApiRange,
  toTelemetryChartPoints,
} from "../utils/telemetryMetrics";

type RangeKey = "today" | "7d" | "30d" | "custom";

const rangeLabels: Record<RangeKey, string> = {
  today: "今日",
  "7d": "近 7 天",
  "30d": "近 30 天",
  custom: "自定义",
};

const chartMetrics: Array<{
  key: TelemetryChartMetricKey;
  label: string;
  unit: string;
  color: string;
  icon: JSX.Element;
}> = [
  { key: "temperature", label: "温度", unit: "°C", color: "#4F7CFF", icon: <Thermometer size={15} /> },
  { key: "humidity", label: "湿度", unit: "%", color: "#14B8A6", icon: <TrendingUp size={15} /> },
  { key: "co2", label: "CO2", unit: "ppm", color: "#F59E0B", icon: <Gauge size={15} /> },
  { key: "light", label: "光照", unit: "lux", color: "#38BDF8", icon: <Lightbulb size={15} /> },
  { key: "noise", label: "噪声", unit: "dB", color: "#64748B", icon: <Volume2 size={15} /> },
  { key: "air_quality", label: "空气质量", unit: "", color: "#8B5CF6", icon: <Sparkles size={15} /> },
  { key: "tvoc", label: "TVOC", unit: "mg/m³", color: "#10B981", icon: <Activity size={15} /> },
];

function summarizeMetric(data: TelemetryChartPoint[], metricKey: TelemetryChartMetricKey) {
  const values = data
    .map((point) => chartMetricValue(point, metricKey))
    .filter((value) => Number.isFinite(value));

  if (!values.length) {
    return { peak: null, low: null, last: null };
  }

  return {
    peak: Math.max(...values),
    low: Math.min(...values),
    last: values[values.length - 1],
  };
}

function formatMetricValue(value: number | null, unit: string) {
  if (value === null) {
    return "--";
  }
  const precision = Math.abs(value) < 10 && !Number.isInteger(value) ? 2 : 1;
  return `${Number(value.toFixed(precision))}${unit ? ` ${unit}` : ""}`;
}

function toDatetimeLocal(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function History() {
  const [range, setRange] = useState<RangeKey>("today");
  const [customStart, setCustomStart] = useState(() =>
    toDatetimeLocal(new Date(Date.now() - 60 * 60 * 1000)),
  );
  const [customEnd, setCustomEnd] = useState(() => toDatetimeLocal(new Date()));
  const [metricKey, setMetricKey] = useState<TelemetryChartMetricKey>("temperature");
  const [sourceStatus, setSourceStatus] = useState<TelemetrySourceResponse | null>(null);
  const [readings, setReadings] = useState<ApiHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const activeMetric =
    chartMetrics.find((metric) => metric.key === metricKey) ?? chartMetrics[0];
  const chartData = useMemo(() => toTelemetryChartPoints(readings), [readings]);
  const chartSummary = useMemo(
    () => summarizeMetric(chartData, metricKey),
    [chartData, metricKey],
  );
  const dataSourceLabel = hasRealTelemetry(sourceStatus)
    ? "真实 MQTT 数据"
    : "等待真实数据";
  const recentEvents = useMemo(
    () =>
      chartData
        .slice(-4)
        .reverse()
        .map((point) => ({
          id: point.timestamp,
          time: point.time,
          title: `${activeMetric.label} ${formatMetricValue(chartMetricValue(point, metricKey), activeMetric.unit)}`,
          description: `来自 dormlink/telemetry 的真实上报：${point.timestamp}`,
          status: "normal" as const,
        })),
    [activeMetric.label, activeMetric.unit, chartData, metricKey],
  );
  const lastChartPoint = chartData[chartData.length - 1];
  const insightCards = [
    { label: "数据来源", value: dataSourceLabel, detail: sourceStatus?.topic ?? "dormlink/telemetry" },
    { label: "记录数量", value: `${chartData.length} 条`, detail: `当前范围：${rangeLabels[range]}` },
    {
      label: "最新上报",
      value: lastChartPoint?.time ?? "--",
      detail: lastChartPoint?.timestamp ?? "等待真实 MQTT 数据",
    },
    {
      label: "当前指标",
      value: activeMetric.label,
      detail: `当前值 ${formatMetricValue(chartSummary.last, activeMetric.unit)}`,
    },
  ];

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        setLoading(true);
        const [source, history] = await Promise.all([
          api.getTelemetrySource(),
          api.getTelemetryHistory(
            rangeToApiRange(range),
            range === "custom"
              ? { roomId: "Dorm-A101", start: customStart, end: customEnd }
              : { roomId: "Dorm-A101" },
          ),
        ]);
        if (!active) {
          return;
        }
        setSourceStatus(source);
        setReadings(hasRealTelemetry(source) ? history.data : []);
        setError("");
      } catch (err) {
        if (!active) {
          return;
        }
        setSourceStatus(null);
        setReadings([]);
        setError(err instanceof Error ? err.message : "历史数据请求失败");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadHistory();
    const interval = window.setInterval(loadHistory, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [customEnd, customStart, range]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Environment Review"
        title="宿舍环境复盘"
        description="趋势图直接使用后端 MQTT 历史数据，当前值、峰值和低点随真实上报更新。"
        badge={
          <StatusBadge
            status={chartData.length ? "normal" : "warning"}
            label={dataSourceLabel}
          />
        }
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200/80 bg-slate-100/62 p-1">
            {(Object.keys(rangeLabels) as RangeKey[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRange(item)}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-medium transition duration-200",
                  range === item
                    ? "border-blue-100 bg-white text-blue-700 shadow-[0_8px_18px_rgba(79,124,255,0.10)]"
                    : "border-transparent text-slate-500 hover:bg-white/70 hover:text-slate-800",
                )}
              >
                {rangeLabels[item]}
              </button>
            ))}
          </div>
          {range === "custom" ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="datetime-local"
                value={customStart}
                onChange={(event) => setCustomStart(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-200"
                aria-label="自定义开始时间"
              />
              <input
                type="datetime-local"
                value={customEnd}
                onChange={(event) => setCustomEnd(event.target.value)}
                className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-200"
                aria-label="自定义结束时间"
              />
            </div>
          ) : null}
        </div>
      </PageHeader>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.48fr)_minmax(360px,0.86fr)]">
        <GlassCard intensity="strong" className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <SectionTitle
              eyebrow="Trend Analysis"
              title="多指标趋势"
              description={`当前查看：${activeMetric.label}，范围：${rangeLabels[range]}。`}
            />
            <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200/80 bg-slate-100/62 p-1">
              {chartMetrics.map((metric) => (
                <button
                  key={metric.key}
                  type="button"
                  onClick={() => setMetricKey(metric.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition duration-200",
                    metricKey === metric.key
                      ? "border-blue-100 bg-white text-blue-700 shadow-[0_8px_18px_rgba(79,124,255,0.10)]"
                      : "border-transparent text-slate-500 hover:bg-white/70 hover:text-slate-800",
                  )}
                >
                  {metric.icon}
                  {metric.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_190px]">
            <div className="h-[360px] rounded-[24px] border border-slate-300/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.76),rgba(248,250,252,0.54))] p-4">
              {loading ? (
                <LoadingSkeleton className="h-full" />
              ) : error ? (
                <ErrorState title="历史数据获取失败" description={error} />
              ) : chartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94A3B8", fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94A3B8", fontSize: 12 }}
                      width={42}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid rgba(148,163,184,0.24)",
                        boxShadow: "0 18px 50px rgba(15,23,42,0.10)",
                      }}
                      formatter={(value) => [
                        `${value} ${activeMetric.unit}`,
                        activeMetric.label,
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey={metricKey}
                      stroke={activeMetric.color}
                      strokeWidth={2.4}
                      dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="暂无真实历史数据"
                  description="后端还没有收到 dormlink/telemetry 的真实 MQTT 上报。"
                />
              )}
            </div>

            <div className="grid gap-3">
              {[
                { label: "当前值", value: chartSummary.last },
                { label: "峰值", value: chartSummary.peak },
                { label: "低点", value: chartSummary.low },
              ].map((item) => (
                <div key={item.label} className="rounded-[20px] border border-slate-300/18 bg-white/62 p-4">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">
                    {formatMetricValue(item.value, activeMetric.unit)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard intensity="medium" className="p-5">
          <SectionTitle
            eyebrow="AI Summary"
            title="周期总结"
            description="根据当前真实历史记录生成摘要。"
          />
          <div className="mt-5 rounded-[22px] border border-blue-100/80 bg-[linear-gradient(135deg,rgba(239,246,255,0.82),rgba(255,255,255,0.62))] p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Sparkles size={17} />
              <p className="text-sm font-semibold">{activeMetric.label} 趋势</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              当前范围内共有 {chartData.length} 条真实历史记录，最新值为 {formatMetricValue(chartSummary.last, activeMetric.unit)}。
            </p>
            <p className="mt-3 rounded-2xl bg-white/60 px-3 py-2 text-sm leading-6 text-slate-600">
              峰值 {formatMetricValue(chartSummary.peak, activeMetric.unit)}，低点 {formatMetricValue(chartSummary.low, activeMetric.unit)}。
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            {insightCards.map((item) => (
              <div key={item.label} className="rounded-[18px] border border-slate-300/18 bg-white/58 p-3">
                <p className="text-xs text-slate-500">{item.label}</p>
                <p className="mt-1 text-base font-semibold text-slate-950">{item.value}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <GlassCard intensity="medium" className="p-5">
          <SectionTitle
            eyebrow="Anomaly Timeline"
            title="最近事件"
            description="展示最近几条真实 MQTT 历史记录。"
          />
          <div className="mt-5 grid gap-3">
            {recentEvents.length ? recentEvents.map((event) => (
              <div key={event.id} className="grid gap-3 rounded-[20px] border border-slate-300/18 bg-white/58 p-4 sm:grid-cols-[72px_minmax(0,1fr)]">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-500">
                  <Clock3 size={15} />
                  {event.time}
                </div>
                <div className="flex gap-3">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: statusStyles[event.status].dot,
                      boxShadow: `0 0 12px ${statusStyles[event.status].dot}66`,
                    }}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{event.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{event.description}</p>
                  </div>
                </div>
              </div>
            )) : (
              <EmptyState
                title="暂无最近事件"
                description="收到真实 MQTT 历史后这里会显示最近上报。"
              />
            )}
          </div>
        </GlassCard>

        <GlassCard intensity="medium" className="p-5">
          <SectionTitle
            eyebrow="Insight Basis"
            title="当前指标解释"
            description="指标说明随上方标签切换。"
          />
          <div className="mt-5 space-y-3">
            <div className="rounded-[20px] border border-slate-300/18 bg-white/62 p-4">
              <p className="text-xs text-slate-500">当前指标</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {activeMetric.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                当前值 {formatMetricValue(chartSummary.last, activeMetric.unit)}，峰值 {formatMetricValue(chartSummary.peak, activeMetric.unit)}，低点 {formatMetricValue(chartSummary.low, activeMetric.unit)}。
              </p>
            </div>
            <div className="rounded-[20px] border border-slate-300/18 bg-white/62 p-4">
              <div className="flex items-center gap-2 text-slate-700">
                <CalendarDays size={16} />
                <p className="text-sm font-semibold">数据范围</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                当前范围为 {rangeLabels[range]}，共 {chartData.length} 条真实历史记录。
              </p>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
