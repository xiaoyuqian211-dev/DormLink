import {
  CalendarDays,
  Clock3,
  Gauge,
  Lightbulb,
  Sparkles,
  Thermometer,
  TrendingUp,
  Volume2,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "../components/layout/PageHeader";
import { GlassCard } from "../components/ui/GlassCard";
import { SectionTitle } from "../components/ui/SectionTitle";
import { StatusBadge } from "../components/ui/StatusBadge";
import { cn, statusStyles } from "../components/ui/statusStyles";
import {
  aiInsight,
  historySeries,
  sensorMetrics,
  timelineEvents,
  weeklyInsights,
} from "../data/mockDormData";
import type { HistoryPoint, MetricKey } from "../types/dorm";

type RangeKey = "today" | "7d" | "30d" | "custom";
type ChartMetricKey = Exclude<MetricKey, "occupancy">;

const rangeLabels: Record<RangeKey, string> = {
  today: "今日",
  "7d": "近 7 天",
  "30d": "近 30 天",
  custom: "自定义",
};

const chartMetrics: Array<{ key: ChartMetricKey; label: string; unit: string; color: string; icon: JSX.Element }> = [
  { key: "temperature", label: "温度", unit: "℃", color: "#4F7CFF", icon: <Thermometer size={15} /> },
  { key: "humidity", label: "湿度", unit: "%", color: "#14B8A6", icon: <TrendingUp size={15} /> },
  { key: "co2", label: "CO₂", unit: "ppm", color: "#F59E0B", icon: <Gauge size={15} /> },
  { key: "light", label: "光照", unit: "lux", color: "#38BDF8", icon: <Lightbulb size={15} /> },
  { key: "noise", label: "噪声", unit: "dB", color: "#64748B", icon: <Volume2 size={15} /> },
];

function latestOf(key: ChartMetricKey) {
  return historySeries[historySeries.length - 1][key];
}

export default function History() {
  const [range, setRange] = useState<RangeKey>("today");
  const [metricKey, setMetricKey] = useState<ChartMetricKey>("co2");
  const activeMetric = chartMetrics.find((metric) => metric.key === metricKey) ?? chartMetrics[2];
  const metricDefinition = sensorMetrics.find((metric) => metric.key === metricKey);

  const chartSummary = useMemo(() => {
    const values = historySeries.map((point) => point[metricKey]);
    const peak = Math.max(...values);
    const low = Math.min(...values);
    const last = values[values.length - 1];
    return { peak, low, last };
  }, [metricKey]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Environment Review"
        title="宿舍环境复盘"
        description="用趋势、事件和 AI 周期总结解释环境变化原因，帮助你判断什么时候需要干预。"
        badge={<StatusBadge status="normal" label="数据连续" />}
      >
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historySeries}>
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
                    formatter={(value) => [`${value} ${activeMetric.unit}`, activeMetric.label]}
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
            </div>

            <div className="grid gap-3">
              {[
                { label: "当前值", value: chartSummary.last },
                { label: "峰值", value: chartSummary.peak },
                { label: "低点", value: chartSummary.low },
              ].map((item) => (
                <div key={item.label} className="rounded-[20px] border border-slate-300/18 bg-white/62 p-4">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                    {item.value}
                    <span className="ml-1 text-xs font-medium text-slate-400">{activeMetric.unit}</span>
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
            description="把趋势转化为可解释的环境规律。"
          />
          <div className="mt-5 rounded-[22px] border border-blue-100/80 bg-[linear-gradient(135deg,rgba(239,246,255,0.82),rgba(255,255,255,0.62))] p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <Sparkles size={17} />
              <p className="text-sm font-semibold">{aiInsight.title}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{aiInsight.summary}</p>
            <p className="mt-3 rounded-2xl bg-white/60 px-3 py-2 text-sm leading-6 text-slate-600">
              {aiInsight.recommendation}
            </p>
          </div>

          <div className="mt-4 grid gap-3">
            {weeklyInsights.map((item) => (
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
            title="异常事件时间线"
            description="展示关键变化、可能原因和处理建议。"
          />
          <div className="mt-5 grid gap-3">
            {timelineEvents.map((event) => (
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
            ))}
          </div>
        </GlassCard>

        <GlassCard intensity="medium" className="p-5">
          <SectionTitle
            eyebrow="Insight Basis"
            title="当前指标解释"
            description="让图表后的判断依据可见。"
          />
          <div className="mt-5 space-y-3">
            <div className="rounded-[20px] border border-slate-300/18 bg-white/62 p-4">
              <p className="text-xs text-slate-500">当前指标</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">
                {metricDefinition?.name ?? activeMetric.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {metricDefinition?.trend ?? "趋势稳定"}，{metricDefinition?.suggestion ?? "保持当前环境策略。"}
              </p>
            </div>
            <div className="rounded-[20px] border border-slate-300/18 bg-white/62 p-4">
              <div className="flex items-center gap-2 text-slate-700">
                <CalendarDays size={16} />
                <p className="text-sm font-semibold">复盘结论</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                CO₂ 的上升与室内活动和通风不足相关，短时开窗通常能在 10 到 15 分钟内改善空气质量。
              </p>
            </div>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
