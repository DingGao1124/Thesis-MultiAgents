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
import { Switch } from "@/components/ui/switch"
import type { DropPoint, ScenePlacement } from "../types"

type SceneSettings = {
  maxDpr: 1 | 2
  antialias: boolean
  showGrid: boolean
  showAxes: boolean
}

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
  settings,
  onSelectPlacement,
  onCameraReady,
  onUpdatePlacement,
}: {
  placements: ScenePlacement[]
  selectedPlacementId: string | null
  settings: SceneSettings
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [sceneSettings, setSceneSettings] = useState<SceneSettings>({
    maxDpr: 2,
    antialias: true,
    showGrid: true,
    showAxes: true,
  })

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

  useEffect(() => {
    if (!selectedPlacement) {
      return
    }

    const STEP = 0.2
    const FAST_STEP = 0.8

    function handleKeyDown(event: KeyboardEvent) {
      if (!selectedPlacement) {
        return
      }

      if ((event.target as HTMLElement).tagName === "INPUT" || (event.target as HTMLElement).tagName === "TEXTAREA") {
        return
      }

      const step = event.shiftKey ? FAST_STEP : STEP
      const pos = [...selectedPlacement.position] as [number, number, number]
      let moved = false

      switch (event.key) {
        case "w":
        case "W":
        case "ArrowUp":
          pos[2] = roundCoordinate(pos[2] - step)
          moved = true
          break
        case "s":
        case "S":
        case "ArrowDown":
          pos[2] = roundCoordinate(pos[2] + step)
          moved = true
          break
        case "a":
        case "A":
        case "ArrowLeft":
          pos[0] = roundCoordinate(pos[0] - step)
          moved = true
          break
        case "d":
        case "D":
        case "ArrowRight":
          pos[0] = roundCoordinate(pos[0] + step)
          moved = true
          break
        case "q":
        case "Q":
          pos[1] = roundCoordinate(pos[1] + step)
          moved = true
          break
        case "e":
        case "E":
          pos[1] = roundCoordinate(pos[1] - step)
          moved = true
          break
      }

      if (moved) {
        event.preventDefault()
        onUpdatePlacement(selectedPlacement.id, { position: pos })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedPlacement, onUpdatePlacement])

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
          settings={sceneSettings}
          onSelectPlacement={onSelectPlacement}
          onCameraReady={(camera) => {
            cameraRef.current = camera
          }}
          onUpdatePlacement={onUpdatePlacement}
        />

        {isDragOver ? (
          <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-sky-400/70 bg-sky-50/20" />
        ) : null}

        <div className="absolute top-2 right-2 z-10 flex flex-col items-end">
          <button
            type="button"
            onClick={() => setIsSettingsOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/96 text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700"
            title="渲染设置"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
            </svg>
          </button>

          {isSettingsOpen ? (
            <div className="mt-1 w-48 rounded-xl border border-slate-200 bg-white/96 p-3 shadow-sm backdrop-blur-sm">
              <div className="mb-2 text-[11px] font-medium text-slate-900">渲染设置</div>
              <div className="space-y-2.5">
                <label className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">高清 (2x DPR)</span>
                  <Switch
                    checked={sceneSettings.maxDpr === 2}
                    onCheckedChange={(checked) =>
                      setSceneSettings((s) => ({ ...s, maxDpr: checked ? 2 : 1 }))
                    }
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">抗锯齿</span>
                  <Switch
                    checked={sceneSettings.antialias}
                    onCheckedChange={(checked) =>
                      setSceneSettings((s) => ({ ...s, antialias: checked }))
                    }
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">网格</span>
                  <Switch
                    checked={sceneSettings.showGrid}
                    onCheckedChange={(checked) =>
                      setSceneSettings((s) => ({ ...s, showGrid: checked }))
                    }
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600">坐标轴</span>
                  <Switch
                    checked={sceneSettings.showAxes}
                    onCheckedChange={(checked) =>
                      setSceneSettings((s) => ({ ...s, showAxes: checked }))
                    }
                  />
                </label>
              </div>
            </div>
          ) : null}
        </div>

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
