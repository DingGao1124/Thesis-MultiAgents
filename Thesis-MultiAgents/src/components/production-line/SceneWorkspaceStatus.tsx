import type { DropPoint, ScenePlacement } from "@/utils/productionLine"

type SceneWorkspaceStatusProps = {
  placements: ScenePlacement[]
  selectedPlacement: ScenePlacement | null
  readOnly: boolean
  draggedAssetName: string | null
  dropPoint: DropPoint | null
}

export default function SceneWorkspaceStatus({
  placements,
  selectedPlacement,
  readOnly,
  draggedAssetName,
  dropPoint,
}: SceneWorkspaceStatusProps) {
  return (
    <div className="absolute top-2 left-2 rounded-full border border-slate-200 bg-white/96 px-3 py-2 text-xs text-slate-600 shadow-sm">
      <div className="flex items-center gap-3">
        <span>三维产线</span>
        <span>实例 {placements.length}</span>
        <span>{selectedPlacement ? selectedPlacement.assetFilename : "未选中实例"}</span>
        {readOnly ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
            只读视图
          </span>
        ) : null}
      </div>
      {!readOnly && draggedAssetName && dropPoint ? (
        <div className="mt-1 text-[11px] text-slate-500">
          {draggedAssetName} -&gt; ({dropPoint.x}, {dropPoint.y}, {dropPoint.z})
        </div>
      ) : null}
    </div>
  )
}
