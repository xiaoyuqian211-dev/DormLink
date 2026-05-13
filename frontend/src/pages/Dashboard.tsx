import {
  Activity,
  ArrowRight,
  Brain,
  Clock3,
  CloudSun,
  DoorOpen,
  Droplets,
  Gauge,
  Lightbulb,
  Radio,
  ShieldCheck,
  Thermometer,
  Volume2,
  Wifi,
} from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { ActionButton } from "../components/ui/ActionButton";
import { EmptyState } from "../components/ui/EmptyState";
import { GlassCard } from "../components/ui/GlassCard";
import { MetricCard } from "../components/ui/MetricCard";
import { OfflineBadge } from "../components/ui/OfflineBadge";
import { SectionTitle } from "../components/ui/SectionTitle";
import { StatusBadge } from "../components/ui/StatusBadge";
import { TrendLine } from "../components/ui/TrendLine";
import { statusStyles } from "../components/ui/statusStyles";
import {
  alertEvents,
  aiInsight,
  dormRoom,
  environmentScore,
  sensorMetrics,
  timelineEvents,
} from "../data/mockDormData";
import type { MetricKey, SensorMetric } from "../types/dorm";

const metricIcon: Partial<Record<MetricKey, JSX.Element>> = {
  temperature: <Thermometer size={18} />,
  humidity: <Droplets size={18} />,
  co2: <Gauge size={18} />,
  light: <Lightbulb size={18} />,
  noise: <Volume2 size={18} />,
  occupancy: <Activity size={18} />,
};

function SummaryWidget({
  label,
  value,
  icon,
  status,
}: {
  label: string;
  value: string;
  icon: JSX.Element;
  status?: SensorMetric["status"];
}) {
  const tone = status ? statusStyles[status] : statusStyles.normal;

  return (
    <div className="rounded-[18px] border border-slate-300/20 bg-white/62 px-3.5 py-3 shadow-[0_10px_28px_rgba(15,23,42,0.045),inset_0_1px_0_rgba(255,255,255,0.86)]">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-2xl border bg-white/80 shadow-[0_8px_18px_rgba(15,23,42,0.045)]"
          style={{ color: tone.dot, borderColor: `${tone.dot}22` }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] text-slate-500">{label}</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-950">{value}</p>
        </div>
      </div>
    </div>
  );
}

