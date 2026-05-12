import { AlertTriangle, BarChart3, Droplets, Thermometer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "../api/client";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import type { HistoryResponse, PredictionResponse } from "../types";

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function History() {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [historyData, predictionData] = await Promise.all([
          api.getTelemetryHistory("1h"),
          api.getPrediction("30min"),
        ]);
        if (!mounted) return;
        setHistory(historyData);
        setPrediction(predictionData);
        setError("");
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "无法加载历史数据");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const chartData = useMemo(
    () =>
      history?.data.map((item) => ({
        ...item,
        time: formatTime(item.timestamp),
      })) ?? [],
    [history],
  );

  const stats = useMemo(() => {
    const data = history?.data ?? [];
    if (!data.length) {
      return { averageTemperature: 0, maxHumidity: 0, riskCount: 0 };
    }
    const averageTemperature =
      data.reduce((sum, item) => sum + item.temperature, 0) / data.length;
    const maxHumidity = Math.max(...data.map((item) => item.humidity));
    const riskCount = data.filter(
      (item) => item.air_quality > 85 || item.co2 > 1000,
    ).length;
    return {
      averageTemperature: Number(averageTemperature.toFixed(1)),
      maxHumidity: Number(maxHumidity.toFixed(1)),
      riskCount,
    };
  }, [history]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-6 shadow-panel lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-cyan-700">
            History
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-950">
            最近 1 小时环境趋势
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            以 5 分钟粒度的 mock 时序数据展示温度、湿度、空气质量和 CO2 变化。
          </p>
        </div>
        {prediction ? (
          <StatusBadge
            tone={
              prediction.risk_level === "low"
                ? "low"
                : prediction.risk_level === "medium"
                  ? "medium"
                  : "high"
            }
          >
            未来风险：{prediction.risk_level}
          </StatusBadge>
        ) : null}
      </section>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="平均温度"
          value={stats.averageTemperature}
          unit="°C"
          icon={<Thermometer size={22} />}
          tone="rose"
          footer="最近 1 小时"
        />
        <MetricCard
          title="最高湿度"
          value={stats.maxHumidity}
          unit="%"
          icon={<Droplets size={22} />}
          tone="cyan"
          footer="湿度峰值"
        />
        <MetricCard
          title="空气质量风险次数"
          value={stats.riskCount}
          unit="次"
          icon={<AlertTriangle size={22} />}
          tone={stats.riskCount > 0 ? "amber" : "emerald"}
          footer="AQI > 85 或 CO2 > 1000"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={19} className="text-cyan-700" />
            <h3 className="text-lg font-semibold text-slate-950">
              温度与湿度
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  name="温度 °C"
                  stroke="#e11d48"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="humidity"
                  name="湿度 %"
                  stroke="#0891b2"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 size={19} className="text-emerald-700" />
            <h3 className="text-lg font-semibold text-slate-950">
              空气质量与 CO2
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="air_quality"
                  name="空气质量"
                  stroke="#d97706"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="co2"
                  name="CO2 ppm"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {prediction ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-panel">
          <p className="text-sm font-medium text-slate-500">短时预测</p>
          <p className="mt-2 text-lg font-semibold leading-8 text-slate-950">
            {prediction.risk_summary}
          </p>
        </section>
      ) : null}
    </div>
  );
}

