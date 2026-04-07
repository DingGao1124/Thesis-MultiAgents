import { Suspense, useDeferredValue, useEffect, useRef, useState } from "react"
import { Link } from "react-router"
import { Canvas } from "@react-three/fiber"
import {
  Bounds,
  Center,
  Clone,
  Environment,
  Html,
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
} from "@react-three/drei"
import {
  ArrowLeft,
  Box,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react"

import { deleteModelAsset, listModelAssets, uploadModelAsset, type ModelAsset } from "@/api/assets"
import FloatingDockNav from "@/components/layout/FloatingDockNav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

function formatUpdatedTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
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

function AssetModel({ url }: { url: string }) {
  const gltf = useGLTF(url)

  return (
    <Bounds fit clip observe margin={1.12}>
      <Center>
        <Clone object={gltf.scene} />
      </Center>
    </Bounds>
  )
}

function PreviewFallback({ compact = false }: { compact?: boolean }) {
  return (
    <Html center>
      <div
        style={{ writingMode: "horizontal-tb" }}
        className={`whitespace-nowrap rounded-full border border-slate-200 bg-white/94 text-slate-600 shadow-sm ${
          compact ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-xs"
        }`}
      >
        正在加载模型...
      </div>
    </Html>
  )
}

function AssetCardPreview({ asset }: { asset: ModelAsset }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.25]}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [4.5, 3.2, 4.8], fov: 34 }}
    >
      <color attach="background" args={["#eef4f6"]} />
      <ambientLight intensity={1} />
      <directionalLight position={[5, 6, 4]} intensity={1.35} />
      <directionalLight position={[-4, 3, -3]} intensity={0.35} />
      <gridHelper args={[12, 12, "#d3dde2", "#e5ecef"]} position={[0, -0.8, 0]} />
      <Suspense fallback={<PreviewFallback compact />}>
        <AssetModel url={asset.url} />
        <Environment preset="warehouse" />
      </Suspense>
    </Canvas>
  )
}

function AssetViewer({ asset, viewerKey }: { asset: ModelAsset | null; viewerKey: number }) {
  if (!asset) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        请选择模型查看详细信息
      </div>
    )
  }

  return (
    <Canvas
      key={viewerKey}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [6, 4, 6], fov: 36 }}
    >
      <color attach="background" args={["#edf3f5"]} />
      <ambientLight intensity={1.05} />
      <directionalLight position={[6, 8, 4]} intensity={1.45} />
      <directionalLight position={[-5, 4, -4]} intensity={0.45} />
      <gridHelper args={[22, 22, "#c9d5db", "#dde7eb"]} position={[0, -1.1, 0]} />
      <Suspense fallback={<PreviewFallback />}>
        <AssetModel url={asset.url} />
        <Environment preset="warehouse" />
      </Suspense>
      <OrbitControls makeDefault enableDamping />
    </Canvas>
  )
}

