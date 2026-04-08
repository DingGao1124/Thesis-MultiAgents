import { Loader2, Trash2 } from "lucide-react"

import type { ModelAsset } from "@/api/assets"
import { ModelAssetCardPreview } from "@/components/assets/ModelAssetPreview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface AssetCardProps {
  asset: ModelAsset
  isActive: boolean
  isDeleting: boolean
  isVisible: boolean
  onSelect: () => void
  onDelete: () => void
  previewRef: (node: HTMLDivElement | null) => void
}

export function AssetCard({
  asset,
  isActive,
  isDeleting,
  isVisible,
  onSelect,
  onDelete,
  previewRef,
}: AssetCardProps) {
  return (
    <div
      ref={previewRef}
      data-asset-id={asset.id}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect()
        }
      }}
      className={`group overflow-hidden rounded-3xl border text-left transition-all ${
        isActive
          ? "border-slate-300 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
          : "border-slate-200/70 bg-white/82 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
      }`}
    >
      <div className="relative h-38 border-b border-slate-200/60 bg-[linear-gradient(180deg,#f6fafc_0%,#eef4f6_100%)]">
        {isVisible ? <ModelAssetCardPreview asset={asset} /> : null}
        {!isVisible ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] text-slate-500">
              完整进入视口后渲染
            </div>
          </div>
        ) : null}

        <div className="absolute top-3 right-3 flex items-center gap-2">
          <Badge
            variant="outline"
            className="rounded-full border-white/80 bg-white/85 px-2.5 py-1 text-[10px] text-slate-600"
          >
            {asset.format}
          </Badge>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-full bg-white/90 text-slate-400 hover:bg-white hover:text-rose-500"
            disabled={isDeleting}
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
          >
            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          </Button>
        </div>
      </div>

      <div className="space-y-3 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-slate-900">{asset.filename}</h3>
            <p className="mt-1 text-xs text-slate-500">{asset.size_label}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>{asset.name}</span>
          <span>{formatUpdatedTime(asset.updated_at)}</span>
        </div>
      </div>
    </div>
  )
}

function formatUpdatedTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)
}
