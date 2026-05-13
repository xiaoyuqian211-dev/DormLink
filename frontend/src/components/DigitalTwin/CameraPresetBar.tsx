import {
  BedDouble,
  DoorOpen,
  Grid2X2,
  LampDesk,
  RadioTower,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cameraPresets } from "./sensorMockData";
import type { CameraPresetId } from "./types";

const presetIcons: Record<CameraPresetId, LucideIcon> = {
  overview: Grid2X2,
  bed: BedDouble,
  desk: LampDesk,
  door: DoorOpen,
  window: Wind,
  sensors: RadioTower,
};

type CameraPresetBarProps = {
  activePreset: CameraPresetId | null;
  onPresetSelect: (presetId: CameraPresetId) => void;
};

export function CameraPresetBar({
  activePreset,
  onPresetSelect,
}: CameraPresetBarProps) {
  return (
    <div className="flex flex-wrap gap-1 rounded-[18px] border border-slate-300/[0.20] bg-slate-100/65 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur">
      {cameraPresets.map((preset) => {
        const Icon = presetIcons[preset.id];
        const active = activePreset === preset.id;

        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPresetSelect(preset.id)}
            className={`inline-flex items-center gap-1.5 rounded-[14px] border px-2.5 py-1.5 text-xs font-medium transition duration-200 ${
              active
                ? "border-blue-200/80 bg-white text-blue-700 shadow-[0_9px_18px_rgba(79,124,255,0.12),inset_0_1px_0_rgba(255,255,255,0.95)]"
                : "border-transparent text-slate-500 hover:bg-white/72 hover:text-slate-900"
            }`}
          >
            <Icon size={14} />
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
