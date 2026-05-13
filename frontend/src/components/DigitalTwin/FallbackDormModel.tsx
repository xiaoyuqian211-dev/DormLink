import { RoundedBox } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  getStatusOf,
  sensorStatusTone,
  sensors,
  twinAreas,
} from "./sensorMockData";
import { twinScenePalette } from "./designTokens";
import type { SelectableId, SensorReading, TwinAreaId, Vector3Tuple } from "./types";

type SelectableGroupProps = {
  id: SelectableId;
  selectedId: SelectableId;
  onSelect: (id: SelectableId) => void;
  children: ReactNode;
};

function SelectableGroup({
  id,
  selectedId,
  onSelect,
  children,
}: SelectableGroupProps) {
  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    onSelect(id);
  }

  return (
    <group
      userData={{ twinId: id }}
      onPointerDown={handlePointerDown}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      {children}
      {selectedId === id ? <SelectionHalo areaId={id as TwinAreaId} /> : null}
    </group>
  );
}

function SelectionHalo({ areaId }: { areaId: TwinAreaId }) {
  const area = twinAreas[areaId];
  if (!area) return null;
  const tone = sensorStatusTone[area.status];

  return (
    <mesh position={[area.position[0], 0.035, area.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.34, 0.46, 64]} />
      <meshBasicMaterial color={tone.dot} transparent opacity={0.28} depthWrite={false} />
    </mesh>
  );
}

type BoxProps = {
  position: Vector3Tuple;
  scale: Vector3Tuple;
  color: string;
  emissive?: string;
  opacity?: number;
  metalness?: number;
  roughness?: number;
  radius?: number;
};

function Box({
  position,
  scale,
  color,
  emissive = "#000000",
  opacity = 1,
  metalness = 0.18,
  roughness = 0.48,
  radius = 0.035,
}: BoxProps) {
  return (
    <RoundedBox
      castShadow
      receiveShadow
      args={scale}
      position={position}
      radius={radius}
      smoothness={8}
    >
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissive === "#000000" ? 0 : 0.12}
        metalness={metalness}
        roughness={roughness}
        transparent={opacity < 1}
        opacity={opacity}
        envMapIntensity={0.55}
      />
    </RoundedBox>
  );
}

function AreaPad({ id, position, scale }: { id: TwinAreaId; position: Vector3Tuple; scale: Vector3Tuple }) {
  const status = getStatusOf(id);
  const tone = sensorStatusTone[status];
  const materialProps = useMemo(
    () => ({
      color: tone.dot,
      transparent: true,
      opacity: status === "warning" ? 0.095 : 0.055,
      depthWrite: false,
    }),
    [status, tone.dot],
  );

  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial {...materialProps} />
    </mesh>
  );
}

