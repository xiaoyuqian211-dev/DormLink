import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MutableRefObject } from "react";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { DormModel } from "./DormModel";
import { SensorMarker } from "./SensorMarker";
import { twinScenePalette } from "./designTokens";
import { cameraFocusMap } from "./sensorTwinData";
import type { FocusRequest, SelectableId, SensorId, SensorReading, TwinArea, TwinAreaId } from "./types";

type DormSceneProps = {
  selectedId: SelectableId;
  focusRequest: FocusRequest;
  sensors: SensorReading[];
  sensorsById: Record<SensorId, SensorReading>;
  twinAreas: Record<TwinAreaId, TwinArea>;
  onSelect: (id: SelectableId) => void;
  onManualControl?: () => void;
};

type CameraControllerProps = {
  focusRequest: FocusRequest;
  controlsRef: MutableRefObject<OrbitControlsImpl | null>;
  cancelFlightRef: MutableRefObject<(() => void) | null>;
};

const CAMERA_FLIGHT_SECONDS = 0.86;
const TARGET_BOUNDS = {
  minX: -1.85,
  maxX: 1.85,
  minY: 0.28,
  maxY: 1.48,
  minZ: -1.5,
  maxZ: 1.28,
};

function clampTarget(target: THREE.Vector3) {
  target.x = THREE.MathUtils.clamp(target.x, TARGET_BOUNDS.minX, TARGET_BOUNDS.maxX);
  target.y = THREE.MathUtils.clamp(target.y, TARGET_BOUNDS.minY, TARGET_BOUNDS.maxY);
  target.z = THREE.MathUtils.clamp(target.z, TARGET_BOUNDS.minZ, TARGET_BOUNDS.maxZ);
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function CameraController({
  focusRequest,
  controlsRef,
  cancelFlightRef,
}: CameraControllerProps) {
  const { camera } = useThree();
  const active = useRef(false);
  const startedAt = useRef(0);
  const startPosition = useRef(new THREE.Vector3());
  const startTarget = useRef(new THREE.Vector3());
  const targetPosition = useRef(new THREE.Vector3());
  const targetLookAt = useRef(new THREE.Vector3());

  useEffect(() => {
    cancelFlightRef.current = () => {
      active.current = false;
    };

    return () => {
      cancelFlightRef.current = null;
    };
  }, [cancelFlightRef]);

  useEffect(() => {
    const focus = cameraFocusMap[focusRequest.key];
    const controls = controlsRef.current;
    if (!focus || !controls) return;

    startPosition.current.copy(camera.position);
    startTarget.current.copy(controls.target);
    targetPosition.current.fromArray(focus.position);
    targetLookAt.current.fromArray(focus.target);
    clampTarget(targetLookAt.current);
    startedAt.current = performance.now() / 1000;
    active.current = true;
  }, [camera, controlsRef, focusRequest]);

  useFrame(() => {
    if (!active.current) return;

    const controls = controlsRef.current;
    const elapsed = performance.now() / 1000 - startedAt.current;
    const progress = THREE.MathUtils.clamp(elapsed / CAMERA_FLIGHT_SECONDS, 0, 1);
    const eased = easeInOutCubic(progress);

    camera.position.lerpVectors(startPosition.current, targetPosition.current, eased);

    if (controls) {
      controls.target.lerpVectors(startTarget.current, targetLookAt.current, eased);
      clampTarget(controls.target);
      controls.update();
    } else {
      camera.lookAt(targetLookAt.current);
    }

    if (progress >= 1) {
      active.current = false;
    }
  });

  return null;
}

function SceneLights() {
  return (
    <>
      <ambientLight intensity={0.52} />
      <hemisphereLight color="#ffffff" groundColor="#C9D6E5" intensity={0.84} />
      <directionalLight
        castShadow
        color="#F8FBFF"
        intensity={2.18}
        position={[3.9, 5.8, 3.4]}
        shadow-bias={-0.0002}
        shadow-mapSize-height={2048}
        shadow-mapSize-width={2048}
      />
      <directionalLight color="#DDEBFF" intensity={0.58} position={[-3.4, 2.8, -2.5]} />
      <pointLight color="#8EC5FF" intensity={0.72} position={[-1.9, 1.8, -1.25]} distance={4.8} />
      <pointLight color="#BFE9E7" intensity={0.42} position={[2.2, 1.25, 1.5]} distance={3.8} />
    </>
  );
}

export function DormScene({
  selectedId,
  focusRequest,
  sensors,
  sensorsById,
  twinAreas,
  onSelect,
  onManualControl,
}: DormSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const cancelFlightRef = useRef<(() => void) | null>(null);
  const selectedSensorIds = useMemo(() => new Set([selectedId]), [selectedId]);
  const [isUserControlling, setIsUserControlling] = useState(false);
  const [isFreeView, setIsFreeView] = useState(false);

  function handleControlStart() {
    cancelFlightRef.current?.();
    setIsUserControlling(true);
    setIsFreeView(true);
    onManualControl?.();
  }

  function handleControlEnd() {
    setIsUserControlling(false);
  }

  function handleControlChange() {
    const controls = controlsRef.current;
    if (!controls) return;
    clampTarget(controls.target);
  }

  useEffect(() => {
    setIsFreeView(false);
  }, [focusRequest]);

  return (
    <div
      className={`relative h-[540px] min-h-[520px] overflow-hidden rounded-[24px] border border-slate-300/[0.22] bg-[radial-gradient(circle_at_36%_18%,rgba(255,255,255,0.95),rgba(234,241,250,0.82)_58%,rgba(220,232,246,0.78))] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),inset_0_-28px_80px_rgba(107,124,148,0.10)] lg:h-[620px] ${
        isUserControlling ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-full border border-white/70 bg-white/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 backdrop-blur">
        3D View / Sensor Map
      </div>
      <div className="pointer-events-none absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-2.5 py-1 text-[10px] font-medium text-slate-400 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-400/70" />
        {isFreeView ? "自由视角" : "预设镜头"}
      </div>
      <div className="pointer-events-none absolute bottom-4 right-4 z-10 rounded-full border border-white/70 bg-white/50 px-3 py-1.5 text-[10px] font-medium text-slate-400 backdrop-blur">
        拖拽旋转 · 滚轮缩放 · 右键平移
      </div>

      <Canvas
        camera={{ position: [4.6, 4.2, 5.0], fov: 44, near: 0.1, far: 100 }}
        dpr={[1, 1.75]}
        shadows
        onContextMenu={(event) => event.preventDefault()}
        onCreated={({ gl }) => {
          gl.setClearColor(twinScenePalette.canvas);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <SceneLights />
        <Environment preset="apartment" />
        <fog attach="fog" args={[twinScenePalette.canvas, 11, 18]} />
        <CameraController
          focusRequest={focusRequest}
          controlsRef={controlsRef}
          cancelFlightRef={cancelFlightRef}
        />

        <group position={[0, -0.02, 0]}>
          <DormModel
            selectedId={selectedId}
            sensors={sensors}
            sensorsById={sensorsById}
            twinAreas={twinAreas}
            onSelect={onSelect}
          />
          {sensors.map((sensor) => (
            <SensorMarker
              key={sensor.id}
              sensor={sensor}
              selected={selectedSensorIds.has(sensor.id)}
              onSelect={onSelect}
            />
          ))}
        </group>

        <ContactShadows
          opacity={0.44}
          scale={5.5}
          blur={3.1}
          far={3}
          position={[0, -0.02, 0]}
          color="#8FA1B8"
        />
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.08}
          enablePan
          enableRotate
          enableZoom
          rotateSpeed={0.62}
          zoomSpeed={0.72}
          panSpeed={0.56}
          screenSpacePanning={false}
          minDistance={3.25}
          maxDistance={8.8}
          minPolarAngle={0.36}
          maxPolarAngle={Math.PI / 2.14}
          target={[0, 0.58, 0]}
          mouseButtons={{
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          }}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
          onStart={handleControlStart}
          onEnd={handleControlEnd}
          onChange={handleControlChange}
        />
      </Canvas>
    </div>
  );
}
