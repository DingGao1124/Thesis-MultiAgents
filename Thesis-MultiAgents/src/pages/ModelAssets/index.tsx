import { useEffect, useState } from "react"
import { Link } from "react-router"
import { ArrowLeft } from "lucide-react"

import FloatingDockNav from "@/components/layout/FloatingDockNav"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useModelAssetStore } from "@/stores/modelAssetStore"

import { AssetDetailPanel } from "./components/AssetDetailPanel"
import { AssetListPanel } from "./components/AssetListPanel"

export default function ModelAssetsPage() {
  const loadAssets = useModelAssetStore((state) => state.loadAssets)
  const [viewerKey, setViewerKey] = useState(0)

  useEffect(() => {
    void loadAssets()
  }, [loadAssets])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  function bumpViewerKey() {
    setViewerKey((v) => v + 1)
  }

  return (
    <main className="h-screen overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#f2f6f8_100%)] text-slate-950">
      <FloatingDockNav />

      <div className="mx-auto flex h-screen w-full max-w-470 flex-col px-8 py-4 lg:px-12 lg:py-5">
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
            <AssetListPanel onAssetChange={bumpViewerKey} />
          </div>
          <div className="flex min-h-0 flex-col gap-4">
            <AssetDetailPanel viewerKey={viewerKey} onAssetChange={bumpViewerKey} />
          </div>
        </section>
      </div>
    </main>
  )
}
