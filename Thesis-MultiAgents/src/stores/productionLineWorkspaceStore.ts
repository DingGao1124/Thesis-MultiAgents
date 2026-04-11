import { create } from "zustand"

import type { ModelAsset } from "@/api/assets"
import {
  DEFAULT_STATUS_TEXT,
  createId,
  createInitialMessages,
  createPlacement,
} from "@/utils/productionLine"
import type { ChatMessage, DropPoint, ScenePlacement } from "@/utils/productionLine"

type LoadedLayoutPayload = {
  layoutId: string | null
  layoutName: string | null
  placements: ScenePlacement[]
  messages: ChatMessage[]
  statusText: string
}

type SetStatusTextOptions = {
  markDirty?: boolean
}

type WorkspaceSnapshot = {
  placements: ScenePlacement[]
  selectedPlacementId: string | null
  draggedAssetId: string | null
  messages: ChatMessage[]
  statusText: string
  currentLayoutId: string | null
  currentLayoutName: string | null
  isDirty: boolean
}

type ProductionLineWorkspaceStore = WorkspaceSnapshot & {
  ensureInitialized: () => void
  resetWorkspace: () => void
  applyLoadedLayout: (payload: LoadedLayoutPayload) => void
  appendPlacement: (
    asset: ModelAsset,
    source: ScenePlacement["source"],
    point?: DropPoint | null,
    rotationY?: number,
    scale?: number
  ) => ScenePlacement
  updatePlacement: (
    placementId: string,
    patch: Partial<Pick<ScenePlacement, "position" | "rotation" | "scale">>
  ) => boolean
  removePlacement: (placementId: string) => ScenePlacement | null
  removePlacementsByAssetId: (assetId: string) => boolean
  clearPlacements: () => void
  setSelectedPlacementId: (value: string | null) => void
  setDraggedAssetId: (value: string | null) => void
  pushMessage: (role: ChatMessage["role"], content: string) => void
  setStatusText: (text: string, options?: SetStatusTextOptions) => void
  markDirty: () => void
  markClean: (layoutMeta?: { id?: string | null; name?: string | null }) => void
  detachCurrentLayout: (name?: string | null) => void
}

function createWorkspaceSnapshot(): WorkspaceSnapshot {
  return {
    placements: [],
    selectedPlacementId: null,
    draggedAssetId: null,
    messages: createInitialMessages(),
    statusText: DEFAULT_STATUS_TEXT,
    currentLayoutId: null,
    currentLayoutName: null,
    isDirty: false,
  }
}

export const useProductionLineWorkspaceStore = create<ProductionLineWorkspaceStore>((set, get) => ({
  ...createWorkspaceSnapshot(),

  ensureInitialized() {
    set((state) => {
      const nextMessages = state.messages.length ? state.messages : createInitialMessages()
      const nextStatusText = state.statusText.trim() ? state.statusText : DEFAULT_STATUS_TEXT

      if (nextMessages === state.messages && nextStatusText === state.statusText) {
        return state
      }

      return {
        messages: nextMessages,
        statusText: nextStatusText,
      }
    })
  },

  resetWorkspace() {
    set(createWorkspaceSnapshot())
  },

  applyLoadedLayout(payload) {
    set({
      placements: payload.placements,
      selectedPlacementId: null,
      draggedAssetId: null,
      messages: payload.messages.length ? payload.messages : createInitialMessages(),
      statusText: payload.statusText || DEFAULT_STATUS_TEXT,
      currentLayoutId: payload.layoutId,
      currentLayoutName: payload.layoutName,
      isDirty: false,
    })
  },

  appendPlacement(asset, source, point, rotationY = 0, scale = 1) {
    let createdPlacement: ScenePlacement | undefined

    set((state) => {
      createdPlacement = createPlacement(asset, state.placements, source, point, rotationY, scale)

      return {
        placements: [...state.placements, createdPlacement],
        selectedPlacementId: createdPlacement.id,
        isDirty: true,
      }
    })

    if (!createdPlacement) {
      throw new Error("Failed to create placement")
    }

    return createdPlacement
  },

  updatePlacement(placementId, patch) {
    let changed = false

    set((state) => {
      const placements = state.placements.map((item) => {
        if (item.id !== placementId) {
          return item
        }

        changed = true
        return { ...item, ...patch }
      })

      if (!changed) {
        return state
      }

      return {
        placements,
        isDirty: true,
      }
    })

    return changed
  },

  removePlacement(placementId) {
    const target = get().placements.find((item) => item.id === placementId) ?? null
    if (!target) {
      return null
    }

    set((state) => ({
      placements: state.placements.filter((item) => item.id !== placementId),
      selectedPlacementId: state.selectedPlacementId === placementId ? null : state.selectedPlacementId,
      isDirty: true,
    }))

    return target
  },

  removePlacementsByAssetId(assetId) {
    let removedAny = false
    let removedIds = new Set<string>()

    set((state) => {
      removedIds = new Set(
        state.placements.filter((item) => item.assetId === assetId).map((item) => item.id)
      )

      if (!removedIds.size) {
        return state
      }

      removedAny = true

      return {
        placements: state.placements.filter((item) => item.assetId !== assetId),
        selectedPlacementId:
          state.selectedPlacementId && removedIds.has(state.selectedPlacementId)
            ? null
            : state.selectedPlacementId,
        isDirty: true,
      }
    })

    return removedAny
  },

  clearPlacements() {
    set((state) => {
      if (!state.placements.length) {
        return state
      }

      return {
        placements: [],
        selectedPlacementId: null,
        isDirty: true,
      }
    })
  },

  setSelectedPlacementId(value) {
    set({ selectedPlacementId: value })
  },

  setDraggedAssetId(value) {
    set({ draggedAssetId: value })
  },

  pushMessage(role, content) {
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: createId("message"),
          role,
          content,
          createdAt: new Date().toISOString(),
        },
      ],
      isDirty: true,
    }))
  },

  setStatusText(text, options) {
    set((state) => ({
      statusText: text,
      isDirty: options?.markDirty ? true : state.isDirty,
    }))
  },

  markDirty() {
    set({ isDirty: true })
  },

  markClean(layoutMeta) {
    set((state) => ({
      currentLayoutId: layoutMeta?.id ?? state.currentLayoutId,
      currentLayoutName: layoutMeta?.name ?? state.currentLayoutName,
      isDirty: false,
    }))
  },

  detachCurrentLayout(name) {
    set((state) => ({
      currentLayoutId: null,
      currentLayoutName: name ?? state.currentLayoutName,
      isDirty: true,
    }))
  },
}))
