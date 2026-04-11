import { useEffect, useState } from "react"
import { Factory, Loader2, RefreshCw, X } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import SceneWorkspacePanel from "@/components/production-line/SceneWorkspacePanel"
import { useProductionLineLayoutLibrary } from "@/hooks/useProductionLineLayoutLibrary"
import { useProductionLineWorkspaceStore } from "@/stores/productionLineWorkspaceStore"

type RealtimeProductionLinePanelProps = {
  open: boolean
  isChatOpen: boolean
  onOpenChange: (open: boolean) => void
}

function getLayoutStatusLabel(currentLayoutId: string | null, isDirty: boolean) {
  if (!currentLayoutId) {
    return "空白场景"
  }

  return isDirty ? "当前会话未保存" : "已加载布局"
}

export default function RealtimeProductionLinePanel({
  open,
  isChatOpen,
  onOpenChange,
}: RealtimeProductionLinePanelProps) {
  const placements = useProductionLineWorkspaceStore((state) => state.placements)
  const selectedPlacementId = useProductionLineWorkspaceStore((state) => state.selectedPlacementId)
  const currentLayoutId = useProductionLineWorkspaceStore((state) => state.currentLayoutId)
  const currentLayoutName = useProductionLineWorkspaceStore((state) => state.currentLayoutName)
  const isDirty = useProductionLineWorkspaceStore((state) => state.isDirty)
  const statusText = useProductionLineWorkspaceStore((state) => state.statusText)
  const ensureInitialized = useProductionLineWorkspaceStore((state) => state.ensureInitialized)
  const setSelectedPlacementId = useProductionLineWorkspaceStore((state) => state.setSelectedPlacementId)

  const [pendingLayoutId, setPendingLayoutId] = useState<string | null>(null)
  const [isSceneReady, setIsSceneReady] = useState(false)
  const layoutLibrary = useProductionLineLayoutLibrary({ enabled: open })

  function emitResize() {
    window.dispatchEvent(new Event("resize"))
  }

  useEffect(() => {
    if (!open) {
      return
    }

    ensureInitialized()
  }, [ensureInitialized, open])

  useEffect(() => {
    if (!open) {
      setIsSceneReady(false)
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      emitResize()
    })

    const delayedResize = window.setTimeout(() => {
      emitResize()
    }, 320)

    const revealScene = window.setTimeout(() => {
      emitResize()
      setIsSceneReady(true)
    }, 380)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(delayedResize)
      window.clearTimeout(revealScene)
    }
  }, [open, isChatOpen])

  useEffect(() => {
    if (!open) {
      return
    }

    if (layoutLibrary.loadingLayoutId) {
      setIsSceneReady(false)
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      emitResize()
    })

    const revealScene = window.setTimeout(() => {
      emitResize()
      setIsSceneReady(true)
    }, 120)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(revealScene)
    }
  }, [open, layoutLibrary.loadingLayoutId])

  const selectValue =
    currentLayoutId && layoutLibrary.savedLayouts.some((item) => item.id === currentLayoutId)
      ? currentLayoutId
      : undefined

  async function handleLoadLayout(layoutId: string) {
    if (!layoutId || layoutId === currentLayoutId) {
      return
    }

    if (isDirty) {
      setPendingLayoutId(layoutId)
      return
    }

    await layoutLibrary.loadLayout(layoutId)
  }

  async function handleConfirmReplace() {
    if (!pendingLayoutId) {
      return
    }

    try {
      await layoutLibrary.loadLayout(pendingLayoutId)
    } finally {
      setPendingLayoutId(null)
    }
  }

  const shouldShowSceneLoading = open && (!isSceneReady || Boolean(layoutLibrary.loadingLayoutId))

  return (
    <>
      <div
        className={`pointer-events-none absolute left-4 top-4 bottom-4 z-20 w-[38rem] ${
          isChatOpen ? "max-w-[calc(100vw-26rem)]" : "max-w-[calc(100vw-2rem)]"
        }`}
      >
        <div
          className={`flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white/92 shadow-xl backdrop-blur-sm transition-all duration-300 ease-out ${
            open
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-3 scale-95 opacity-0"
          }`}
        >
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Factory className="size-4 text-sky-600" />
                  <span>3D 产线实时状态</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                    {currentLayoutName?.trim() || "未加载布局"}
                  </span>
                  <span>{getLayoutStatusLabel(currentLayoutId, isDirty)}</span>
                  <span>{statusText}</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="h-8 w-8 rounded-full border-slate-200 bg-white text-slate-600 shadow-none"
                onClick={() => onOpenChange(false)}
                aria-label="Close 3D production-line realtime status"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Select value={selectValue} onValueChange={(value) => void handleLoadLayout(value)}>
                <SelectTrigger className="h-9 min-w-0 flex-1 border-slate-200 bg-white text-sm shadow-none">
                  <SelectValue
                    placeholder={
                      layoutLibrary.isLoadingLayouts
                        ? "加载布局列表中..."
                        : layoutLibrary.savedLayouts.length
                          ? "选择已保存布局"
                          : "暂无已保存布局"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {layoutLibrary.savedLayouts.map((layout) => (
                    <SelectItem key={layout.id} value={layout.id}>
                      {layout.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="h-9 w-9 rounded-full border-slate-200 bg-white text-slate-600 shadow-none"
                onClick={() => {
                  void layoutLibrary.fetchLayoutLibrary("")
                }}
                disabled={layoutLibrary.isLoadingLayouts}
                aria-label="Refresh saved layouts"
              >
                {layoutLibrary.isLoadingLayouts ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="relative h-full w-full p-2">
            <SceneWorkspacePanel
              placements={placements}
              selectedPlacementId={selectedPlacementId}
              onSelectPlacement={setSelectedPlacementId}
              readOnly
              className={`h-full w-full rounded-2xl transition-opacity duration-200 ${
                shouldShowSceneLoading ? "opacity-0" : "opacity-100"
              }`}
            />

            {shouldShowSceneLoading ? (
              <div className="absolute inset-2 flex items-center justify-center rounded-2xl border border-slate-200 bg-white/96">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <Loader2 className="size-6 animate-spin text-sky-600" />
                  <div className="text-sm font-medium text-slate-700">加载三维场景中...</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <AlertDialog
        open={Boolean(pendingLayoutId)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setPendingLayoutId(null)
          }
        }}
      >
        <AlertDialogContent size="sm" className="rounded-xl border-slate-200 p-4">
          <AlertDialogHeader className="place-items-start text-left">
            <AlertDialogTitle>加载新布局</AlertDialogTitle>
            <AlertDialogDescription className="text-sm leading-6">
              当前共享工作区存在未保存修改，继续加载会覆盖当前场景内容。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="sm:justify-end">
            <AlertDialogCancel className="rounded-full border-slate-200 shadow-none">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
              onClick={() => {
                void handleConfirmReplace()
              }}
            >
              继续加载
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
