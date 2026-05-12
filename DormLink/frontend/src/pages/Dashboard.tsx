import {
  CloudSun,
  Droplets,
  Gauge,
  Radio,
  SunMedium,
  Thermometer,
  UserRoundCheck,
  Wind,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import type { EnvironmentState, TelemetryReading } from "../types";

const comfortLabels: Record<EnvironmentState["comfort_level"], string> = {
  comfortable: "舒适",
  acceptable: "可接受",
  slightly_uncomfortable: "略不舒适",
  uncomfortable: "不舒适",
};

const airLabels: Record<EnvironmentState["air_state"], string> = {
  good: "良好",
  moderate: "中等",
  poor: "风险",
};

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<TelemetryReading | null>(null);
  const [state, setState] = useState<EnvironmentState | null>(null);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [current, environment] = await Promise.all([
          api.getCurrentTelemetry(),
          api.getEnvironmentState(),
        ]);
        if (!mounted) return;
        setTelemetry(current);
        setState(environment);
        setUpdatedAt(new Date().toLocaleTimeString("zh-CN"));
        setError("");
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "无法连接后端服务");
      }
    }

    load();
    const timer = window.setInterval(load, 5000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const comfortTone = useMemo(() => {
    if (!state) return "neutral";
    if (state.comfort_score >= 80) return "low";
    if (state.comfort_score >= 60) return "medium";
    return "high";
  }, [state]);

  if (!telemetry || !state) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
        <p className="text-sm font-medium text-slate-600">
          {error || "正在加载 DormLink 实时环境数据..."}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-cyan-700">
              DormLink Console
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-950">
              宿舍环境智能中控台
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              当前数据来自 MockSensorProvider，真实传感器接口已预留。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge tone={comfortTone}>{comfortLabels[state.comfort_level]}</StatusBadge>
            <StatusBadge tone="info">5 秒自动刷新</StatusBadge>
            <span className="text-sm text-slate-500">更新时间：{updatedAt}</span>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="当前温度"
          value={telemetry.temperature}
          unit="°C"
          icon={<Thermometer size={22} />}
          tone="rose"
          footer={state.temperature_state === "hot" ? "温度偏高，注意体感热积累" : "温度处于可控区间"}
        />
        <MetricCard
          title="湿度"
          value={telemetry.humidity}
          unit="%"
          icon={<Droplets size={22} />}
          tone="cyan"
          footer={state.humidity_state === "humid" ? "湿度偏高，可能产生闷热感" : "湿度状态正常"}
        />
        <MetricCard
          title="光照"
          value={telemetry.light}
          unit="lux"
          icon={<SunMedium size={22} />}
          tone="amber"
          footer="学习区照明用于状态映射"
        />
        <MetricCard
          title="空气质量"
          value={telemetry.air_quality}
          icon={<Wind size={22} />}
          tone={state.air_state === "good" ? "emerald" : "amber"}
          footer={`空气状态：${airLabels[state.air_state]}`}
        />
        <MetricCard
          title="CO2"
          value={telemetry.co2}
          unit="ppm"
          icon={<Gauge size={22} />}
          tone={telemetry.co2 > 1000 ? "amber" : "emerald"}
          footer={telemetry.co2 > 1000 ? "建议适当通风" : "处于正常观察范围"}
        />
        <MetricCard
          title="人体存在"
          value={telemetry.motion ? "有人" : "无人"}
          icon={<UserRoundCheck size={22} />}
          tone={telemetry.motion ? "blue" : "slate"}
          footer={`房间状态：${state.occupancy_state === "occupied" ? "占用" : "空置"}`}
        />
        <MetricCard
          title="综合舒适度"
          value={state.comfort_score}
          unit="/ 100"
          icon={<CloudSun size={22} />}
          tone={state.comfort_score >= 80 ? "emerald" : "amber"}
          footer={comfortLabels[state.comfort_level]}
        />
        <MetricCard
          title="设备信号"
          value={telemetry.signal_strength}
          unit="dBm"
          icon={<Radio size={22} />}
          tone="slate"
          footer={`设备：${telemetry.device_id}`}
        />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">系统摘要</p>
            <p className="mt-2 text-lg font-semibold leading-8 text-slate-950">
              {state.summary}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            TVOC：{telemetry.tvoc} mg/m³ · 噪声：{telemetry.noise} dB
          </div>
        </div>
      </section>
    </div>
  );
}

