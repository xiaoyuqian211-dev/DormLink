import { useGLTF } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { Component, Suspense, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Mesh, Object3D } from "three";
import { selectableIds } from "./sensorTwinData";
import type { SelectableId, SensorId, SensorReading, TwinArea, TwinAreaId } from "./types";
import { FallbackDormModel } from "./FallbackDormModel";

const bundledModels = import.meta.glob("../../assets/models/*.glb", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const bundledDormModelUrl = bundledModels["../../assets/models/dorm.glb"];
const publicDormModelUrl = "/models/dorm.glb";

type DormModelProps = {
  selectedId: SelectableId;
  sensors: SensorReading[];
  sensorsById: Record<SensorId, SensorReading>;
  twinAreas: Record<TwinAreaId, TwinArea>;
  onSelect: (id: SelectableId) => void;
};

type ModelErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
  resetKey: string | null;
  onError: () => void;
};

class ModelErrorBoundary extends Component<
  ModelErrorBoundaryProps,
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  componentDidUpdate(previousProps: ModelErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

function isMesh(object: Object3D): object is Mesh {
  return (object as Mesh).isMesh === true;
}

function normalizeObjectName(name: string) {
  return name.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function resolveTwinId(object: Object3D): SelectableId | null {
  let current: Object3D | null = object;
  while (current) {
    const normalizedName = normalizeObjectName(current.name);
    if (selectableIds.has(normalizedName as SelectableId)) {
      return normalizedName as SelectableId;
    }
    current = current.parent;
  }
  return null;
}

function LoadedDormModel({ modelUrl, onSelect }: { modelUrl: string; onSelect: (id: SelectableId) => void }) {
  const gltf = useGLTF(modelUrl);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    scene.traverse((object) => {
      if (isMesh(object)) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
  }, [scene]);

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    const selectedId = resolveTwinId(event.object);
    if (!selectedId) return;
    event.stopPropagation();
    onSelect(selectedId);
  }

  return (
    <primitive
      object={scene}
      scale={1}
      position={[0, 0, 0]}
      onPointerDown={handlePointerDown}
    />
  );
}

function ModelLoading() {
  return (
    <group>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[3.2, 0.08, 2.1]} />
        <meshStandardMaterial color="#12314b" transparent opacity={0.46} />
      </mesh>
    </group>
  );
}

export function DormModel({
  selectedId,
  sensors,
  sensorsById,
  twinAreas,
  onSelect,
}: DormModelProps) {
  const [modelUrl, setModelUrl] = useState<string | null>(bundledDormModelUrl ?? null);
  const [checkedPublicModel, setCheckedPublicModel] = useState(Boolean(bundledDormModelUrl));

  useEffect(() => {
    if (bundledDormModelUrl) return;
    let active = true;

    fetch(publicDormModelUrl, { method: "HEAD" })
      .then((response) => {
        if (!active) return;
        setModelUrl(response.ok ? publicDormModelUrl : null);
      })
      .catch(() => {
        if (active) setModelUrl(null);
      })
      .finally(() => {
        if (active) setCheckedPublicModel(true);
      });

    return () => {
      active = false;
    };
  }, []);

  if (!checkedPublicModel) {
    return (
      <FallbackDormModel
        selectedId={selectedId}
        sensors={sensors}
        sensorsById={sensorsById}
        twinAreas={twinAreas}
        onSelect={onSelect}
      />
    );
  }

  if (!modelUrl) {
    return (
      <FallbackDormModel
        selectedId={selectedId}
        sensors={sensors}
        sensorsById={sensorsById}
        twinAreas={twinAreas}
        onSelect={onSelect}
      />
    );
  }

  return (
    <ModelErrorBoundary
      resetKey={modelUrl}
      onError={() => setModelUrl(null)}
      fallback={
        <FallbackDormModel
          selectedId={selectedId}
          sensors={sensors}
          sensorsById={sensorsById}
          twinAreas={twinAreas}
          onSelect={onSelect}
        />
      }
    >
      <Suspense fallback={<ModelLoading />}>
        <LoadedDormModel modelUrl={modelUrl} onSelect={onSelect} />
      </Suspense>
    </ModelErrorBoundary>
  );
}
