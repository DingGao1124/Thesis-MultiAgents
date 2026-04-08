import { useDeferredValue, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react"
import { Box, Loader2, RefreshCw, Search, Upload } from "lucide-react"

import type { ModelAsset } from "@/api/assets"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useModelAssetStore } from "@/stores/modelAssetStore"

import { AssetCard } from "./AssetCard"

interface AssetListPanelProps {
  onAssetChange: () => void
}

function areSetsEqual(left: Set<string>, right: Set<string>) {
  if (left.size !== right.size) {
    return false
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false
    }
  }

  return true
}

export function AssetListPanel({ onAssetChange }: AssetListPanelProps) {
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const previewRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const assets = useModelAssetStore((state) => state.assets)
  const keyword = useModelAssetStore((state) => state.keyword)
  const selectedId = useModelAssetStore((state) => state.selectedId)
  const isLoading = useModelAssetStore((state) => state.isLoading)
  const isUploading = useModelAssetStore((state) => state.isUploading)
  const deletingId = useModelAssetStore((state) => state.deletingId)
  const notice = useModelAssetStore((state) => state.notice)
  const loadAssets = useModelAssetStore((state) => state.loadAssets)
  const uploadAsset = useModelAssetStore((state) => state.uploadAsset)
  const deleteAsset = useModelAssetStore((state) => state.deleteAsset)
  const setKeyword = useModelAssetStore((state) => state.setKeyword)
  const setSelectedId = useModelAssetStore((state) => state.setSelectedId)

  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())

  const deferredKeyword = useDeferredValue(keyword)

  const filteredAssets = useMemo(
    () =>
      assets.filter((asset) => {
        if (!deferredKeyword.trim()) return true
        const query = deferredKeyword.trim().toLowerCase()
        return (
          asset.name.toLowerCase().includes(query) ||
          asset.filename.toLowerCase().includes(query) ||
          asset.format.toLowerCase().includes(query)
        )
      }),
    [assets, deferredKeyword]
  )
  const filteredAssetIdsKey = filteredAssets.map((asset) => asset.id).join("|")

  const selectedAsset =
    filteredAssets.find((a) => a.id === selectedId) ??
    assets.find((a) => a.id === selectedId) ??
    filteredAssets[0] ??
    assets[0] ??
    null

  const totalSizeBytes = assets.reduce((sum, asset) => sum + asset.size_bytes, 0)
  const totalSizeLabel = `${(totalSizeBytes / 1024 / 1024).toFixed(1)} MB`

  // Sync selectedId in store when filter changes and active asset shifts
  useEffect(() => {
    if (!selectedAsset) {
      setSelectedId(null)
      return
    }
    if (selectedAsset.id !== selectedId) {
      setSelectedId(selectedAsset.id)
    }
  }, [selectedAsset, selectedId, setSelectedId])

  useEffect(() => {
    const root = scrollViewportRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIds((previous) => {
          const next = new Set(previous)
          entries.forEach((entry) => {
            const assetId = (entry.target as HTMLElement).dataset.assetId
            if (!assetId) return
            if (entry.isIntersecting && entry.intersectionRatio >= 0.999) {
              next.add(assetId)
            } else {
              next.delete(assetId)
            }
          })
          return areSetsEqual(previous, next) ? previous : next
        })
      },
      { root, rootMargin: "0px", threshold: [1] }
    )

    filteredAssets.forEach((asset) => {
      const node = previewRefs.current[asset.id]
      if (node) observer.observe(node)
    })

    return () => observer.disconnect()
  }, [filteredAssetIdsKey, filteredAssets])

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const item = await uploadAsset(file)
      setSelectedId(item.id)
      onAssetChange()
    } finally {
      event.target.value = ""
    }
  }

  async function handleDelete(asset: ModelAsset) {
    const confirmed = window.confirm(`确认删除模型 "${asset.filename}" 吗？`)
    if (!confirmed) return
    await deleteAsset(asset.filename)
    onAssetChange()
  }

  return (
    <Card className="flex min-h-0 flex-1 gap-1 overflow-hidden rounded-[1.2rem] border border-slate-200/60 bg-white/68 py-0 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <CardHeader className="pt-2.5 pb-1 shrink-0 gap-2 border-b border-slate-200/70">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-[24px] tracking-tight">模型资产目录</CardTitle>
            <p className="mt-2 text-sm leading-6 text-slate-600">统一展示产线模型、设备模型与辅助工装资产。</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              当前资产 {assets.length} 项，累计存储 {totalSizeLabel}，当前选中格式{" "}
              {selectedAsset?.format ?? "--"}。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-65">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索模型名称或格式"
                className="h-10 rounded-full border-slate-200/80 bg-white/80 pl-9"
              />
            </div>

            <input ref={uploadInputRef} type="file" accept=".glb,.gltf" className="hidden" onChange={handleUpload} />

            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => void loadAssets({ keepSelection: true })}
              disabled={isLoading}
            >
              <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
              刷新
            </Button>

            <Button
              type="button"
              className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
              onClick={() => uploadInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              上传模型
            </Button>
          </div>
        </div>

        {notice ? (
          <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">{notice}</div>
        ) : null}
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-hidden px-5 pb-4">
        <div
          ref={scrollViewportRef}
          className="h-full min-h-0 overflow-y-auto pr-2"
          style={{ scrollbarGutter: "stable" }}
        >
          <div className="grid grid-cols-1 gap-4 pt-5 md:grid-cols-2 xl:grid-cols-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-57.5 animate-pulse rounded-3xl border border-slate-100 bg-slate-100/80"
                  />
                ))
              : null}

            {!isLoading && !filteredAssets.length ? (
              <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 text-center">
                <Box className="mb-3 size-8 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">未找到匹配的模型资产</p>
                <p className="mt-1 text-xs text-slate-400">请调整搜索条件后重试</p>
              </div>
            ) : null}

            {!isLoading &&
              filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  isActive={asset.id === selectedAsset?.id}
                  isDeleting={deletingId === asset.id}
                  isVisible={visibleIds.has(asset.id)}
                  onSelect={() => {
                    setSelectedId(asset.id)
                    onAssetChange()
                  }}
                  onDelete={() => void handleDelete(asset)}
                  previewRef={(node) => {
                    previewRefs.current[asset.id] = node
                  }}
                />
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
