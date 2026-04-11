import { Suspense, type Ref, useEffect, useMemo, useRef } from "react"
import { Canvas, type ThreeEvent, useThree } from "@react-three/fiber"
import {
  Clone,
  GizmoHelper,
  GizmoViewport,
  Html,
  OrbitControls,
  PerspectiveCamera,
  TransformControls,
  useGLTF,
} from "@react-three/drei"
import type {
  OrbitControls as OrbitControlsImpl,
  TransformControls as TransformControlsImpl,
} from "three-stdlib"
import * as THREE from "three"

import type { ScenePlacement } from "@/utils/productionLine"
import { roundCoordinate } from "@/utils/productionLine"

export type SceneSettings = {
  maxDpr: 1 | 2
  antialias: boolean
  showGrid: boolean
  showAxes: boolean
}

type SceneWorkspaceCanvasProps = {
  placements: ScenePlacement[]
  selectedPlacementId: string | null
  settings: SceneSettings
  readOnly: boolean
  onSelectPlacement: (placementId: string | null) => void
  onCameraReady: (camera: THREE.Camera) => void
  onUpdatePlacement?: (
    placementId: string,
    patch: Partial<Pick<ScenePlacement, "position" | "rotation" | "scale">>
  ) => void
}

function SceneCameraBridge({
  onCameraReady,
}: {
  onCameraReady: (camera: THREE.Camera) => void
}) {
  const { camera } = useThree()

  useEffect(() => {
    onCameraReady(camera)
  }, [camera, onCameraReady])

  return null
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500 shadow-sm">
        加载模型中...
      </div>
    </Html>
  )
}

function PlacedAsset({
  url,
  isSelected,
}: {
  url: string
  isSelected: boolean
}) {
  const gltf = useGLTF(url)

  const bounds = useMemo(() => {
    const source = gltf.scene.clone(true)
    source.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(source)
    if (box.isEmpty()) {
      return null
    }

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())

    return {
      size: [
        Math.max(size.x, 0.12),
        Math.max(size.y, 0.12),
        Math.max(size.z, 0.12),
      ] as [number, number, number],
      modelOffset: [-center.x, -box.min.y, -center.z] as [number, number, number],
      selectionCenter: [0, size.y / 2, 0] as [number, number, number],
    }
  }, [gltf.scene])

  return (
    <>
      {bounds ? (
        <group position={bounds.modelOffset}>
          <Clone object={gltf.scene} />
        </group>
      ) : (
        <Clone object={gltf.scene} />
      )}

      {isSelected && bounds ? (
        <mesh position={bounds.selectionCenter}>
          <boxGeometry args={bounds.size} />
          <meshBasicMaterial color="#2563eb" wireframe transparent opacity={0.95} toneMapped={false} />
        </mesh>
      ) : null}
    </>
  )
}

function PlacementNode({
  item,
  isSelected,
  onSelect,
  groupRef,
}: {
  item: ScenePlacement
  isSelected: boolean
  onSelect: (placementId: string) => void
  groupRef?: Ref<THREE.Group>
}) {
  return (
    <group
      ref={groupRef}
      position={item.position}
      rotation={item.rotation}
      scale={item.scale}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation()
        onSelect(item.id)
      }}
    >
      {isSelected ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.72, 0.94, 56]} />
          <meshBasicMaterial color="#2563eb" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      ) : null}

      <Suspense fallback={<LoadingFallback />}>
        <PlacedAsset url={item.assetUrl} isSelected={isSelected} />
      </Suspense>
    </group>
  )
}