export default function ModelAssetsPage() {
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const previewRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const [assets, setAssets] = useState<ModelAsset[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [keyword, setKeyword] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [notice, setNotice] = useState("")
  const [viewerKey, setViewerKey] = useState(0)
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set())

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

  const selectedAsset =
    filteredAssets.find((asset) => asset.id === selectedId) ??
    assets.find((asset) => asset.id === selectedId) ??
    filteredAssets[0] ??
    assets[0] ??
    null

  const selectedIndex = filteredAssets.findIndex((asset) => asset.id === selectedAsset?.id)
  const totalSizeBytes = assets.reduce((sum, asset) => sum + asset.size_bytes, 0)
  const totalSizeLabel = `${(totalSizeBytes / 1024 / 1024).toFixed(1)} MB`

  useEffect(() => {
    void loadAssets()
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    if (!selectedAsset) {
      setSelectedId(null)
      return
    }

    if (selectedAsset.id !== selectedId) {
      setSelectedId(selectedAsset.id)
    }
  }, [selectedAsset, selectedId])

  useEffect(() => {
    const root = scrollViewportRef.current
    if (!root) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIds((previous) => {
          const next = new Set(previous)
          entries.forEach((entry) => {
            const target = entry.target as HTMLElement
            const assetId = target.dataset.assetId
            if (!assetId) {
              return
            }

            if (entry.isIntersecting) {
              next.add(assetId)
            } else {
              next.delete(assetId)
            }
          })
          return next
        })
      },
      {
        root,
        rootMargin: "120px 0px",
        threshold: 0.01,
      }
    )

    filteredAssets.forEach((asset) => {
      const node = previewRefs.current[asset.id]
      if (node) {
        observer.observe(node)
      }
    })

    return () => observer.disconnect()
  }, [filteredAssets])

  async function loadAssets(options?: { keepSelection?: boolean }) {
    setIsLoading(true)

    try {
      const response = await listModelAssets()
      setAssets(response.items)

      if (!options?.keepSelection) {
        setSelectedId(response.items[0]?.id ?? null)
      }

      if (!response.items.length) {
        setNotice("当前暂无可展示的模型资产。")
      } else if (!options?.keepSelection) {
        setNotice("")
      }
    } catch {
      setNotice("模型资产加载失败。")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    setIsUploading(true)
    setNotice("")

    try {
      const response = await uploadModelAsset(file)
      await loadAssets({ keepSelection: true })
      setSelectedId(response.item.id)
      setViewerKey((value) => value + 1)
      setNotice(`已完成资产入库：${response.item.filename}`)
    } catch (error: any) {
      const message = error?.response?.data?.detail ?? "模型上传失败。"
      setNotice(message)
    } finally {
      event.target.value = ""
      setIsUploading(false)
    }
  }

  async function handleDelete(asset: ModelAsset) {
    const confirmed = window.confirm(`确认删除模型 "${asset.filename}" 吗？`)
    if (!confirmed) {
      return
    }

    setDeletingId(asset.id)
    setNotice("")

    try {
      await deleteModelAsset(asset.filename)
      await loadAssets()
      setViewerKey((value) => value + 1)
      setNotice(`已删除资产：${asset.filename}`)
    } catch (error: any) {
      const message = error?.response?.data?.detail ?? "模型删除失败。"
      setNotice(message)
    } finally {
      setDeletingId(null)
    }
  }

  function selectPrevAsset() {
    if (selectedIndex <= 0) {
      return
    }
    setSelectedId(filteredAssets[selectedIndex - 1].id)
    setViewerKey((value) => value + 1)
  }

  function selectNextAsset() {
    if (selectedIndex < 0 || selectedIndex >= filteredAssets.length - 1) {
      return
    }
    setSelectedId(filteredAssets[selectedIndex + 1].id)
    setViewerKey((value) => value + 1)
  }

  return (
    <main className="h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#f2f6f8_100%)] text-slate-950">
      <FloatingDockNav />

      <div className="mx-auto flex h-screen w-full max-w-[1880px] flex-col px-8 py-4 lg:px-12 lg:py-5">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center overflow-hidden rounded-2xl bg-white/85 shadow-sm">
              <img src="/Agent.svg" alt="Agent" className="size-6 object-contain" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-950">
                LLM-Multi-Agents for Digital Twin Production Line
              </p>
              <p className="text-sm text-slate-500">3D Asset Management Center</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-slate-600">
              Asset Console
            </Badge>
            <Button asChild variant="outline" size="sm" className="rounded-full">
              <Link to="/">
                <ArrowLeft className="size-4" />
                返回首页
              </Link>
            </Button>
          </div>
        </header>

        <section className="mt-4 grid min-h-0 flex-1 gap-5 xl:grid-cols-[1.58fr_0.92fr]">
          <div className="flex min-h-0 flex-col gap-4">
            <Card className="flex min-h-0 flex-1 overflow-hidden rounded-[1.2rem] border border-slate-200/60 bg-white/68 py-0 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <CardHeader className="shrink-0 gap-4 border-b border-slate-200/70 py-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-[24px] tracking-tight">模型资产目录</CardTitle>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      统一展示产线模型、设备模型与辅助工装资产。
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      当前资产 {assets.length} 项，累计存储 {totalSizeLabel}，当前选中格式 {selectedAsset?.format ?? "--"}。
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative min-w-[260px]">
                      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={keyword}
                        onChange={(event) => setKeyword(event.target.value)}
                        placeholder="搜索模型名称或格式"
                        className="h-10 rounded-full border-slate-200/80 bg-white/80 pl-9"
                      />
                    </div>

                    <input
                      ref={uploadInputRef}
                      type="file"
                      accept=".glb,.gltf"
                      className="hidden"
                      onChange={handleUpload}
                    />

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
                  <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
                    {notice}
                  </div>
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
                            className="h-[230px] animate-pulse rounded-[1rem] border border-slate-100 bg-slate-100/80"
                          />
                        ))
                      : null}

                    {!isLoading && !filteredAssets.length ? (
                      <div className="col-span-full flex h-64 flex-col items-center justify-center rounded-[1rem] border border-dashed border-slate-200 bg-slate-50/80 text-center">
                        <Box className="mb-3 size-8 text-slate-300" />
                        <p className="text-sm font-medium text-slate-600">未找到匹配的模型资产</p>
                        <p className="mt-1 text-xs text-slate-400">请调整搜索条件后重试</p>
                      </div>
                    ) : null}

                    {!isLoading &&
                      filteredAssets.map((asset) => {
                        const isActive = asset.id === selectedAsset?.id
                        const isDeleting = deletingId === asset.id
                        const isVisible = visibleIds.has(asset.id)

                        return (
                          <div
                            key={asset.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              setSelectedId(asset.id)
                              setViewerKey((value) => value + 1)
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault()
                                setSelectedId(asset.id)
                                setViewerKey((value) => value + 1)
                              }
                            }}
                            className={`group overflow-hidden rounded-[1rem] border text-left transition-all ${
                              isActive
                                ? "border-slate-300 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                                : "border-slate-200/70 bg-white/82 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                            }`}
                          >
                            <div
                              ref={(node) => {
                                previewRefs.current[asset.id] = node
                              }}
                              data-asset-id={asset.id}
                              className="relative h-[152px] border-b border-slate-200/60 bg-[linear-gradient(180deg,#f6fafc_0%,#eef4f6_100%)]"
                            >
                              {isVisible ? <AssetCardPreview asset={asset} /> : null}
                              {!isVisible ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[11px] text-slate-500">
                                    预览待加载
                                  </div>
                                </div>
                              ) : null}
                              <div className="absolute top-3 right-3">
                                <Badge
                                  variant="outline"
                                  className="rounded-full border-white/80 bg-white/85 px-2.5 py-1 text-[10px] text-slate-600"
                                >
                                  {asset.format}
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-3 px-4 py-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <h3 className="truncate text-sm font-semibold text-slate-900">
                                    {asset.filename}
                                  </h3>
                                  <p className="mt-1 text-xs text-slate-500">{asset.size_label}</p>
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="rounded-full text-slate-400 hover:bg-slate-100 hover:text-rose-500"
                                  disabled={isDeleting}
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    void handleDelete(asset)
                                  }}
                                >
                                  {isDeleting ? (
                                    <Loader2 className="size-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="size-4" />
                                  )}
                                </Button>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-slate-400">
                                <span>{asset.name}</span>
                                <span>{formatUpdatedTime(asset.updated_at)}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex min-h-0 flex-col gap-4">
            <Card className="flex min-h-0 flex-1 overflow-hidden rounded-[1.2rem] border border-slate-200/60 bg-white/68 py-0 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
              <CardHeader className="shrink-0 gap-4 border-b border-slate-200/70 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-slate-950 px-3 py-1 text-white shadow-sm"
                    >
                      {selectedAsset?.filename ?? "未选择模型"}
                    </Badge>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      资产模型预览、属性信息与状态信息。
                    </p>
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
                      onClick={() => setViewerKey((value) => value + 1)}
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
                <div className="relative min-h-0 flex-1 overflow-hidden rounded-[1rem] border border-slate-200/70 bg-[linear-gradient(180deg,#f7fbfd_0%,#edf3f5_100%)]">
                  <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Preview</p>
                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {selectedAsset?.name ?? "等待选择资产"}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="rounded-full border-white/70 bg-white/90 px-3 py-1 text-slate-600"
                    >
                      实时预览
                    </Badge>
                  </div>

                  <AssetViewer asset={selectedAsset} viewerKey={viewerKey} />
                </div>

                <div className="shrink-0 grid gap-3 sm:grid-cols-2">
                  <Card className="gap-0 rounded-[0.95rem] border border-slate-200/65 bg-white/78 py-4 shadow-none">
                    <CardContent className="px-4">
                      <p className="text-xs text-slate-400">模型名称</p>
                      <p className="mt-2 break-all text-sm font-semibold text-slate-900">
                        {selectedAsset?.name ?? "--"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="gap-0 rounded-[0.95rem] border border-slate-200/65 bg-white/78 py-4 shadow-none">
                    <CardContent className="px-4">
                      <p className="text-xs text-slate-400">模型格式</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {selectedAsset?.format ?? "--"}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="gap-0 rounded-[0.95rem] border border-slate-200/65 bg-white/78 py-4 shadow-none">
                    <CardContent className="px-4">
                      <p className="text-xs text-slate-400">文件大小</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {selectedAsset?.size_label ?? "--"}
                      </p>
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
          </div>
        </section>
      </div>
    </main>
  )
}
