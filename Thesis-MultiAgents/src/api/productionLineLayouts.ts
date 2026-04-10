import { del, get, post, put } from "./config/client"

import type { ChatMessage, ScenePlacement } from "@/pages/ProductionLine/types"

export interface ProductionLineLayoutSummary {
  id: string
  name: string
  created_at: string
  updated_at: string
  placement_count: number
  message_count: number
}

export interface ProductionLineLayout {
  id: string
  version: number
  name: string
  created_at: string
  updated_at: string
  scene: {
    placements: ScenePlacement[]
  }
  conversation: {
    messages: ChatMessage[]
    status_text: string
  }
  summary: {
    placement_count: number
    message_count: number
  }
}

export interface SaveProductionLineLayoutPayload {
  name: string
  placements: ScenePlacement[]
  messages: ChatMessage[]
  status_text: string
}

interface ProductionLineLayoutListResponse {
  items: ProductionLineLayoutSummary[]
  total: number
}

interface ProductionLineLayoutItemResponse {
  item: ProductionLineLayout
}

export function listProductionLineLayouts(keyword = "") {
  return get<ProductionLineLayoutListResponse>("/production-line/layouts", {
    params: {
      keyword,
    },
  })
}

export function getProductionLineLayout(layoutId: string) {
  return get<ProductionLineLayoutItemResponse>(`/production-line/layouts/${layoutId}`)
}

export function createProductionLineLayout(payload: SaveProductionLineLayoutPayload) {
  return post<ProductionLineLayoutItemResponse>("/production-line/layouts", payload)
}

export function updateProductionLineLayout(
  layoutId: string,
  payload: SaveProductionLineLayoutPayload
) {
  return put<ProductionLineLayoutItemResponse>(`/production-line/layouts/${layoutId}`, payload)
}

export function deleteProductionLineLayout(layoutId: string) {
  return del<{ success: boolean; id: string }>(`/production-line/layouts/${layoutId}`)
}
