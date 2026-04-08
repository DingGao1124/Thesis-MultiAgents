import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [pendingDeleteAsset, setPendingDeleteAsset] = useState<ModelAsset | null>(null)
  const [fullyVisibleIds, setFullyVisibleIds] = useState<Set<string>>(new Set())

  const deferredKeyword = useDeferredValue(keyword)

  const filteredAssets = useMemo(
    () =>
      assets.filter((asset) => {
        if (!deferredKeyword.trim()) {
          return true
        }

        const query = deferredKeyword.trim().toLowerCase()
        return (
          asset.name.toLowerCase().includes(query) ||
          asset.filename.toLowerCase().includes(query) ||
          asset.format.toLowerCase().includes(query)
        )
      }),
    [assets, deferredKeyword]
  )

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

  const visibleAssets = useMemo(
    () => filteredAssets.slice(startIndex, endIndex),
    [filteredAssets, startIndex, endIndex]
  )
  const totalHeight = Math.max(0, rowCount * ROW_HEIGHT - GRID_GAP)
  const topOffset = visibleStartRow * ROW_HEIGHT
  const visibleAssetIdsKey = visibleAssets.map((asset) => asset.id).join("|")

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

  useEffect(() => {
    const root = viewportRef.current
    if (!root || !visibleAssets.length) {
      setFullyVisibleIds((current) => (current.size ? new Set() : current))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setFullyVisibleIds((current) => {
          const next = new Set(current)

          entries.forEach((entry) => {
            const assetId = (entry.target as HTMLElement).dataset.assetId
            if (!assetId) {
              return
            }

            if (entry.isIntersecting && entry.intersectionRatio >= 0.999) {
              next.add(assetId)
            } else {
              next.delete(assetId)
            }
          })

          return areSetsEqual(current, next) ? current : next
        })
      },
      {
        root,
        rootMargin: "0px",
        threshold: [1],
      }
    )

    visibleAssets.forEach((asset) => {
      const node = cardRefs.current[asset.id]
      if (node) {
        observer.observe(node)
      }
    })

    return () => observer.disconnect()
  }, [visibleAssetIdsKey, visibleAssets])

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

  async function confirmDeleteAsset() {
    if (!pendingDeleteAsset) {
      return
    }

    try {
      await onDelete(pendingDeleteAsset)
    } finally {
      setPendingDeleteAsset(null)
    }
  }

  return (
    <>
      <section className="flex h-full w-[360px] min-w-[360px] flex-col overflow-hidden rounded-sm border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-slate-900">模型资产</div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">{assets.length}</span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-slate-200 px-3 text-slate-700 shadow-none"
                onClick={onRefresh}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="size-3.5" />
                )}
                刷新
              </Button>

              <Button
                type="button"
                size="sm"
                className="h-8 rounded-full bg-slate-950 px-3 text-white hover:bg-slate-800"
                onClick={() => uploadInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                上传
              </Button>
            </div>
          </div>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder="搜索模型"
              className="h-9 rounded-full border-slate-200 bg-white pl-9 text-slate-900 shadow-none"
            />
          </div>

          <input
            ref={uploadInputRef}
            type="file"
            accept=".glb,.gltf"
            className="hidden"
            onChange={handleUploadChange}
          />

          {notice ? <p className="mt-2 text-xs text-slate-500">{notice}</p> : null}
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
                <div
                  key={index}
                  className="h-[214px] animate-pulse rounded-sm border border-slate-200 bg-slate-100"
                />
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
                  const shouldRenderPreview = fullyVisibleIds.has(asset.id)

                  return (
                    <div
                      key={asset.id}
                      ref={(node) => {
                        cardRefs.current[asset.id] = node
                      }}
                      data-asset-id={asset.id}
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
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[linear-gradient(180deg,#f7fbfd_0%,#edf4f7_100%)] text-slate-400">
                            <Box className="size-5 text-slate-300" />
                            <span className="text-[11px] text-slate-500">完整进入视口后渲染</span>
                          </div>
                        )}

                        <div className="absolute top-2 right-2 flex items-center gap-1">
                          <div className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600">
                            {asset.format.toUpperCase()}
                          </div>

                          <button
                            type="button"
                            className="flex size-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:text-rose-500"
                            disabled={isDeleting}
                            onClick={(event) => {
                              event.stopPropagation()
                              setPendingDeleteAsset(asset)
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

      <AlertDialog
        open={Boolean(pendingDeleteAsset)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDeleteAsset(null)
          }
        }}
      >
        <AlertDialogContent size="sm" className="rounded-xl border-slate-200">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle className="text-base">确认删除模型</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-6">
              {pendingDeleteAsset
                ? `删除后将从资产列表中移除 ${pendingDeleteAsset.filename}。`
                : "删除后将从资产列表中移除当前模型。"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="sm:justify-end">
            <AlertDialogCancel className="rounded-full border-slate-200 shadow-none">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="rounded-full"
              onClick={() => {
                void confirmDeleteAsset()
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
