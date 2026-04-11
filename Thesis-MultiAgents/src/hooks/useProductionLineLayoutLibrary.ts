import { useEffect, useState } from "react"

import {
  getProductionLineLayout,
  listProductionLineLayouts,
  type ProductionLineLayout,
  type ProductionLineLayoutSummary,
} from "@/api/productionLineLayouts"
import { useProductionLineWorkspaceStore } from "@/stores/productionLineWorkspaceStore"
import { DEFAULT_STATUS_TEXT, getErrorMessage } from "@/utils/productionLine"

type UseProductionLineLayoutLibraryOptions = {
  enabled?: boolean
}

export function useProductionLineLayoutLibrary(options?: UseProductionLineLayoutLibraryOptions) {
  const enabled = options?.enabled ?? true
  const applyLoadedLayout = useProductionLineWorkspaceStore((state) => state.applyLoadedLayout)
  const setStatusText = useProductionLineWorkspaceStore((state) => state.setStatusText)

  const [layoutKeyword, setLayoutKeyword] = useState("")
  const [savedLayouts, setSavedLayouts] = useState<ProductionLineLayoutSummary[]>([])
  const [isLoadingLayouts, setIsLoadingLayouts] = useState(false)
  const [loadingLayoutId, setLoadingLayoutId] = useState<string | null>(null)

  async function fetchLayoutLibrary(keywordValue = layoutKeyword) {
    setIsLoadingLayouts(true)

    try {
      const response = await listProductionLineLayouts(keywordValue)
      setSavedLayouts(response.items)
      return response.items
    } catch (error) {
      setStatusText(getErrorMessage(error, "布局列表加载失败。"))
      return []
    } finally {
      setIsLoadingLayouts(false)
    }
  }

  useEffect(() => {
    if (!enabled) {
      return
    }

    const timer = window.setTimeout(() => {
      setIsLoadingLayouts(true)

      void listProductionLineLayouts(layoutKeyword)
        .then((response) => {
          setSavedLayouts(response.items)
        })
        .catch((error) => {
          setStatusText(getErrorMessage(error, "布局列表加载失败。"))
        })
        .finally(() => {
          setIsLoadingLayouts(false)
        })
    }, 200)

    return () => {
      window.clearTimeout(timer)
    }
  }, [enabled, layoutKeyword, setStatusText])

  async function loadLayout(layoutId: string): Promise<ProductionLineLayout> {
    setLoadingLayoutId(layoutId)

    try {
      const response = await getProductionLineLayout(layoutId)

      applyLoadedLayout({
        layoutId: response.item.id,
        layoutName: response.item.name,
        placements: response.item.scene.placements,
        messages: response.item.conversation.messages,
        statusText: response.item.conversation.status_text || DEFAULT_STATUS_TEXT,
      })

      return response.item
    } catch (error) {
      setStatusText(getErrorMessage(error, "布局加载失败。"))
      throw error
    } finally {
      setLoadingLayoutId(null)
    }
  }

  function removeLayoutSummary(layoutId: string) {
    setSavedLayouts((current) => current.filter((item) => item.id !== layoutId))
  }

  return {
    layoutKeyword,
    setLayoutKeyword,
    savedLayouts,
    setSavedLayouts,
    isLoadingLayouts,
    loadingLayoutId,
    fetchLayoutLibrary,
    loadLayout,
    removeLayoutSummary,
  }
}
