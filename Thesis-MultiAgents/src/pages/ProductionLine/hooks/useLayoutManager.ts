import { useEffect, useState, type FormEvent } from "react"

import {
  createProductionLineLayout,
  deleteProductionLineLayout,
  getProductionLineLayout,
  listProductionLineLayouts,
  updateProductionLineLayout,
  type ProductionLineLayoutSummary,
} from "@/api/productionLineLayouts"

import type { ChatMessage, PendingLayoutAction, ScenePlacement } from "../types"
import { DEFAULT_STATUS_TEXT, getConfirmDialogCopy, getErrorMessage } from "../utils"

type LayoutManagerDeps = {
  placements: ScenePlacement[]
  messages: ChatMessage[]
  statusText: string
  onResetScene: () => void
  onLoadScene: (placements: ScenePlacement[], messages: ChatMessage[], statusText: string) => void
  onStatusChange: (text: string) => void
}

export function useLayoutManager(deps: LayoutManagerDeps) {
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null)
  const [currentLayoutName, setCurrentLayoutName] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [saveName, setSaveName] = useState("")
  const [isSavingLayout, setIsSavingLayout] = useState(false)
  const [actionAfterSave, setActionAfterSave] = useState<PendingLayoutAction | null>(null)

  const [isLayoutLibraryOpen, setIsLayoutLibraryOpen] = useState(false)
  const [layoutKeyword, setLayoutKeyword] = useState("")
  const [savedLayouts, setSavedLayouts] = useState<ProductionLineLayoutSummary[]>([])
  const [isLoadingLayouts, setIsLoadingLayouts] = useState(false)
  const [loadingLayoutId, setLoadingLayoutId] = useState<string | null>(null)
  const [deletingLayoutId, setDeletingLayoutId] = useState<string | null>(null)

  const [confirmAction, setConfirmAction] = useState<PendingLayoutAction | null>(null)
  const confirmDialogCopy = getConfirmDialogCopy(confirmAction)

  useEffect(() => {
    if (!isLayoutLibraryOpen) {
      return
    }

    const timer = window.setTimeout(() => {
      void fetchLayoutLibrary(layoutKeyword)
    }, 200)

    return () => {
      window.clearTimeout(timer)
    }
  }, [isLayoutLibraryOpen, layoutKeyword])

  async function fetchLayoutLibrary(keywordValue: string) {
    setIsLoadingLayouts(true)

    try {
      const response = await listProductionLineLayouts(keywordValue)
      setSavedLayouts(response.items)
    } catch (error) {
      deps.onStatusChange(getErrorMessage(error, "布局列表加载失败。"))
    } finally {
      setIsLoadingLayouts(false)
    }
  }

  async function persistLayout(name: string) {
    const trimmedName = name.trim()
    const payload = {
      name: trimmedName,
      placements: deps.placements,
      messages: deps.messages,
      status_text: deps.statusText,
    }

    setIsSavingLayout(true)
    try {
      const response = currentLayoutId
        ? await updateProductionLineLayout(currentLayoutId, payload)
        : await createProductionLineLayout(payload)

      setCurrentLayoutId(response.item.id)
      setCurrentLayoutName(response.item.name)
      setIsDirty(false)

      if (isLayoutLibraryOpen) {
        void fetchLayoutLibrary(layoutKeyword)
      }

      return response.item
    } finally {
      setIsSavingLayout(false)
    }
  }

  async function executePendingAction(action: PendingLayoutAction) {
    if (action.type === "create") {
      deps.onResetScene()
      setCurrentLayoutId(null)
      setCurrentLayoutName(null)
      setIsDirty(false)
      return
    }

    setLoadingLayoutId(action.layoutId)
    try {
      const response = await getProductionLineLayout(action.layoutId)
      deps.onLoadScene(
        response.item.scene.placements,
        response.item.conversation.messages,
        response.item.conversation.status_text || DEFAULT_STATUS_TEXT
      )
      setCurrentLayoutId(response.item.id)
      setCurrentLayoutName(response.item.name)
      setIsDirty(false)
    } catch (error) {
      deps.onStatusChange(getErrorMessage(error, "布局加载失败。"))
    } finally {
      setLoadingLayoutId(null)
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
      deps.onStatusChange("请输入布局名称。")
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
      deps.onStatusChange(getErrorMessage(error, "布局保存失败。"))
    }
  }

  function handleRequestNewLayout() {
    setConfirmAction({ type: "create" })
  }

  function handleRequestLoadLayout(layoutId: string) {
    setIsLayoutLibraryOpen(false)
    setConfirmAction({ type: "load", layoutId })
  }

  async function handleDeleteLayout(layout: ProductionLineLayoutSummary) {
    setDeletingLayoutId(layout.id)

    try {
      await deleteProductionLineLayout(layout.id)
      setSavedLayouts((current) => current.filter((item) => item.id !== layout.id))

      if (currentLayoutId === layout.id) {
        setCurrentLayoutId(null)
        setCurrentLayoutName(layout.name)
        setIsDirty(true)
        deps.onStatusChange(`已删除布局 ${layout.name}，当前场景保留为未保存状态。`)
      }
    } catch (error) {
      deps.onStatusChange(getErrorMessage(error, "布局删除失败。"))
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
    setIsDirty,

    isSaveDialogOpen,
    saveName,
    setSaveName,
    isSavingLayout,
    openSaveDialog,
    closeSaveDialog,
    handleSaveLayoutSubmit,

    isLayoutLibraryOpen,
    setIsLayoutLibraryOpen,
    layoutKeyword,
    setLayoutKeyword,
    savedLayouts,
    isLoadingLayouts,
    loadingLayoutId,
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