function navigateToDigitalTwin() {
  window.history.pushState(null, "", "/digital-twin");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export default function Dashboard() {
  const visibleMetrics = sensorMetrics.filter((metric) => metric.key !== "occupancy");
  const focusAlert = alertEvents[0];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="DormLink Overview"
        title="宿舍环境健康总览"
        description="把实时传感器、环境评分、异常判断和行动建议收拢到一个可信的 AIoT 操作台。"
        badge={<StatusBadge status="normal" label="系统在线" />}
      >
        <div className="grid w-full gap-2 sm:min-w-[360px] sm:grid-cols-2 lg:grid-cols-4">
          <SummaryWidget label="房间" value={dormRoom.id} icon={<DoorOpen size={16} />} />
          <SummaryWidget label="数据状态" value={dormRoom.mode} icon={<Wifi size={16} />} />
          <SummaryWidget
            label="关注项"
            value={`${alertEvents.length} 个关注项`}
            icon={<ShieldCheck size={16} />}
            status={alertEvents.length ? "warning" : "normal"}
          />
          <SummaryWidget label="更新" value={dormRoom.updatedAt} icon={<Clock3 size={16} />} />
        </div>
      </PageHeader>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.85fr)]">
        <GlassCard intensity="strong" className="relative overflow-hidden p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-72 rounded-full bg-blue-200/28 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-center">
            <div className="flex justify-center lg:justify-start">
              <div
                className="relative flex h-52 w-52 items-center justify-center rounded-full border border-white/80 shadow-[0_24px_70px_rgba(79,124,255,0.14),inset_0_1px_0_rgba(255,255,255,0.92)]"
                style={{
                  background: `conic-gradient(#4F7CFF ${environmentScore.score * 3.6}deg, rgba(226,232,240,0.82) 0deg)`,
                }}
              >
                <div className="flex h-[164px] w-[164px] flex-col items-center justify-center rounded-full bg-white/90 shadow-[inset_0_18px_45px_rgba(15,23,42,0.045)] backdrop-blur">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-blue-500">
                    Health
                  </p>
                  <p className="mt-2 text-5xl font-semibold tracking-[-0.05em] text-slate-950">
                    {environmentScore.score}
                  </p>
                  <p className="text-sm font-medium text-slate-500">/ 100</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status="warning" label={environmentScore.label} size="md" />
                <OfflineBadge visible={!dormRoom.online} />
                <span className="rounded-full border border-blue-100 bg-blue-50/70 px-3 py-1.5 text-xs font-medium text-blue-700">
                  Demo Mode
                </span>
              </div>
              <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-slate-950">
                当前环境整体舒适，通风效率需要关注。
              </h3>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                {environmentScore.summary} 系统已将异常定位到门口空气流动弱区，并建议优先使用窗户作为通风入口。
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ActionButton variant="primary" onClick={navigateToDigitalTwin}>
                  进入数字孪生定位
                  <ArrowRight size={16} />
                </ActionButton>
                <ActionButton>
                  <Brain size={16} />
                  查看 AI 判断依据
                </ActionButton>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard intensity="medium" className="p-5">
          <SectionTitle
            eyebrow="Current Focus"
            title="当前关注项"
            description="系统会把异常指标、影响区域和推荐动作合并成可执行摘要。"
          />
          {focusAlert ? (
            <div className="mt-5 rounded-[22px] border border-amber-100/80 bg-[linear-gradient(135deg,rgba(255,251,235,0.86),rgba(255,255,255,0.62))] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{focusAlert.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{focusAlert.area} · {focusAlert.time}</p>
                </div>
                <StatusBadge status={focusAlert.status} label="需关注" />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-600">{focusAlert.reason}</p>
              <p className="mt-3 rounded-2xl bg-white/60 px-3 py-2 text-sm leading-6 text-amber-800">
                {focusAlert.suggestion}
              </p>
            </div>
          ) : (
            <EmptyState title="暂无关注项" description="所有环境指标都在舒适范围内。" />
          )}
        </GlassCard>
      </section>

      <section className="space-y-3">
        <SectionTitle
          eyebrow="Live Metrics"
          title="实时环境指标"
          description="每个指标包含当前值、状态、近 10 分钟趋势和区域上下文。"
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} icon={metricIcon[metric.key]} />
          ))}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <GlassCard intensity="medium" className="p-5">
          <SectionTitle
            eyebrow="Device Mesh"
            title="设备与数据质量"
            description="展示传感器在线数量、网关状态和数据可信度。"
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SummaryWidget label="在线传感器" value="6 / 6" icon={<Radio size={16} />} />
            <SummaryWidget label="数据质量" value={`${dormRoom.dataQuality}%`} icon={<ShieldCheck size={16} />} />
            <SummaryWidget label="占用状态" value={dormRoom.occupancy} icon={<CloudSun size={16} />} />
          </div>
          <div className="mt-5 h-14 rounded-[18px] border border-slate-300/18 bg-white/58 p-2">
            <TrendLine
              values={sensorMetrics.find((metric) => metric.key === "co2")?.history ?? [1]}
              color="#4F7CFF"
              height={44}
            />
          </div>
        </GlassCard>

        <GlassCard intensity="medium" className="p-5">
          <SectionTitle
            eyebrow="Recent Events"
            title="最近环境变化"
            description="按时间线解释环境变化，而不是只显示孤立数字。"
          />
          <div className="mt-5 grid gap-3">
            {timelineEvents.map((event) => (
              <div key={event.id} className="flex gap-3 rounded-[18px] border border-slate-300/18 bg-white/58 p-3">
                <div className="pt-1">
                  <span
                    className="block h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: statusStyles[event.status].dot,
                      boxShadow: `0 0 12px ${statusStyles[event.status].dot}66`,
                    }}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">{event.time} · {event.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </section>

      <GlassCard intensity="light" className="p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <Brain size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-950">{aiInsight.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">{aiInsight.recommendation}</p>
            </div>
          </div>
          <StatusBadge status="warning" label={`置信度 ${Math.round(aiInsight.confidence * 100)}%`} />
        </div>
      </GlassCard>
    </div>
  );
}
