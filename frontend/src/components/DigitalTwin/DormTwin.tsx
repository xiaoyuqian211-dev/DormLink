import {
  Activity,
  AlertCircle,
  Building2,
  CheckCircle2,
  RadioTower,
  Wifi,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRealtimeTelemetry } from "../../hooks/useRealtimeTelemetry";
import { CameraPresetBar } from "./CameraPresetBar";
import { DormScene } from "./DormScene";
import { TwinInfoPanel } from "./TwinInfoPanel";
import { twinStatusUi, twinUi } from "./designTokens";
import {
  buildRoomSnapshot,
  buildTwinAreas,
  buildTwinSensors,
  sensorStatusLabel,
} from "./sensorTwinData";
import type { CameraPresetId, FocusRequest, SelectableId } from "./types";

type SummaryTone = "blue" | "green" | "amber";

const summaryToneClass: Record<SummaryTone, string> = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  green: "bg-teal-50 text-teal-700 ring-teal-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
};

function SummaryTile({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone: SummaryTone;
  icon: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-[18px] border border-slate-300/[0.22] bg-white/[0.74] px-3 py-2.5 shadow-[0_10px_28px_rgba(15,23,42,0.045),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-1 ${summaryToneClass[tone]}`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <span className="block text-[10px] font-medium leading-3 text-slate-500">
            {label}
          </span>
          <p className="mt-0.5 truncate text-xs font-semibold text-slate-950">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export function DormTwin() {
  const [selectedId, setSelectedId] = useState<SelectableId>("bed");
  const [activePreset, setActivePreset] = useState<CameraPresetId | null>("overview");
  const [focusRequest, setFocusRequest] = useState<FocusRequest>({
    key: "overview",
    sequence: 0,
  });
  const { sourceStatus, latestTelemetry, hasRealData } = useRealtimeTelemetry({
    debugLabel: "DigitalTwin",
  });
  const { sensorsById, sceneSensors } = useMemo(
    () => buildTwinSensors(latestTelemetry, hasRealData),
    [hasRealData, latestTelemetry],
  );
  const twinAreas = useMemo(() => buildTwinAreas(sensorsById), [sensorsById]);
  const roomSnapshot = useMemo(
    () => buildRoomSnapshot(latestTelemetry, sourceStatus, hasRealData),
    [hasRealData, latestTelemetry, sourceStatus],
  );

  const focusCount = useMemo(
    () => Object.values(sensorsById).filter((sensor) => sensor.status !== "normal").length,
    [sensorsById],
  );

  function requestFocus(key: FocusRequest["key"]) {
    setFocusRequest((previous) => ({
      key,
      sequence: previous.sequence + 1,
    }));
  }

  function handleSelect(id: SelectableId) {
    setSelectedId(id);
    setActivePreset(null);
    requestFocus(id);
  }

  function handleManualControl() {
    setActivePreset(null);
  }

  function handlePresetSelect(presetId: CameraPresetId) {
    setActivePreset(presetId);
    if (presetId !== "overview" && presetId !== "sensors") {
      setSelectedId(presetId);
    }
    requestFocus(presetId);
  }

  return (
    <div className={twinUi.page}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_8%,rgba(93,151,255,0.18),transparent_30%),radial-gradient(circle_at_74%_48%,rgba(20,184,166,0.11),transparent_26%),radial-gradient(circle_at_100%_18%,rgba(148,163,184,0.18),transparent_25%),linear-gradient(90deg,rgba(255,255,255,0.48),rgba(226,235,247,0.32))]" />

      <div className="relative space-y-4">
        <section className={`${twinUi.hero} relative overflow-hidden px-4 py-3 twin-enter-soft sm:px-5`}>
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-white/90" />
          <div className="pointer-events-none absolute -right-12 -top-16 h-32 w-56 rounded-full bg-blue-200/20 blur-3xl" />
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(410px,0.62fr)] lg:items-center">
            <div className="min-w-0">
              <p className={twinUi.eyebrow}>DormLink Digital Twin</p>
              <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2.5">
                <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-slate-950 sm:text-2xl">
                  {roomSnapshot.roomId} 空间孪生
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50/75 px-2.5 py-1 text-[11px] font-medium text-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <CheckCircle2 size={13} />
                  运行中
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
                宿舍空间映射 · 传感器联动 · 智能洞察
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <SummaryTile
                label="房间"
                value={roomSnapshot.roomId}
                tone="blue"
                icon={<Building2 size={12} />}
              />
              <SummaryTile
                label="数据状态"
                value={roomSnapshot.mode}
                tone="green"
                icon={<Wifi size={12} />}
              />
              <SummaryTile
                label="风险等级"
                value={`${focusCount} 个关注项`}
                tone={focusCount > 0 ? "amber" : "green"}
                icon={<AlertCircle size={12} />}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(340px,0.62fr)]">
          <div className={`${twinUi.modelCard} p-3 twin-enter-scene sm:p-4`}>
            <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-blue-100">
                  <Activity size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-[-0.01em] text-slate-950">
                    空间视图
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    CO₂ 轻度偏高，已生成通风建议
                  </p>
                </div>
              </div>
              <CameraPresetBar
                activePreset={activePreset}
                onPresetSelect={handlePresetSelect}
              />
            </div>

            <DormScene
              selectedId={selectedId}
              focusRequest={focusRequest}
              sensors={sceneSensors}
              twinAreas={twinAreas}
              sensorsById={sensorsById}
              onSelect={handleSelect}
              onManualControl={handleManualControl}
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex flex-wrap gap-2">
                {(["normal", "warning", "danger"] as const).map((status) => {
                  const tone = twinStatusUi[status];
                  return (
                    <span
                      key={status}
                      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${tone.chip}`}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: tone.dot,
                          boxShadow: `0 0 12px ${tone.dot}`,
                        }}
                      />
                      {sensorStatusLabel[status]}
                    </span>
                  );
                })}
              </div>
              <div className="inline-flex items-center gap-2 text-slate-500">
                <RadioTower size={15} className="text-blue-500" />
                模型与传感器点位已同步
              </div>
            </div>
          </div>

          <TwinInfoPanel
            selectedId={selectedId}
            sensorsById={sensorsById}
            twinAreas={twinAreas}
            roomSnapshot={roomSnapshot}
          />
        </section>
      </div>
    </div>
  );
}
