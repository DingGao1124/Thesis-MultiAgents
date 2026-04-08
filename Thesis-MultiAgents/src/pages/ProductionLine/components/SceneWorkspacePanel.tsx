import { Suspense, useEffect, useRef, useState } from "react"
import { Canvas, type ThreeEvent, useThree } from "@react-three/fiber"
import {
  Clone,
  Environment,
  GizmoHelper,
  GizmoViewport,
  Grid,
  Html,
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
} from "@react-three/drei"
import * as THREE from "three"

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
      <div
        style={{ writingMode: "horizontal-tb" }}
        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-500"
      >
        正在加载模型...
      </div>
    </Html>
  )
}

function PlacedAsset({ url }: { url: string }) {
  const gltf = useGLTF(url)
  return <Clone object={gltf.scene} />
}

function PlacementNode({
  item,
  isSelected,
  onSelect,
}: {
  item: ScenePlacement
  isSelected: boolean
  onSelect: (placementId: string) => void
}) {
  return (
    <group
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
            <ringGeometry args={[0.55, 0.72, 48]} />
            <meshBasicMaterial color="#111827" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
          <Html position={[0, 1.3, 0]} center distanceFactor={12}>
            <div className="rounded-sm border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 shadow-sm">
              {item.assetFilename}
            </div>
          </Html>
        </>
      ) : null}

      <Suspense fallback={<LoadingFallback />}>
        <PlacedAsset url={item.assetUrl} />
      </Suspense>
    </group>
  )
}

function SceneCanvas({
  placements,
  selectedPlacementId,
  onSelectPlacement,
  onCameraReady,
}: {
  placements: ScenePlacement[]
  selectedPlacementId: string | null
  onSelectPlacement: (placementId: string | null) => void
  onCameraReady: (camera: THREE.Camera) => void
}) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onPointerMissed={() => onSelectPlacement(null)}
    >
      <color attach="background" args={["#f4f6f8"]} />
      <fog attach="fog" args={["#f4f6f8", 14, 38]} />
      <PerspectiveCamera makeDefault position={[14, 10, 14]} fov={40} />
      <SceneCameraBridge onCameraReady={onCameraReady} />

      <ambientLight intensity={1.05} />
      <directionalLight position={[8, 10, 6]} intensity={1.35} />
      <directionalLight position={[-6, 5, -6]} intensity={0.4} />
      <hemisphereLight args={["#ffffff", "#cbd5e1", 0.7]} />
      <axesHelper args={[3]} />

      <Grid
        args={[40, 40]}
        position={[0, 0, 0]}
        cellColor="#c9d3dd"
        sectionColor="#94a3b8"
        cellSize={0.25}
        sectionSize={1}
        cellThickness={0.45}
        sectionThickness={0.95}
        fadeDistance={38}
        fadeStrength={1}
        infiniteGrid
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#eef2f6" transparent opacity={0.18} />
      </mesh>

      {placements.map((item) => (
        <PlacementNode
          key={item.id}
          item={item}
          isSelected={item.id === selectedPlacementId}
          onSelect={onSelectPlacement}
        />
      ))}

      <Environment preset="warehouse" />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        target={[0, 0, 0]}
        maxPolarAngle={Math.PI / 2.05}
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
        />

        {isDragOver ? (
          <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-slate-400 bg-slate-100/30" />
        ) : null}

        <div className="absolute top-2 left-2 rounded-sm border border-slate-200 bg-white/96 px-3 py-2 text-xs text-slate-600 shadow-sm">
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
          <div className="absolute bottom-2 left-2 w-[340px] rounded-sm border border-slate-200 bg-white/96 p-3 shadow-sm">
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
                    className="h-8 rounded-sm border-slate-200 px-2 text-xs"
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
                  className="h-8 rounded-sm border-slate-200 px-2 text-xs"
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
                  className="h-8 rounded-sm border-slate-200 px-2 text-xs"
                />
              </label>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