export default function SceneWorkspaceCanvas({
  placements,
  selectedPlacementId,
  settings,
  readOnly,
  onSelectPlacement,
  onCameraReady,
  onUpdatePlacement,
}: SceneWorkspaceCanvasProps) {
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null)
  const selectedGroupRef = useRef<THREE.Group | null>(null)
  const transformControlsRef = useRef<TransformControlsImpl | null>(null)

  useEffect(() => {
    if (readOnly) {
      return
    }

    const controls = transformControlsRef.current
    if (!controls) {
      return
    }

    if (selectedGroupRef.current) {
      controls.attach(selectedGroupRef.current)
      return
    }

    controls.detach()
  }, [placements, readOnly, selectedPlacementId])

  useEffect(() => {
    if (readOnly) {
      return
    }

    const controls = transformControlsRef.current
    if (!controls) {
      return
    }

    const controlsWithEvents = controls as TransformControlsImpl & {
      addEventListener: (type: string, listener: (event: { value: boolean }) => void) => void
      removeEventListener: (type: string, listener: (event: { value: boolean }) => void) => void
    }

    const handleDraggingChanged = (event: { value: boolean }) => {
      if (orbitControlsRef.current) {
        orbitControlsRef.current.enabled = !event.value
      }
    }

    controlsWithEvents.addEventListener("dragging-changed", handleDraggingChanged)
    return () => {
      controlsWithEvents.removeEventListener("dragging-changed", handleDraggingChanged)
    }
  }, [readOnly, selectedPlacementId])

  return (
    <Canvas
      key={`${settings.maxDpr}-${settings.antialias}`}
      dpr={[1, settings.maxDpr]}
      gl={{ antialias: settings.antialias, alpha: false }}
      onPointerMissed={() => onSelectPlacement(null)}
    >
      <color attach="background" args={["#f7f8fa"]} />
      <PerspectiveCamera
        makeDefault
        position={[14, 10, 14]}
        fov={40}
        onUpdate={(camera) => {
          camera.lookAt(0, 0, 0)
          camera.updateProjectionMatrix()
        }}
      />
      <SceneCameraBridge onCameraReady={onCameraReady} />

      <ambientLight intensity={1.05} />
      <directionalLight position={[8, 10, 6]} intensity={1.2} />
      <directionalLight position={[-6, 5, -6]} intensity={0.36} />
      <hemisphereLight args={["#ffffff", "#d5dde6", 0.62]} />
      {settings.showAxes ? <axesHelper args={[3]} /> : null}
      {settings.showGrid ? (
        <gridHelper args={[48, 96, "#9aa8b8", "#d6dde5"]} position={[0, 0, 0]} />
      ) : null}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#eef2f6" transparent opacity={0.12} />
      </mesh>

      {placements.map((item) => {
        const isSelected = item.id === selectedPlacementId

        return (
          <PlacementNode
            key={item.id}
            item={item}
            isSelected={isSelected}
            onSelect={onSelectPlacement}
            groupRef={isSelected ? selectedGroupRef : undefined}
          />
        )
      })}

      {!readOnly && selectedPlacementId && onUpdatePlacement ? (
        <TransformControls
          ref={(node) => {
            transformControlsRef.current = node
          }}
          mode="translate"
          size={0.85}
          onObjectChange={() => {
            const object = selectedGroupRef.current
            if (!object || !selectedPlacementId) {
              return
            }

            onUpdatePlacement(selectedPlacementId, {
              position: [
                roundCoordinate(object.position.x),
                roundCoordinate(object.position.y),
                roundCoordinate(object.position.z),
              ],
              rotation: [
                roundCoordinate(object.rotation.x),
                roundCoordinate(object.rotation.y),
                roundCoordinate(object.rotation.z),
              ],
              scale: roundCoordinate(object.scale.x),
            })
          }}
        />
      ) : null}

      <OrbitControls
        ref={orbitControlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        target={[0, 0, 0]}
        minDistance={6}
        maxDistance={96}
        maxPolarAngle={Math.PI / 2.02}
      />
      <GizmoHelper alignment="bottom-right" margin={[88, 88]}>
        <GizmoViewport axisColors={["#ef4444", "#22c55e", "#3b82f6"]} labelColor="#111827" />
      </GizmoHelper>
    </Canvas>
  )
}
