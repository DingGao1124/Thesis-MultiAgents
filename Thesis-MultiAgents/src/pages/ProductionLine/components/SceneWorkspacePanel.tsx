import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

import { cn } from "@/lib/utils"
import type { DropPoint, ScenePlacement } from "@/utils/productionLine"
import { roundCoordinate } from "@/utils/productionLine"
import SceneWorkspaceCanvas, { type SceneSettings } from "./SceneWorkspaceCanvas"
import SceneWorkspaceInspector from "./SceneWorkspaceInspector"
import SceneWorkspaceSettings from "./SceneWorkspaceSettings"
import SceneWorkspaceStatus from "./SceneWorkspaceStatus"

type SceneWorkspacePanelProps = {
  placements: ScenePlacement[]
  selectedPlacementId: string | null
  onSelectPlacement: (placementId: string | null) => void
  readOnly?: boolean
  draggedAssetName?: string | null
  onDropAsset?: (point: DropPoint | null) => void
  onUpdatePlacement?: (
    placementId: string,
    patch: Partial<Pick<ScenePlacement, "position" | "rotation" | "scale">>
  ) => void
  onRemovePlacement?: (placementId: string) => void
  className?: string
}

export default function SceneWorkspacePanel({
  placements,
  selectedPlacementId,
  onSelectPlacement,
  readOnly = false,
  draggedAssetName = null,
  onDropAsset,
  onUpdatePlacement,
  onRemovePlacement,
  className,
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

  const selectedPlacement = placements.find((item) => item.id === selectedPlacementId) ?? null

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

  useEffect(() => {
    if (readOnly || !selectedPlacement || !onUpdatePlacement) {
      return
    }

    const activePlacement = selectedPlacement
    const applyPlacementUpdate = onUpdatePlacement
    const STEP = 0.2
    const FAST_STEP = 0.8

    function handleKeyDown(event: KeyboardEvent) {
      if ((event.target as HTMLElement).tagName === "INPUT" || (event.target as HTMLElement).tagName === "TEXTAREA") {
        return
      }

      const step = event.shiftKey ? FAST_STEP : STEP
      const pos = [...activePlacement.position] as [number, number, number]
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
        applyPlacementUpdate(activePlacement.id, { position: pos })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onUpdatePlacement, readOnly, selectedPlacement])

  return (
    <section className={cn("relative min-w-0 flex-1 overflow-hidden rounded-sm border border-slate-200 bg-white", className)}>
      <div
        ref={shellRef}
        className="relative h-full w-full"
        onDragOver={(event) => {
          if (readOnly || !onDropAsset) {
            return
          }

          event.preventDefault()
          setIsDragOver(true)
          setDropPoint(computeDropPoint(event.clientX, event.clientY))
        }}
        onDragLeave={() => {
          if (readOnly || !onDropAsset) {
            return
          }

          setIsDragOver(false)
          setDropPoint(null)
        }}
        onDrop={(event) => {
          if (readOnly || !onDropAsset) {
            return
          }

          event.preventDefault()
          onDropAsset(computeDropPoint(event.clientX, event.clientY))
          setIsDragOver(false)
          setDropPoint(null)
        }}
      >
        <SceneWorkspaceCanvas
          placements={placements}
          selectedPlacementId={selectedPlacementId}
          settings={sceneSettings}
          readOnly={readOnly}
          onSelectPlacement={onSelectPlacement}
          onCameraReady={(camera) => {
            cameraRef.current = camera
          }}
          onUpdatePlacement={onUpdatePlacement}
        />

        {!readOnly && isDragOver ? (
          <div className="pointer-events-none absolute inset-0 border-2 border-dashed border-sky-400/70 bg-sky-50/20" />
        ) : null}

        <SceneWorkspaceSettings
          open={isSettingsOpen}
          onToggle={() => setIsSettingsOpen((value) => !value)}
          settings={sceneSettings}
          onSettingsChange={setSceneSettings}
        />

        <SceneWorkspaceStatus
          placements={placements}
          selectedPlacement={selectedPlacement}
          readOnly={readOnly}
          draggedAssetName={draggedAssetName}
          dropPoint={dropPoint}
        />

        <SceneWorkspaceInspector
          selectedPlacement={selectedPlacement}
          readOnly={readOnly}
          onUpdatePlacement={onUpdatePlacement}
          onRemovePlacement={onRemovePlacement}
        />
      </div>
    </section>
  )
}
