import { Suspense, type Ref, useEffect, useMemo, useRef, useState } from "react"
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

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { DropPoint, ScenePlacement } from "../types"

type SceneWorkspacePanelProps = {
  placements: ScenePlacement[]
  selectedPlacement: ScenePlacement | null
  selectedPlacementId: string | null
  draggedAssetName: string | null
  onSelectPlacement: (placementId: string | null) => void
  onDropAsset: (point: DropPoint | null) => void
  onUpdatePlacement: (
    placementId: string,
    patch: Partial<Pick<ScenePlacement, "position" | "rotation" | "scale">>
  ) => void
  onRemovePlacement: (placementId: string) => void
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
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <ringGeometry args={[0.72, 0.94, 56]} />
            <meshBasicMaterial color="#2563eb" transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
        </>
      ) : null}

      <Suspense fallback={<LoadingFallback />}>
        <PlacedAsset url={item.assetUrl} isSelected={isSelected} />
      </Suspense>
    </group>
  )
}

function SceneCanvas({
  placements,
  selectedPlacementId,
  onSelectPlacement,
  onCameraReady,
  onUpdatePlacement,
}: {
  placements: ScenePlacement[]
  selectedPlacementId: string | null
  onSelectPlacement: (placementId: string | null) => void
  onCameraReady: (camera: THREE.Camera) => void
  onUpdatePlacement: (
    placementId: string,
    patch: Partial<Pick<ScenePlacement, "position" | "rotation" | "scale">>
  ) => void
}) {
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null)
  const selectedGroupRef = useRef<THREE.Group | null>(null)
  const transformMode = "translate"
  const transformControlsRef = useRef<TransformControlsImpl | null>(null)

  useEffect(() => {
    const controls = transformControlsRef.current

    if (!controls) {
      return
    }

    if (selectedGroupRef.current) {
      controls.attach(selectedGroupRef.current)
      return
    }

    controls.detach()
  }, [selectedPlacementId, placements])

  useEffect(() => {
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
  }, [selectedPlacementId])

  return (
    <Canvas
      dpr={[1, 1]}
      gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
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
      <axesHelper args={[3]} />
      <gridHelper args={[48, 96, "#9aa8b8", "#d6dde5"]} position={[0, 0, 0]} />

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

      {selectedPlacementId ? (
        <TransformControls
          ref={(node) => {
            transformControlsRef.current = node
          }}
          mode={transformMode}
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

function roundCoordinate(value: number) {
  return Math.round(value * 100) / 100
}

export default function SceneWorkspacePanel({
  placements,
  selectedPlacement,
  selectedPlacementId,
  draggedAssetName,
  onSelectPlacement,
  onDropAsset,
  onUpdatePlacement,
  onRemovePlacement,
}: SceneWorkspacePanelProps) {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const cameraRef = useRef<THREE.Camera | null>(null)

  const [isDragOver, setIsDragOver] = useState(false)
  const [dropPoint, setDropPoint] = useState<DropPoint | null>(null)

  function computeDropPoint(clientX: number, clientY: number) {
    const container = shellRef.current
    const camera = cameraRef.current

    if (!container || !camera) {
      return null
    }

    const rect = container.getBoundingClientRect()
    const pointer = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    )
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(pointer, camera)

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const hitPoint = new THREE.Vector3()
    const hit = raycaster.ray.intersectPlane(plane, hitPoint)

    if (!hit) {
      return null
    }

    return {
      x: roundCoordinate(hitPoint.x),
      y: 0,
      z: roundCoordinate(hitPoint.z),
    }
  }

  function updatePosition(index: number, value: number) {
    if (!selectedPlacement || Number.isNaN(value)) {
      return
    }

    const nextPosition = [...selectedPlacement.position] as [number, number, number]
    nextPosition[index] = value
    onUpdatePlacement(selectedPlacement.id, { position: nextPosition })
  }

  function updateRotationY(value: number) {
    if (!selectedPlacement || Number.isNaN(value)) {
      return
    }

    const nextRotation = [...selectedPlacement.rotation] as [number, number, number]
    nextRotation[1] = THREE.MathUtils.degToRad(value)
    onUpdatePlacement(selectedPlacement.id, { rotation: nextRotation })
  }

  function updateScale(value: number) {
    if (!selectedPlacement || Number.isNaN(value)) {
      return
    }

    onUpdatePlacement(selectedPlacement.id, { scale: Math.max(0.1, value) })
  }

  return (
    <section className="relative min-w-0 flex-1 overflow-hidden rounded-sm border border-slate-200 bg-white">
      <div
        ref={shellRef}
        className="relative h-full w-full"
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragOver(true)
          setDropPoint(computeDropPoint(event.clientX, event.clientY))
        }}
        onDragLeave={() => {
          setIsDragOver(false)
          setDropPoint(null)
        }}
        onDrop={(event) => {
          event.preventDefault()
          onDropAsset(computeDropPoint(event.clientX, event.clientY))
          setIsDragOver(false)
          setDropPoint(null)
        }}
      >
        <SceneCanvas
          placements={placements}
          selectedPlacementId={selectedPlacementId}
          onSelectPlacement={onSelectPlacement}
          onCameraReady={(camera) => {
            cameraRef.current = camera
          }}
          onUpdatePlacement={onUpdatePlacement}
        />

        {isDragOver ? (
          <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-sky-400/70 bg-sky-50/20" />
        ) : null}

        <div className="absolute top-2 left-2 rounded-full border border-slate-200 bg-white/96 px-3 py-2 text-xs text-slate-600 shadow-sm">
          <div className="flex items-center gap-3">
            <span>三维产线</span>
            <span>实例 {placements.length}</span>
            <span>{selectedPlacement ? selectedPlacement.assetFilename : "未选中实例"}</span>
          </div>
          {draggedAssetName && dropPoint ? (
            <div className="mt-1 text-[11px] text-slate-500">
              {draggedAssetName} -&gt; ({dropPoint.x}, {dropPoint.y}, {dropPoint.z})
            </div>
          ) : null}
        </div>

        {selectedPlacement ? (
          <div className="absolute bottom-2 left-2 w-95 rounded-2xl border border-slate-200 bg-white/96 p-3 shadow-sm backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium text-slate-900">{selectedPlacement.assetFilename}</span>
              <span>{selectedPlacement.source === "manual" ? "手动" : "对话"}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(["X", "Y", "Z"] as const).map((label, index) => (
                <label key={label} className="space-y-1">
                  <span className="text-[11px] text-slate-500">{label}</span>
                  <Input
                    type="number"
                    step="0.1"
                    value={selectedPlacement.position[index]}
                    onChange={(event) => updatePosition(index, Number(event.target.value))}
                    className="h-9 rounded-xl border-slate-200 px-3 text-xs shadow-none"
                  />
                </label>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[11px] text-slate-500">Rotation Y (deg)</span>
                <Input
                  type="number"
                  step="0.1"
                  value={roundCoordinate(THREE.MathUtils.radToDeg(selectedPlacement.rotation[1]))}
                  onChange={(event) => updateRotationY(Number(event.target.value))}
                  className="h-9 rounded-xl border-slate-200 px-3 text-xs shadow-none"
                />
              </label>

              <label className="space-y-1">
                <span className="text-[11px] text-slate-500">Scale</span>
                <Input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={selectedPlacement.scale}
                  onChange={(event) => updateScale(Number(event.target.value))}
                  className="h-9 rounded-xl border-slate-200 px-3 text-xs shadow-none"
                />
              </label>
            </div>

            <div className="mt-3 flex justify-end">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="rounded-full"
                onClick={() => onRemovePlacement(selectedPlacement.id)}
              >
                删除当前模型
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
