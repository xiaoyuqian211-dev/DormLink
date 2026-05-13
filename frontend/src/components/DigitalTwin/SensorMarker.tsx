import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import type { Group } from "three";
import { sensorStatusTone } from "./sensorMockData";
import type { SelectableId, SensorReading } from "./types";

type SensorMarkerProps = {
  sensor: SensorReading;
  selected: boolean;
  onSelect: (id: SelectableId) => void;
};

function formatCompactValue(sensor: SensorReading) {
  if (sensor.unit === "℃") return `${sensor.shortLabel} ${sensor.value}°`;
  if (sensor.unit === "%") return `${sensor.shortLabel} ${sensor.value}%`;
  if (sensor.unit === "ppm") return `${sensor.shortLabel} ${sensor.value}`;
  if (sensor.unit === "lux") return `${sensor.shortLabel} ${sensor.value}`;
  return `${sensor.value} ${sensor.unit}`;
}

export function SensorMarker({ sensor, selected, onSelect }: SensorMarkerProps) {
  const groupRef = useRef<Group | null>(null);
  const [hovered, setHovered] = useState(false);
  const tone = sensorStatusTone[sensor.status];

  const label = useMemo(
    () =>
      hovered || selected
        ? `${sensor.metric} ${sensor.value}${sensor.unit} · ${sensor.statusText}`
        : formatCompactValue(sensor),
    [hovered, selected, sensor],
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const pulse = 1 + Math.sin(clock.elapsedTime * 2.2) * 0.035;
    groupRef.current.scale.setScalar(selected ? pulse * 1.08 : pulse);
  });

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    onSelect(sensor.id);
  }

  return (
    <group
      ref={groupRef}
      position={sensor.position}
      onPointerDown={handlePointerDown}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      <mesh>
        <sphereGeometry args={[0.034, 24, 24]} />
        <meshStandardMaterial
          color={tone.scene}
          emissive={tone.scene}
          emissiveIntensity={selected ? 1.2 : 0.72}
          roughness={0.36}
          metalness={0.12}
        />
      </mesh>
      <mesh scale={selected || hovered ? 1.72 : 1.36}>
        <sphereGeometry args={[0.056, 24, 24]} />
        <meshBasicMaterial
          color={tone.scene}
          transparent
          opacity={selected || hovered ? 0.16 : 0.08}
        />
      </mesh>
      <pointLight
        color={tone.scene}
        intensity={selected || hovered ? 0.36 : 0.18}
        distance={1.35}
      />
      <Html
        distanceFactor={10.8}
        position={[0.13, 0.12, 0]}
        style={{ pointerEvents: "none" }}
      >
        <div className="flex -translate-y-1 items-center">
          <span
            className="h-px w-5"
            style={{
              background: `linear-gradient(90deg, ${tone.scene}, rgba(255,255,255,0))`,
              opacity: selected || hovered ? 0.86 : 0.58,
            }}
          />
          <div
            className={`whitespace-nowrap rounded-[10px] border px-1.5 py-0.5 text-[8.5px] font-semibold leading-3 shadow-[0_8px_18px_rgba(15,23,42,0.09)] backdrop-blur-md transition duration-150 ${tone.chip} ${
              selected || hovered
                ? "translate-y-[-1px] border-opacity-100"
                : "border-opacity-80"
            }`}
          >
            {label}
          </div>
        </div>
      </Html>
    </group>
  );
}
