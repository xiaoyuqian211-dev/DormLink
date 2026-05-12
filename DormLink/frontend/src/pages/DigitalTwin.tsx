import {
  Activity,
  AlertTriangle,
  BedDouble,
  CheckCircle2,
  CircleGauge,
  DoorOpen,
  Droplets,
  Fan,
  LampDesk,
  MoveUpRight,
  Radio,
  Sparkles,
  Thermometer,
  UserRoundCheck,
  Waves,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import type { TwinState, TwinZone } from "../types";

type RiskLevel = TwinZone["risk_level"];
type ZoneId = "window" | "desk" | "bed" | "door";

type ZoneVisual = {
  icon: LucideIcon;
  label: string;
  callout: string;
  padClass: string;
  node: { x: number; y: number };
  anchor: { x: number; y: number };
};

const riskLabel: Record<RiskLevel, string> = {
  low: "正常",
  medium: "注意",
  high: "风险",
};

const riskTone: Record<RiskLevel, string> = {
  low: "border-emerald-300/50 bg-emerald-400/10 text-emerald-100 shadow-[0_0_26px_rgba(16,185,129,0.18)]",
  medium:
    "border-amber-300/50 bg-amber-400/10 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.22)]",
  high: "border-rose-300/60 bg-rose-400/10 text-rose-100 shadow-[0_0_34px_rgba(244,63,94,0.26)]",
};

const lightRiskTone: Record<RiskLevel, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  medium: "border-amber-200 bg-amber-50 text-amber-700",
  high: "border-rose-200 bg-rose-50 text-rose-700",
};

const stateLabel: Record<string, string> = {
  normal: "运行正常",
  needs_ventilation: "建议通风",
  low_light: "光照不足",
  slightly_hot: "局部偏热",
  activity_detected: "检测到活动",
};

const zoneVisuals: Record<ZoneId, ZoneVisual> = {
  window: {
    icon: Wind,
    label: "窗户区域",
    callout: "left-5 top-28 sm:left-8 sm:top-28",
    padClass: "twin-pad-window",
    node: { x: 21, y: 30 },
    anchor: { x: 41, y: 42 },
  },
  desk: {
    icon: LampDesk,
    label: "学习区",
    callout: "right-5 top-28 sm:right-8 sm:top-28",
    padClass: "twin-pad-desk",
    node: { x: 79, y: 31 },
    anchor: { x: 60, y: 43 },
  },
  bed: {
    icon: BedDouble,
    label: "床铺区",
    callout: "left-5 bottom-10 sm:left-8 sm:bottom-12",
    padClass: "twin-pad-bed",
    node: { x: 22, y: 78 },
    anchor: { x: 44, y: 62 },
  },
  door: {
    icon: DoorOpen,
    label: "门口区域",
    callout: "right-5 bottom-10 sm:right-8 sm:bottom-12",
    padClass: "twin-pad-door",
    node: { x: 78, y: 77 },
    anchor: { x: 62, y: 64 },
  },
};

function zoneMeta(zone: TwinZone): ZoneVisual {
  return (
    zoneVisuals[zone.zone_id as ZoneId] ?? {
      icon: MoveUpRight,
      label: zone.name,
      callout: "left-8 top-8",
      padClass: "twin-pad-window",
      node: { x: 50, y: 50 },
      anchor: { x: 50, y: 50 },
    }
  );
}

function highestRiskOf(zones: TwinZone[]): RiskLevel {
  if (zones.some((zone) => zone.risk_level === "high")) return "high";
  if (zones.some((zone) => zone.risk_level === "medium")) return "medium";
  return "low";
}

function buildHudMetrics(twin: TwinState) {
  const risk = highestRiskOf(twin.zones);

  // The twin API currently returns semantic room state rather than raw telemetry.
  // These HUD values are front-end placeholders and can be replaced with
  // /api/v1/telemetry/current after real-time telemetry is wired into this page.
  return [
    {
      label: "温度",
      value: twin.comfort_score < 70 ? "28.4" : "26.8",
      unit: "°C",
      icon: Thermometer,
    },
    {
      label: "湿度",
      value: risk === "low" ? "62" : "72",
      unit: "%",
      icon: Droplets,
    },
    {
      label: "空气质量",
      value: risk === "high" ? "92" : risk === "medium" ? "86" : "64",
      unit: "AQI",
      icon: Waves,
    },
    {
      label: "CO2",
      value: risk === "high" ? "1240" : risk === "medium" ? "980" : "760",
      unit: "ppm",
      icon: Radio,
    },
    {
      label: "活动状态",
      value: twin.room_status === "occupied" ? "有人" : "无人",
      unit: "",
      icon: UserRoundCheck,
    },
  ];
}

