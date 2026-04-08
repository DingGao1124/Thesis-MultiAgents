import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
} from "react"
import {
  Box,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react"

import type { ModelAsset } from "@/api/assets"
import { ModelAssetCardPreview } from "@/components/assets/ModelAssetPreview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AssetLibraryPanelProps = {
  assets: ModelAsset[]
  isLoading: boolean
  isUploading: boolean
  deletingId: string | null
  keyword: string
  notice: string
  selectedAssetId: string | null
  onKeywordChange: (value: string) => void
  onSelectAsset: (assetId: string) => void
  onRefresh: () => void
  onUpload: (file: File) => Promise<void>
  onDelete: (asset: ModelAsset) => Promise<void>
  onDragStart: (assetId: string) => void
}

const CARD_HEIGHT = 214
const GRID_GAP = 8
const ROW_HEIGHT = CARD_HEIGHT + GRID_GAP
const OVERSCAN_ROWS = 2
const MAX_ACTIVE_PREVIEWS = 4

export default function AssetLibraryPanel({
  assets,
  isLoading,
  isUploading,
  deletingId,
  keyword,
  notice,
  selectedAssetId,
  onKeywordChange,
  onSelectAsset,
  onRefresh,
  onUpload,
  onDelete,
  onDragStart,
}: AssetLibraryPanelProps) {
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  const deferredKeyword = useDeferredValue(keyword)

  const filteredAssets = assets.filter((asset) => {
    if (!deferredKeyword.trim()) {
      return true
    }

    const query = deferredKeyword.trim().toLowerCase()
    return (
      asset.name.toLowerCase().includes(query) ||
      asset.filename.toLowerCase().includes(query) ||
      asset.format.toLowerCase().includes(query)
    )
  })

  const rowCount = Math.ceil(filteredAssets.length / 2)
  const visibleStartRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN_ROWS)
  const visibleEndRow = Math.max(
    visibleStartRow,
    Math.min(
      rowCount - 1,
      Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN_ROWS
    )
  )
  const startIndex = visibleStartRow * 2
  const endIndex = Math.min(filteredAssets.length, (visibleEndRow + 1) * 2)
  const visibleAssets = filteredAssets.slice(startIndex, endIndex)
  const totalHeight = Math.max(0, rowCount * ROW_HEIGHT - GRID_GAP)
  const topOffset = visibleStartRow * ROW_HEIGHT

  const prioritizedAssets = visibleAssets.slice().sort((left, right) => {
    if (left.id === selectedAssetId) {
      return -1
    }
    if (right.id === selectedAssetId) {
      return 1
    }
    return 0
  })
  const previewIds = new Set(
    prioritizedAssets.slice(0, MAX_ACTIVE_PREVIEWS).map((asset) => asset.id)
  )

  useEffect(() => {
    const node = viewportRef.current
    if (!node) {
      return
    }

    const updateViewportHeight = () => {
      setViewportHeight(node.clientHeight)
    }

    updateViewportHeight()
    const observer = new ResizeObserver(() => {
      updateViewportHeight()
    })
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  async function handleUploadChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      await onUpload(file)
    } finally {
      event.target.value = ""
    }
  }

  async function handleDelete(event: MouseEvent<HTMLButtonElement>, asset: ModelAsset) {
    event.stopPropagation()

    const confirmed = window.confirm(`确认删除模型 "${asset.filename}" 吗？`)
    if (!confirmed) {
      return
    }

    await onDelete(asset)
  }

  return (
    <section className="flex h-full w-[320px] min-w-[320px] flex-col overflow-hidden rounded-sm border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-3 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-slate-900">模型资产</span>
          <span className="text-xs text-slate-500">{assets.length}</span>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="搜索模型"
            className="h-9 rounded-sm border-slate-200 bg-white pl-9 text-slate-900"
          />
        </div>

        <input
          ref={uploadInputRef}
          type="file"
          accept=".glb,.gltf"
          className="hidden"
          onChange={handleUploadChange}
        />

        <div className="mt-3 flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-sm border-slate-200"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            刷新
          </Button>

          <Button
            type="button"
            size="sm"
            className="h-8 rounded-sm bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => uploadInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
            上传
          </Button>
        </div>

        {notice ? <p className="mt-3 text-xs text-slate-500">{notice}</p> : null}
      </div>

      <div
        ref={viewportRef}
        className="min-h-0 flex-1 overflow-y-auto"
        onScroll={(event) => {
          setScrollTop(event.currentTarget.scrollTop)
        }}
      >
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2 p-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-[214px] animate-pulse rounded-sm border border-slate-200 bg-slate-100" />
            ))}
          </div>
        ) : null}

        {!isLoading && !filteredAssets.length ? (
          <div className="px-2 py-2">
            <div className="flex h-48 flex-col items-center justify-center rounded-sm border border-dashed border-slate-200 bg-slate-50 text-center">
              <Box className="mb-3 size-7 text-slate-300" />
              <p className="text-sm text-slate-600">未找到模型</p>
            </div>
          </div>
        ) : null}

        {!isLoading && filteredAssets.length ? (
          <div style={{ height: totalHeight }} className="relative">
            <div
              className="grid grid-cols-2 gap-2 px-2 py-2"
              style={{ position: "absolute", insetInline: 0, top: topOffset }}
            >
              {visibleAssets.map((asset) => {
                const isSelected = asset.id === selectedAssetId
                const isDeleting = deletingId === asset.id
                const shouldRenderPreview = previewIds.has(asset.id)

                return (
                  <div
                    key={asset.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.effectAllowed = "copy"
                      event.dataTransfer.setData("text/plain", asset.id)
                      onDragStart(asset.id)
                    }}
                    onClick={() => onSelectAsset(asset.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        onSelectAsset(asset.id)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className={`flex h-[214px] flex-col overflow-hidden rounded-sm border text-left transition ${
                      isSelected
                        ? "border-slate-900 bg-white"
                        : "border-slate-200 bg-white hover:border-slate-400"
                    }`}
                  >
                    <div className="relative h-[104px] border-b border-slate-200 bg-slate-50">
                      {shouldRenderPreview ? (
                        <ModelAssetCardPreview asset={asset} />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-400">
                          <Box className="size-5" />
                          <span className="text-[11px]">预览待加载</span>
                        </div>
                      )}

                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        <div className="border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] text-slate-600">
                          {asset.format.toUpperCase()}
                        </div>
                        <button
                          type="button"
                          className="flex size-6 items-center justify-center border border-slate-200 bg-white text-slate-500 hover:text-rose-500"
                          disabled={isDeleting}
                          onClick={(event) => {
                            void handleDelete(event, asset)
                          }}
                        >
                          {isDeleting ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col p-2">
                      <p className="truncate text-xs font-medium text-slate-900">{asset.filename}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">
                        {asset.name}
                      </p>
                      <div className="mt-auto flex items-center justify-between pt-2 text-[10px] text-slate-400">
                        <span>{asset.size_label}</span>
                        <span>拖拽</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
