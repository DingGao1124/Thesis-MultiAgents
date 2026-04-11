import { useEffect, useState, type FormEvent } from "react"
import * as THREE from "three"

import type { ModelAsset } from "@/api/assets"
import SceneWorkspacePanel from "@/components/production-line/SceneWorkspacePanel"
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
import FloatingDockNav from "@/components/layout/FloatingDockNav"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useModelAssetStore } from "@/stores/modelAssetStore"
import { useProductionLineWorkspaceStore } from "@/stores/productionLineWorkspaceStore"
import AgentChatPanel from "./components/AgentChatPanel"
import AssetLibraryPanel from "./components/AssetLibraryPanel"
import LayoutLibraryDialog from "./components/LayoutLibraryDialog"
import { useLayoutManager } from "./hooks/useLayoutManager"
import type { DropPoint, ScenePlacement } from "@/utils/productionLine"
import {
  parseCoordinates,
  parseRotation,
  parseScale,
  resolveAssetFromText,
} from "@/utils/productionLine"

export default function ProductionLinePage() {
  const assets = useModelAssetStore((state) => state.assets)
  const keyword = useModelAssetStore((state) => state.keyword)
  const selectedAssetId = useModelAssetStore((state) => state.selectedId)
  const isLoadingAssets = useModelAssetStore((state) => state.isLoading)
  const isUploading = useModelAssetStore((state) => state.isUploading)
  const deletingId = useModelAssetStore((state) => state.deletingId)
  const notice = useModelAssetStore((state) => state.notice)
  const loadAssets = useModelAssetStore((state) => state.loadAssets)
  const uploadAsset = useModelAssetStore((state) => state.uploadAsset)
  const deleteAsset = useModelAssetStore((state) => state.deleteAsset)
  const setKeyword = useModelAssetStore((state) => state.setKeyword)
  const setSelectedId = useModelAssetStore((state) => state.setSelectedId)

  const [chatInput, setChatInput] = useState("")
  const placements = useProductionLineWorkspaceStore((state) => state.placements)
  const selectedPlacementId = useProductionLineWorkspaceStore((state) => state.selectedPlacementId)
  const draggedAssetId = useProductionLineWorkspaceStore((state) => state.draggedAssetId)
  const messages = useProductionLineWorkspaceStore((state) => state.messages)
  const statusText = useProductionLineWorkspaceStore((state) => state.statusText)
  const ensureInitialized = useProductionLineWorkspaceStore((state) => state.ensureInitialized)
  const appendPlacement = useProductionLineWorkspaceStore((state) => state.appendPlacement)
  const updatePlacement = useProductionLineWorkspaceStore((state) => state.updatePlacement)
  const removePlacement = useProductionLineWorkspaceStore((state) => state.removePlacement)
  const removePlacementsByAssetId = useProductionLineWorkspaceStore((state) => state.removePlacementsByAssetId)
  const clearPlacements = useProductionLineWorkspaceStore((state) => state.clearPlacements)
  const setSelectedPlacementId = useProductionLineWorkspaceStore((state) => state.setSelectedPlacementId)
  const setDraggedAssetId = useProductionLineWorkspaceStore((state) => state.setDraggedAssetId)
  const pushMessage = useProductionLineWorkspaceStore((state) => state.pushMessage)
  const setStatusText = useProductionLineWorkspaceStore((state) => state.setStatusText)
  const layout = useLayoutManager()

  const draggedAsset = assets.find((asset) => asset.id === draggedAssetId) ?? null

  useEffect(() => {
    ensureInitialized()
  }, [ensureInitialized])

  useEffect(() => {
    void loadAssets()
  }, [loadAssets])

  useEffect(() => {
    if (notice) {
      setStatusText(notice)
    }
  }, [notice, setStatusText])

  useEffect(() => {
    if (!draggedAssetId) {
      return
    }

    const exists = assets.some((asset) => asset.id === draggedAssetId)
    if (!exists) {
      setDraggedAssetId(null)
    }
  }, [assets, draggedAssetId, setDraggedAssetId])

  function handleRemovePlacement(placementId: string) {
    const removed = removePlacement(placementId)
    if (!removed) {
      return
    }

    setStatusText(`${removed.assetFilename} 已从场景移除。`)
    pushMessage("assistant", `${removed.assetFilename} 已从场景移除。`)
  }

  function handleUpdatePlacement(
    placementId: string,
    patch: Partial<Pick<ScenePlacement, "position" | "rotation" | "scale">>
  ) {
    updatePlacement(placementId, patch)
  }

  function clearScene() {
    clearPlacements()
    setStatusText("场景已清空。")
    pushMessage("assistant", "场景已清空。")
  }

  function handleAppendPlacement(
    asset: ModelAsset,
    source: "manual" | "agent",
    point?: DropPoint | null,
    rotationY = 0,
    scale = 1
  ) {
    return appendPlacement(asset, source, point, rotationY, scale)
  }

  async function handleUploadAsset(file: File) {
    const item = await uploadAsset(file)
    setStatusText(`已上传 ${item.filename}。`)
  }

  async function handleDeleteAsset(asset: ModelAsset) {
    await deleteAsset(asset.filename)
    removePlacementsByAssetId(asset.id)
    setStatusText(`已删除 ${asset.filename}。`)
  }

  function handleDropAsset(point: DropPoint | null) {
    if (!draggedAsset) {
      return
    }

    const placement = handleAppendPlacement(draggedAsset, "manual", point)
    setDraggedAssetId(null)
    setStatusText(`已放置 ${placement.assetFilename}。`)
    pushMessage(
      "assistant",
      `${placement.assetFilename} 已放置在 (${placement.position.join(", ")})。`
    )
  }

  function handleAgentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = chatInput.trim()
    if (!content) {
      return
    }

    pushMessage("user", content)
    setChatInput("")

    if (/清空|clear/i.test(content)) {
      clearScene()
      return
    }

    if (/删除|移除|remove|delete/i.test(content)) {
      const asset = resolveAssetFromText(content, assets)
      const target = asset
        ? [...placements].reverse().find((item) => item.assetId === asset.id) ?? null
        : null

      if (!target) {
        setStatusText("未找到可删除的模型实例。")
        pushMessage("assistant", "未找到可删除的模型实例。")
        return
      }

      handleRemovePlacement(target.id)
      return
    }

    const asset = resolveAssetFromText(content, assets)
    if (!asset) {
      setStatusText("未匹配到模型资产。")
      pushMessage("assistant", "未匹配到模型资产。")
      return
    }

    const coordinates = parseCoordinates(content)
    const rotationY = THREE.MathUtils.degToRad(parseRotation(content))
    const scale = parseScale(content)

    const placement = handleAppendPlacement(
      asset,
      "agent",
      coordinates
        ? {
            x: coordinates.x,
            y: coordinates.y,
            z: coordinates.z,
          }
        : null,
      rotationY,
      scale
    )

    setStatusText(`已放置 ${placement.assetFilename}。`)
    pushMessage(
      "assistant",
      `${placement.assetFilename} 已放置在 (${placement.position[0]}, ${placement.position[1]}, ${placement.position[2]})。`
    )
  }

  return (
    <>
      <main className="h-screen overflow-hidden bg-slate-100 p-1 text-slate-950">
        <FloatingDockNav />
        <div className="flex h-full gap-1">
          <AssetLibraryPanel
            assets={assets}
            isLoading={isLoadingAssets}
            isUploading={isUploading}
            deletingId={deletingId}
            keyword={keyword}
            notice={notice}
            selectedAssetId={selectedAssetId}
            onKeywordChange={setKeyword}
            onSelectAsset={setSelectedId}
            onRefresh={() => {
              void loadAssets({ keepSelection: true })
            }}
            onUpload={handleUploadAsset}
            onDelete={handleDeleteAsset}
            onDragStart={(assetId) => {
              setSelectedId(assetId)
              setDraggedAssetId(assetId)
            }}
          />

          <SceneWorkspacePanel
            placements={placements}
            selectedPlacementId={selectedPlacementId}
            draggedAssetName={draggedAsset?.filename ?? null}
            onSelectPlacement={setSelectedPlacementId}
            onDropAsset={handleDropAsset}
            onUpdatePlacement={handleUpdatePlacement}
            onRemovePlacement={handleRemovePlacement}
          />

          <AgentChatPanel
            messages={messages}
            input={chatInput}
            statusText={statusText}
            currentLayoutName={layout.currentLayoutName}
            currentLayoutId={layout.currentLayoutId}
            isDirty={layout.isDirty}
            onInputChange={setChatInput}
            onSubmit={handleAgentSubmit}
            onNewLayout={layout.handleRequestNewLayout}
            onSaveLayout={() => layout.openSaveDialog(null)}
            onOpenLayoutLibrary={() => layout.setIsLayoutLibraryOpen(true)}
          />
        </div>
      </main>

      <Dialog
        open={layout.confirmAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            layout.setConfirmAction(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{layout.confirmDialogCopy.title}</DialogTitle>
            <DialogDescription>{layout.confirmDialogCopy.description}</DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => layout.setConfirmAction(null)}
            >
              取消
            </Button>

            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={layout.handleConfirmDiscard}
              >
                {layout.confirmDialogCopy.discardLabel}
              </Button>

              <Button
                type="button"
                onClick={layout.handleConfirmSave}
              >
                {layout.confirmDialogCopy.saveLabel}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={layout.isSaveDialogOpen} onOpenChange={(open) => (open ? undefined : layout.closeSaveDialog())}>
        <DialogContent className="max-w-md">
          <form onSubmit={layout.handleSaveLayoutSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>保存布局</DialogTitle>
              <DialogDescription>
                {layout.currentLayoutId ? "保存后将覆盖当前布局记录。" : "保存当前布局和会话为新的布局记录。"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900" htmlFor="layout-name">
                布局名称
              </label>
              <Input
                id="layout-name"
                value={layout.saveName}
                onChange={(event) => layout.setSaveName(event.target.value)}
                placeholder="请输入布局名称"
                className="border-slate-200 shadow-none"
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={layout.closeSaveDialog}>
                取消
              </Button>
              <Button type="submit" disabled={layout.isSavingLayout || !layout.saveName.trim()}>
                {layout.isSavingLayout ? "保存中" : "保存布局"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={layout.pendingDeleteLayout !== null}
        onOpenChange={(open) => {
          if (!open) {
            layout.closeDeleteLayoutDialog()
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除布局</AlertDialogTitle>
            <AlertDialogDescription>
              {layout.pendingDeleteLayout
                ? `删除后将无法恢复，确定删除布局“${layout.pendingDeleteLayout.name}”吗？`
                : "删除后将无法恢复，确定继续吗？"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(layout.deletingLayoutId)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={Boolean(layout.deletingLayoutId)}
              onClick={() => {
                void layout.confirmDeleteLayout()
              }}
            >
              {layout.deletingLayoutId ? "删除中" : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LayoutLibraryDialog
        open={layout.isLayoutLibraryOpen}
        keyword={layout.layoutKeyword}
        layouts={layout.savedLayouts}
        isLoading={layout.isLoadingLayouts}
        deletingLayoutId={layout.deletingLayoutId}
        loadingLayoutId={layout.loadingLayoutId}
        currentLayoutId={layout.currentLayoutId}
        onOpenChange={layout.setIsLayoutLibraryOpen}
        onKeywordChange={layout.setLayoutKeyword}
        onLoad={layout.handleRequestLoadLayout}
        onDelete={layout.requestDeleteLayout}
      />
    </>
  )
}
