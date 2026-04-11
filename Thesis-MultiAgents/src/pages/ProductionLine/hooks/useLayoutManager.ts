import { useState, type FormEvent } from "react"

import {
  createProductionLineLayout,
  deleteProductionLineLayout,
  updateProductionLineLayout,
  type ProductionLineLayoutSummary,
} from "@/api/productionLineLayouts"
import { useProductionLineWorkspaceStore } from "@/stores/productionLineWorkspaceStore"

import { useProductionLineLayoutLibrary } from "./useProductionLineLayoutLibrary"
import type { PendingLayoutAction } from "@/utils/productionLine"
import { getConfirmDialogCopy, getErrorMessage } from "@/utils/productionLine"

export function useLayoutManager() {
  const placements = useProductionLineWorkspaceStore((state) => state.placements)
  const messages = useProductionLineWorkspaceStore((state) => state.messages)
  const statusText = useProductionLineWorkspaceStore((state) => state.statusText)
  const currentLayoutId = useProductionLineWorkspaceStore((state) => state.currentLayoutId)
  const currentLayoutName = useProductionLineWorkspaceStore((state) => state.currentLayoutName)
  const isDirty = useProductionLineWorkspaceStore((state) => state.isDirty)
  const resetWorkspace = useProductionLineWorkspaceStore((state) => state.resetWorkspace)
  const setStatusText = useProductionLineWorkspaceStore((state) => state.setStatusText)
  const markClean = useProductionLineWorkspaceStore((state) => state.markClean)
  const detachCurrentLayout = useProductionLineWorkspaceStore((state) => state.detachCurrentLayout)

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [isSavingLayout, setIsSavingLayout] = useState(false)
  const [actionAfterSave, setActionAfterSave] = useState<PendingLayoutAction | null>(null)

  const [isLayoutLibraryOpen, setIsLayoutLibraryOpen] = useState(false)
  const [deletingLayoutId, setDeletingLayoutId] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<PendingLayoutAction | null>(null)
  const confirmDialogCopy = getConfirmDialogCopy(confirmAction)

  const layoutLibrary = useProductionLineLayoutLibrary({ enabled: isLayoutLibraryOpen })

  async function persistLayout(name: string) {
    const trimmedName = name.trim()
    const payload = {
      name: trimmedName,
      placements,
      messages,
      status_text: statusText,
    }

    setIsSavingLayout(true)
    try {
      const response = currentLayoutId
        ? await updateProductionLineLayout(currentLayoutId, payload)
        : await createProductionLineLayout(payload)

      markClean({
        id: response.item.id,
        name: response.item.name,
      })

      if (isLayoutLibraryOpen) {
        void layoutLibrary.fetchLayoutLibrary()
      }

      return response.item
    } finally {
      setIsSavingLayout(false)
    }
  }

  async function executePendingAction(action: PendingLayoutAction) {
    if (action.type === "create") {
      resetWorkspace()
      return
    }

    try {
      await layoutLibrary.loadLayout(action.layoutId)
    } catch (error) {
      setStatusText(getErrorMessage(error, "布局加载失败。"))
    }
  }

  function openSaveDialog(nextAction: PendingLayoutAction | null = null) {
    setActionAfterSave(nextAction)
    setSaveName(currentLayoutName?.trim() ?? "")
    setIsSaveDialogOpen(true)
  }

  function closeSaveDialog() {
    setIsSaveDialogOpen(false)
    setActionAfterSave(null)
  }

  async function handleSaveLayoutSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = saveName.trim()
    if (!trimmedName) {
      setStatusText("请输入布局名称。")
      return
    }

    try {
      await persistLayout(trimmedName)
      setIsSaveDialogOpen(false)

      const nextAction = actionAfterSave
      setActionAfterSave(null)

      if (nextAction) {
        await executePendingAction(nextAction)
      }
    } catch (error) {
      setStatusText(getErrorMessage(error, "布局保存失败。"))
    }
  }

  function handleRequestNewLayout() {
    if (!isDirty) {
      void executePendingAction({ type: "create" })
      return
    }

    setConfirmAction({ type: "create" })
  }

  function handleRequestLoadLayout(layoutId: string) {
    setIsLayoutLibraryOpen(false)

    if (!isDirty) {
      void executePendingAction({ type: "load", layoutId })
      return
    }

    setConfirmAction({ type: "load", layoutId })
  }

  async function handleDeleteLayout(layout: ProductionLineLayoutSummary) {
    setDeletingLayoutId(layout.id)

    try {
      await deleteProductionLineLayout(layout.id)
      layoutLibrary.removeLayoutSummary(layout.id)

      if (currentLayoutId === layout.id) {
        detachCurrentLayout(layout.name)
        setStatusText(`已删除布局 ${layout.name}，当前场景保留为未保存状态。`)
      }
    } catch (error) {
      setStatusText(getErrorMessage(error, "布局删除失败。"))
    } finally {
      setDeletingLayoutId(null)
    }
  }

  function handleConfirmDiscard() {
    const nextAction = confirmAction
    setConfirmAction(null)
    if (nextAction) {
      void executePendingAction(nextAction)
    }
  }

  function handleConfirmSave() {
    const nextAction = confirmAction
    setConfirmAction(null)
    if (nextAction) {
      openSaveDialog(nextAction)
    }
  }

  return {
    currentLayoutId,
    currentLayoutName,
    isDirty,

    isSaveDialogOpen,
    saveName,
    setSaveName,
    isSavingLayout,
    openSaveDialog,
    closeSaveDialog,
    handleSaveLayoutSubmit,

    isLayoutLibraryOpen,
    setIsLayoutLibraryOpen,
    layoutKeyword: layoutLibrary.layoutKeyword,
    setLayoutKeyword: layoutLibrary.setLayoutKeyword,
    savedLayouts: layoutLibrary.savedLayouts,
    isLoadingLayouts: layoutLibrary.isLoadingLayouts,
    loadingLayoutId: layoutLibrary.loadingLayoutId,
    deletingLayoutId,
    handleDeleteLayout,
    handleRequestLoadLayout,

    confirmAction,
    confirmDialogCopy,
    setConfirmAction,
    handleRequestNewLayout,
    handleConfirmDiscard,
    handleConfirmSave,
  }
}
