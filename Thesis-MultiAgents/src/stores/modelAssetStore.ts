import { create } from "zustand"

import {
  deleteModelAsset,
  listModelAssets,
  uploadModelAsset,
  type ModelAsset,
} from "@/api/assets"

type LoadAssetsOptions = {
  keepSelection?: boolean
}

type ModelAssetStore = {
  assets: ModelAsset[]
  keyword: string
  selectedId: string | null
  isLoading: boolean
  isUploading: boolean
  deletingId: string | null
  notice: string
  loadAssets: (options?: LoadAssetsOptions) => Promise<ModelAsset[]>
  uploadAsset: (file: File) => Promise<ModelAsset>
  deleteAsset: (filename: string) => Promise<void>
  setKeyword: (value: string) => void
  setSelectedId: (value: string | null) => void
}

function getErrorMessage(error: unknown, fallback: string) {
  const detail = (error as any)?.response?.data?.detail
  return typeof detail === "string" && detail.trim() ? detail : fallback
}

function resolveSelectedId(
  items: ModelAsset[],
  currentSelectedId: string | null,
  keepSelection?: boolean
) {
  if (keepSelection && currentSelectedId && items.some((item) => item.id === currentSelectedId)) {
    return currentSelectedId
  }

  return items[0]?.id ?? null
}

export const useModelAssetStore = create<ModelAssetStore>((set, get) => ({
  assets: [],
  keyword: "",
  selectedId: null,
  isLoading: true,
  isUploading: false,
  deletingId: null,
  notice: "",

  async loadAssets(options) {
    set({ isLoading: true })

    try {
      const response = await listModelAssets()

      set((state) => ({
        assets: response.items,
        selectedId: resolveSelectedId(response.items, state.selectedId, options?.keepSelection),
        notice: response.items.length ? (options?.keepSelection ? state.notice : "") : "当前暂无模型资产。",
      }))

      return response.items
    } catch (error) {
      set({ notice: getErrorMessage(error, "模型资产加载失败。") })
      return []
    } finally {
      set({ isLoading: false })
    }
  },

  async uploadAsset(file) {
    set({ isUploading: true, notice: "" })

    try {
      const response = await uploadModelAsset(file)
      await get().loadAssets({ keepSelection: true })
      set({
        selectedId: response.item.id,
        notice: `已上传模型：${response.item.filename}`,
      })
      return response.item
    } catch (error) {
      const message = getErrorMessage(error, "模型上传失败。")
      set({ notice: message })
      throw error
    } finally {
      set({ isUploading: false })
    }
  },

  async deleteAsset(filename) {
    const currentAsset = get().assets.find((item) => item.filename === filename) ?? null
    set({
      deletingId: currentAsset?.id ?? null,
      notice: "",
    })

    try {
      await deleteModelAsset(filename)
      await get().loadAssets({ keepSelection: true })
      set({
        deletingId: null,
        notice: `已删除模型：${filename}`,
      })
    } catch (error) {
      set({
        deletingId: null,
        notice: getErrorMessage(error, "模型删除失败。"),
      })
      throw error
    }
  },

  setKeyword(value) {
    set({ keyword: value })
  },

  setSelectedId(value) {
    set({ selectedId: value })
  },
}))