function TwinHudMetric({
  label,
  value,
  unit,
  icon: Icon,
}: {
  label: string;
  value: string;
  unit: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex min-w-[132px] items-center gap-3 rounded-full border border-cyan-300/20 bg-white/10 px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-md">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-300/10 text-cyan-100">
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-cyan-100/70">
          {label}
        </p>
        <p className="mt-0.5 text-base font-semibold text-white">
          {value}
          {unit ? (
            <span className="ml-1 text-xs font-medium text-cyan-100/70">
              {unit}
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

function ZoneCallout({ zone }: { zone: TwinZone }) {
  const visual = zoneMeta(zone);
  const Icon = visual.icon;
  const statusText = stateLabel[zone.state] ?? zone.state;

  return (
    <article
      className={`twin-callout absolute ${visual.callout} ${riskTone[zone.risk_level]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-cyan-100">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{zone.name}</h3>
            <p className="mt-1 text-xs text-cyan-50/70">{statusText}</p>
          </div>
        </div>
        <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold">
          {riskLabel[zone.risk_level]}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] text-cyan-50/70">
        <span>区域风险</span>
        <span className="font-semibold text-cyan-50">
          {zone.risk_level.toUpperCase()}
        </span>
      </div>
    </article>
  );
}

function TwinRoom({ zones }: { zones: TwinZone[] }) {
  return (
    <div className="twin-room-stage" aria-label="DormLink digital twin room">
      <div className="twin-room-shell">
        <div className="twin-wall twin-wall-back" />
        <div className="twin-wall twin-wall-left" />
        <div className="twin-floor">
          <div className="twin-grid-lines" />
          <div className="twin-bed-model" />
          <div className="twin-desk-model" />
          <div className="twin-window-model" />
          <div className="twin-door-model" />
          {zones.map((zone) => {
            const visual = zoneMeta(zone);
            return (
              <div
                key={zone.zone_id}
                className={`twin-zone-pad ${visual.padClass} twin-zone-${zone.risk_level}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TwinConnectorLayer({ zones }: { zones: TwinZone[] }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-20 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {zones.map((zone) => {
        const visual = zoneMeta(zone);
        return (
          <g key={zone.zone_id}>
            <line
              x1={visual.node.x}
              y1={visual.node.y}
              x2={visual.anchor.x}
              y2={visual.anchor.y}
              stroke="rgba(125, 211, 252, 0.62)"
              strokeWidth="0.18"
              strokeDasharray="1.2 1"
            />
            <circle
              cx={visual.anchor.x}
              cy={visual.anchor.y}
              r="0.75"
              fill="rgba(34, 211, 238, 0.9)"
            />
            <circle
              cx={visual.node.x}
              cy={visual.node.y}
              r="0.55"
              fill="rgba(255, 255, 255, 0.82)"
            />
          </g>
        );
      })}
    </svg>
  );
}

function ComfortGauge({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  return (
    <div className="relative mx-auto h-40 w-40">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="13"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="url(#comfortGradient)"
          strokeLinecap="round"
          strokeWidth="13"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="comfortGradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="55%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-semibold text-slate-950">{score}</span>
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          comfort
        </span>
      </div>
    </div>
  );
}

function LoadingTwin() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
      <div className="animate-pulse space-y-5">
        <div className="h-4 w-28 rounded bg-slate-200" />
        <div className="h-8 w-80 max-w-full rounded bg-slate-200" />
        <div className="h-[520px] rounded-lg bg-slate-200/80" />
      </div>
    </section>
  );
}

export default function DigitalTwin() {
  const [twin, setTwin] = useState<TwinState | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await api.getTwinState();
        if (!mounted) return;
        setTwin(data);
        setError("");
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "无法加载数字孪生状态");
      }
    }

    load();
    const timer = window.setInterval(load, 8000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const highestRisk = useMemo<RiskLevel>(
    () => (twin ? highestRiskOf(twin.zones) : "low"),
    [twin],
  );

  const hudMetrics = useMemo(() => (twin ? buildHudMetrics(twin) : []), [twin]);

  if (!twin) {
    return <LoadingTwin />;
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-lg border border-cyan-100 bg-gradient-to-br from-white via-sky-50 to-cyan-50 p-6 shadow-panel">
        <div className="absolute right-8 top-6 h-24 w-24 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-20 w-48 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="border-l-4 border-cyan-500 pl-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
              Digital Twin
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">
              数据驱动的虚拟宿舍状态
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              将后端 twin/state 的环境判断映射到宿舍空间，形成可解释、可反馈、可演示的数字孪生驾驶舱。
            </p>
          </div>
          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${lightRiskTone[highestRisk]}`}
          >
            <AlertTriangle size={16} />
            全局风险：{riskLabel[highestRisk]}
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <div className="relative min-h-[720px] overflow-hidden rounded-lg border border-slate-900/10 bg-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.24)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(34,211,238,0.22),transparent_34%),linear-gradient(135deg,#07111f_0%,#0b2541_48%,#06232f_100%)]" />
          <div className="absolute inset-x-0 top-0 h-px bg-cyan-200/40" />
          <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl" />

          <div className="relative z-30 flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/70">
                  Dorm-A101 Live Twin
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white">
                  宿舍空间状态映射
                </h3>
              </div>
              <span className="w-fit rounded-full border border-cyan-200/20 bg-cyan-100/10 px-3 py-1 text-xs font-medium text-cyan-50">
                8 秒轮询 · Mock telemetry HUD
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
              {hudMetrics.map((metric) => (
                <TwinHudMetric key={metric.label} {...metric} />
              ))}
            </div>
          </div>

          <TwinConnectorLayer zones={twin.zones} />
          <TwinRoom zones={twin.zones} />

          <div className="relative z-30 h-[520px] sm:h-[560px]">
            {twin.zones.map((zone) => (
              <ZoneCallout key={zone.zone_id} zone={zone} />
            ))}
          </div>
        </div>

        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white/90 p-5 shadow-panel backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  当前宿舍状态
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {twin.room_status === "occupied" ? "有人活动" : "暂未检测到活动"}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                <Activity size={25} />
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white/90 p-5 shadow-panel backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">舒适度分数</p>
              <CircleGauge size={19} className="text-cyan-700" />
            </div>
            <ComfortGauge score={twin.comfort_score} />
            <p className="mt-2 text-center text-sm text-slate-500">
              综合温湿度、空气和空间状态的原型评分
            </p>
          </section>

          <section className="relative overflow-hidden rounded-lg border border-slate-200 bg-white/90 p-5 shadow-panel backdrop-blur">
            <div className="absolute bottom-0 right-0 opacity-20">
              <svg width="180" height="88" viewBox="0 0 180 88" fill="none">
                <path
                  d="M4 64C31 28 49 69 76 39C105 7 119 50 148 26C160 16 169 14 176 18"
                  stroke="#0891b2"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="relative">
              <p className="text-sm font-medium text-slate-500">
                未来趋势提示
              </p>
              <p className="mt-3 text-base leading-7 text-slate-800">
                {twin.future_hint}
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white/90 p-5 shadow-panel backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">建议操作</p>
              <Sparkles size={18} className="text-emerald-600" />
            </div>
            <div className="flex flex-wrap gap-2">
              {twin.recommended_actions.map((action) => (
                <span
                  key={action}
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-800 transition hover:border-cyan-200 hover:bg-cyan-100"
                >
                  <CheckCircle2 size={15} />
                  {action}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-slate-950 p-5 text-white shadow-panel">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400/15 text-cyan-100">
                <Fan size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold">闭环演示链路</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  Mock 传感器 → 状态判断 → 孪生映射 → 建议 → 用户反馈
                </p>
              </div>
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
