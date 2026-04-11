import * as THREE from "three"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { roundCoordinate, type ScenePlacement } from "@/utils/productionLine"

type SceneWorkspaceInspectorProps = {
  selectedPlacement: ScenePlacement | null
  readOnly: boolean
  onUpdatePlacement?: (
    placementId: string,
    patch: Partial<Pick<ScenePlacement, "position" | "rotation" | "scale">>
  ) => void
  onRemovePlacement?: (placementId: string) => void
}

export default function SceneWorkspaceInspector({
  selectedPlacement,
  readOnly,
  onUpdatePlacement,
  onRemovePlacement,
}: SceneWorkspaceInspectorProps) {
  if (readOnly || !selectedPlacement || !onUpdatePlacement || !onRemovePlacement) {
    return null
  }

  const activePlacement = selectedPlacement
  const applyPlacementUpdate = onUpdatePlacement
  const removePlacement = onRemovePlacement

  function updatePosition(index: number, value: number) {
    if (Number.isNaN(value)) {
      return
    }

    const nextPosition = [...activePlacement.position] as [number, number, number]
    nextPosition[index] = value
    applyPlacementUpdate(activePlacement.id, { position: nextPosition })
  }

  function updateRotationY(value: number) {
    if (Number.isNaN(value)) {
      return
    }

    const nextRotation = [...activePlacement.rotation] as [number, number, number]
    nextRotation[1] = THREE.MathUtils.degToRad(value)
    applyPlacementUpdate(activePlacement.id, { rotation: nextRotation })
  }

  function updateScale(value: number) {
    if (Number.isNaN(value)) {
      return
    }

    applyPlacementUpdate(activePlacement.id, { scale: Math.max(0.1, value) })
  }

  return (
    <div className="absolute bottom-2 left-2 w-95 rounded-2xl border border-slate-200 bg-white/96 p-3 shadow-sm backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between text-xs text-slate-600">
        <span className="font-medium text-slate-900">{activePlacement.assetFilename}</span>
        <span>{activePlacement.source === "manual" ? "手动" : "对话"}</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["X", "Y", "Z"] as const).map((label, index) => (
          <label key={label} className="space-y-1">
            <span className="text-[11px] text-slate-500">{label}</span>
            <Input
              type="number"
              step="0.1"
              value={activePlacement.position[index]}
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
            value={roundCoordinate(THREE.MathUtils.radToDeg(activePlacement.rotation[1]))}
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
            value={activePlacement.scale}
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
          onClick={() => removePlacement(activePlacement.id)}
        >
          删除当前模型
        </Button>
      </div>
    </div>
  )
}
