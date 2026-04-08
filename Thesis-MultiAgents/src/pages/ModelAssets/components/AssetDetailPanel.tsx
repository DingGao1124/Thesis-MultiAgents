import { useDeferredValue } from "react"
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"

import { ModelAssetViewer } from "@/components/assets/ModelAssetPreview"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { useModelAssetStore } from "@/stores/modelAssetStore"

interface AssetDetailPanelProps {
  viewerKey: number
  onAssetChange: () => void
}

export function AssetDetailPanel({ viewerKey, onAssetChange }: AssetDetailPanelProps) {
  const assets = useModelAssetStore((state) => state.assets)
  const keyword = useModelAssetStore((state) => state.keyword)
  const selectedId = useModelAssetStore((state) => state.selectedId)
  const setSelectedId = useModelAssetStore((state) => state.setSelectedId)

  const deferredKeyword = useDeferredValue(keyword)

  const filteredAssets = assets.filter((asset) => {
    if (!deferredKeyword.trim()) return true
    const query = deferredKeyword.trim().toLowerCase()
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.filename.toLowerCase().includes(query) ||
      asset.format.toLowerCase().includes(query)
    )
  })

  const selectedAsset =
    filteredAssets.find((a) => a.id === selectedId) ??
    assets.find((a) => a.id === selectedId) ??
    filteredAssets[0] ??
    assets[0] ??
    null

  const selectedIndex = filteredAssets.findIndex((a) => a.id === selectedAsset?.id)

  function selectPrevAsset() {
    if (selectedIndex <= 0) return
    setSelectedId(filteredAssets[selectedIndex - 1].id)
    onAssetChange()
  }

  function selectNextAsset() {
    if (selectedIndex < 0 || selectedIndex >= filteredAssets.length - 1) return
    setSelectedId(filteredAssets[selectedIndex + 1].id)
    onAssetChange()
  }

  return (
    <Card className="flex min-h-0 flex-1 overflow-hidden rounded-[1.2rem] border border-slate-200/60 bg-white/68 py-0 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardHeader className="shrink-0 gap-4 border-b border-slate-200/70 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="secondary" className="rounded-full bg-slate-950 px-3 py-1 text-white shadow-sm">
              {selectedAsset?.filename ?? "未选择模型"}
            </Badge>
            <p className="mt-3 text-sm leading-6 text-slate-600">资产模型预览、属性信息与状态信息。</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              onClick={selectPrevAsset}
              disabled={selectedIndex <= 0}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              onClick={onAssetChange}
              disabled={!selectedAsset}
            >
              <RefreshCw className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-full"
              onClick={selectNextAsset}
              disabled={selectedIndex < 0 || selectedIndex >= filteredAssets.length - 1}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 px-5 py-4">
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-3xl border border-slate-200/70 bg-[linear-gradient(180deg,#f7fbfd_0%,#edf3f5_100%)]">
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Preview</p>
              <p className="mt-1 text-sm font-medium text-slate-700">{selectedAsset?.name ?? "等待选择资产"}</p>
            </div>
            <Badge variant="outline" className="rounded-full border-white/70 bg-white/90 px-3 py-1 text-slate-600">
              实时预览
            </Badge>
          </div>
          <ModelAssetViewer asset={selectedAsset} viewerKey={viewerKey} />
        </div>

        <div className="shrink-0 grid gap-3 sm:grid-cols-2">
          <Card className="gap-0 rounded-[0.95rem] border border-slate-200/65 bg-white/78 py-4 shadow-none">
            <CardContent className="px-4">
              <p className="text-xs text-slate-400">模型名称</p>
              <p className="mt-2 break-all text-sm font-semibold text-slate-900">{selectedAsset?.name ?? "--"}</p>
            </CardContent>
          </Card>
          <Card className="gap-0 rounded-[0.95rem] border border-slate-200/65 bg-white/78 py-4 shadow-none">
            <CardContent className="px-4">
              <p className="text-xs text-slate-400">模型格式</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{selectedAsset?.format ?? "--"}</p>
            </CardContent>
          </Card>
          <Card className="gap-0 rounded-[0.95rem] border border-slate-200/65 bg-white/78 py-4 shadow-none">
            <CardContent className="px-4">
              <p className="text-xs text-slate-400">文件大小</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{selectedAsset?.size_label ?? "--"}</p>
            </CardContent>
          </Card>
          <Card className="gap-0 rounded-[0.95rem] border border-slate-200/65 bg-white/78 py-4 shadow-none">
            <CardContent className="px-4">
              <p className="text-xs text-slate-400">最后更新</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">
                {selectedAsset ? formatUpdatedTime(selectedAsset.updated_at) : "--"}
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
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