function FloorGrid() {
  const positions = useMemo(() => {
    const width = 4.75;
    const depth = 3.2;
    const divisions = 12;
    const points: number[] = [];

    for (let index = 0; index <= divisions; index += 1) {
      const x = -width / 2 + (width / divisions) * index;
      points.push(x, 0, -depth / 2, x, 0, depth / 2);
    }

    for (let index = 0; index <= divisions; index += 1) {
      const z = -depth / 2 + (depth / divisions) * index;
      points.push(-width / 2, 0, z, width / 2, 0, z);
    }

    return new Float32Array(points);
  }, []);

  return (
    <lineSegments position={[0, 0.012, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#AEBED0" transparent opacity={0.22} />
    </lineSegments>
  );
}

function HeatZone({ sensor }: { sensor: SensorReading }) {
  const tone = sensorStatusTone[sensor.status];
  const [x, , z] = sensor.position;

  if (sensor.status === "normal") return null;

  return (
    <group position={[x, 0.022, z]} rotation={[-Math.PI / 2, 0, 0]}>
      {[0.38, 0.62, 0.88].map((radius, index) => (
        <mesh key={radius} position={[0, 0, index * 0.002]}>
          <circleGeometry args={[radius, 64]} />
          <meshBasicMaterial
            color={tone.heat}
            transparent
            opacity={[0.16, 0.085, 0.045][index]}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function SoftShadow({ position, scale, opacity = 0.12 }: { position: Vector3Tuple; scale: Vector3Tuple; opacity?: number }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} scale={scale}>
      <circleGeometry args={[1, 64]} />
      <meshBasicMaterial color="#64748B" transparent opacity={opacity} depthWrite={false} />
    </mesh>
  );
}

function Rug() {
  return (
    <RoundedBox
      receiveShadow
      args={[1.18, 0.018, 0.72]}
      position={[0.18, 0.028, 0.38]}
      radius={0.06}
      smoothness={10}
    >
      <meshStandardMaterial color="#CBDDF1" transparent opacity={0.62} roughness={0.86} />
    </RoundedBox>
  );
}

function Laptop() {
  return (
    <group position={[0.78, 0.76, -0.94]} rotation={[0, -0.08, 0]}>
      <Box position={[0, 0.02, 0]} scale={[0.38, 0.025, 0.26]} color="#E8EEF7" roughness={0.42} metalness={0.12} radius={0.018} />
      <Box position={[0, 0.16, -0.12]} scale={[0.38, 0.26, 0.025]} color="#2F3F52" emissive="#8EC5FF" roughness={0.35} metalness={0.06} radius={0.018} />
    </group>
  );
}

function Plant() {
  return (
    <group position={[-2.05, 0.25, -1.38]}>
      <Box position={[0, 0.08, 0]} scale={[0.18, 0.16, 0.18]} color="#D7A56A" roughness={0.62} radius={0.035} />
      <mesh castShadow position={[-0.04, 0.24, 0]}>
        <sphereGeometry args={[0.09, 18, 18]} />
        <meshStandardMaterial color="#56B49F" roughness={0.74} />
      </mesh>
      <mesh castShadow position={[0.06, 0.29, 0.03]}>
        <sphereGeometry args={[0.08, 18, 18]} />
        <meshStandardMaterial color="#76C8B7" roughness={0.74} />
      </mesh>
    </group>
  );
}

export function FallbackDormModel({
  selectedId,
  onSelect,
}: {
  selectedId: SelectableId;
  onSelect: (id: SelectableId) => void;
}) {
  return (
    <group>
      <SoftShadow position={[0.2, -0.052, 0.16]} scale={[2.85, 1.92, 1]} opacity={0.075} />
      <mesh receiveShadow position={[0, -0.045, 0]}>
        <boxGeometry args={[4.9, 0.09, 3.35]} />
        <meshStandardMaterial color={twinScenePalette.floor} roughness={0.82} metalness={0.04} />
      </mesh>

      <FloorGrid />
      <Rug />

      <Box position={[0, 1.05, -1.68]} scale={[4.9, 2.15, 0.1]} color={twinScenePalette.wall} opacity={0.98} roughness={0.7} metalness={0.02} radius={0.018} />
      <Box position={[-2.45, 1.05, 0]} scale={[0.1, 2.15, 3.35]} color={twinScenePalette.wallSide} opacity={0.94} roughness={0.75} metalness={0.02} radius={0.018} />
      <Box position={[2.45, 1.05, -0.22]} scale={[0.1, 2.15, 2.9]} color={twinScenePalette.wallSide} opacity={0.84} roughness={0.75} metalness={0.02} radius={0.018} />
      <Box position={[0, 0.12, -1.61]} scale={[4.55, 0.08, 0.06]} color="#D2DEEC" roughness={0.62} radius={0.012} />
      <Box position={[-2.38, 0.12, 0]} scale={[0.06, 0.08, 3.08]} color="#D2DEEC" roughness={0.62} radius={0.012} />

      <AreaPad id="bed" position={[-1.2, 0.014, 0.64]} scale={[1.65, 1.9, 1]} />
      <AreaPad id="desk" position={[1.12, 0.015, -0.75]} scale={[1.5, 1.2, 1]} />
      <AreaPad id="door" position={[1.72, 0.016, 1.03]} scale={[1.2, 0.95, 1]} />
      <AreaPad id="window" position={[-0.28, 0.017, -1.28]} scale={[1.9, 0.62, 1]} />
      {sensors.map((sensor) => (
        <HeatZone key={`heat-${sensor.id}`} sensor={sensor} />
      ))}

      <SelectableGroup id="bed" selectedId={selectedId} onSelect={onSelect}>
        <SoftShadow position={[-1.26, 0.018, 0.7]} scale={[0.95, 1.05, 1]} opacity={0.07} />
        <Box position={[-1.28, 0.22, 0.62]} scale={[1.35, 0.28, 1.65]} color={twinScenePalette.bedFrame} roughness={0.58} radius={0.06} />
        <Box position={[-1.28, 0.43, 0.62]} scale={[1.24, 0.18, 1.48]} color={twinScenePalette.mattress} metalness={0.02} roughness={0.78} radius={0.07} />
        <Box position={[-1.28, 0.52, 0.96]} scale={[1.18, 0.045, 0.68]} color="#DCE8F8" metalness={0.01} roughness={0.84} radius={0.045} />
        <Box position={[-1.28, 0.58, -0.05]} scale={[1.05, 0.13, 0.28]} color={twinScenePalette.pillow} metalness={0.02} roughness={0.72} radius={0.06} />
        <Box position={[-1.94, 0.54, 0.62]} scale={[0.12, 0.55, 1.62]} color="#9FB8D6" roughness={0.62} radius={0.025} />
      </SelectableGroup>

      <SelectableGroup id="desk" selectedId={selectedId} onSelect={onSelect}>
        <SoftShadow position={[1.19, 0.018, -0.73]} scale={[0.9, 0.65, 1]} opacity={0.07} />
        <Box position={[1.2, 0.62, -0.88]} scale={[1.28, 0.13, 0.68]} color={twinScenePalette.desk} roughness={0.5} radius={0.04} />
        <Box position={[1.2, 0.35, -0.88]} scale={[1.12, 0.48, 0.08]} color={twinScenePalette.deskLeg} opacity={0.96} roughness={0.62} radius={0.025} />
        <Laptop />
        <Box position={[1.68, 0.78, -0.95]} scale={[0.18, 0.32, 0.18]} color="#FFF8E6" emissive="#F5D88C" />
        <Box position={[1.12, 0.35, -0.22]} scale={[0.48, 0.16, 0.48]} color={twinScenePalette.chair} radius={0.045} />
        <Box position={[1.12, 0.62, -0.22]} scale={[0.42, 0.52, 0.08]} color="#B8C4D4" radius={0.035} />
      </SelectableGroup>

      <SelectableGroup id="wardrobe" selectedId={selectedId} onSelect={onSelect}>
        <SoftShadow position={[-1.86, 0.018, -1.08]} scale={[0.52, 0.36, 1]} opacity={0.06} />
        <Box position={[-1.86, 0.88, -1.16]} scale={[0.72, 1.65, 0.42]} color={twinScenePalette.wardrobe} roughness={0.68} radius={0.04} />
        <Box position={[-1.86, 1.73, -1.16]} scale={[0.76, 0.08, 0.48]} color="#F8FAFC" opacity={0.66} />
        <Box position={[-1.86, 0.9, -0.94]} scale={[0.02, 1.22, 0.035]} color="#A9B8CA" roughness={0.52} radius={0.01} />
      </SelectableGroup>

      <SelectableGroup id="window" selectedId={selectedId} onSelect={onSelect}>
        <Box position={[-0.26, 1.28, -1.72]} scale={[1.45, 0.72, 0.04]} color={twinScenePalette.window} emissive="#BDE2FF" opacity={0.5} />
        <Box position={[-0.26, 1.28, -1.76]} scale={[1.55, 0.08, 0.06]} color="#F8FBFF" emissive="#DDEBFF" />
        <Box position={[-0.26, 0.87, -1.76]} scale={[1.55, 0.07, 0.06]} color="#F8FBFF" emissive="#DDEBFF" />
      </SelectableGroup>

      <SelectableGroup id="door" selectedId={selectedId} onSelect={onSelect}>
        <Box position={[2.49, 0.86, 0.72]} scale={[0.06, 1.62, 0.72]} color={twinScenePalette.door} opacity={0.84} roughness={0.62} />
        <Box position={[2.53, 0.92, 1.05]} scale={[0.05, 0.08, 0.08]} color="#D8B35A" emissive="#D8B35A" />
      </SelectableGroup>

      <SelectableGroup id="air_conditioner" selectedId={selectedId} onSelect={onSelect}>
        <Box position={[1.42, 1.78, -1.74]} scale={[0.92, 0.26, 0.12]} color={twinScenePalette.ac} emissive="#DDEBFF" opacity={0.92} roughness={0.52} />
        <Box position={[1.42, 1.62, -1.77]} scale={[0.74, 0.04, 0.05]} color="#9BC4E8" emissive="#BDE2FF" />
      </SelectableGroup>

      <Plant />
    </group>
  );
}
