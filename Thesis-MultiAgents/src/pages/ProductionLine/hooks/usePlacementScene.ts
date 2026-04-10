import { useEffect, useState } from "react"

import type { ModelAsset } from "@/api/assets"

import type { DropPoint, ScenePlacement } from "../types"
import { createPlacement } from "../utils"

export function usePlacementScene(assets: ModelAsset[]) {
  const [placements, setPlacements] = useState<ScenePlacement[]>([])
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null)
  const [draggedAssetId, setDraggedAssetId] = useState<string | null>(null)

  const selectedPlacement = placements.find((item) => item.id === selectedPlacementId) ?? null
  const draggedAsset = assets.find((asset) => asset.id === draggedAssetId) ?? null

  useEffect(() => {
    if (!selectedPlacementId) {
      return
    }

    const exists = placements.some((item) => item.id === selectedPlacementId)
    if (!exists) {
      setSelectedPlacementId(placements[0]?.id ?? null)
    }
  }, [placements, selectedPlacementId])

  useEffect(() => {
    if (!draggedAssetId) {
      return
    }

    const exists = assets.some((asset) => asset.id === draggedAssetId)
    if (!exists) {
      setDraggedAssetId(null)
    }
  }, [assets, draggedAssetId])

  function appendPlacement(
    asset: ModelAsset,
    source: ScenePlacement["source"],
    point?: DropPoint | null,
    rotationY = 0,
    scale = 1
  ): ScenePlacement {
    let createdPlacement: ScenePlacement | undefined

    setPlacements((current) => {
      const placement = createPlacement(asset, current, source, point, rotationY, scale)
      createdPlacement = placement
      return [...current, placement]
    })

    if (!createdPlacement) {
      throw new Error("Failed to create placement")
    }

    setSelectedPlacementId(createdPlacement.id)
    return createdPlacement
  }

  function updatePlacement(
    placementId: string,
    patch: Partial<Pick<ScenePlacement, "position" | "rotation" | "scale">>
  ) {
    setPlacements((current) =>
      current.map((item) => (item.id === placementId ? { ...item, ...patch } : item))
    )
  }

  function removePlacement(placementId: string): ScenePlacement | null {
    const target = placements.find((item) => item.id === placementId)
    if (!target) {
      return null
    }

    setPlacements((current) => current.filter((item) => item.id !== placementId))
    setSelectedPlacementId((current) => (current === placementId ? null : current))
    return target
  }

  function clearPlacements() {
    setPlacements([])
    setSelectedPlacementId(null)
  }

  function removePlacementsByAssetId(assetId: string) {
    let removedAny = false
    let removedIds = new Set<string>()

    setPlacements((current) => {
      removedIds = new Set(
        current.filter((item) => item.assetId === assetId).map((item) => item.id)
      )
      const next = current.filter((item) => item.assetId !== assetId)
      removedAny = next.length !== current.length
      return next
    })

    setSelectedPlacementId((current) => {
      if (!current) {
        return current
      }

      return removedIds.has(current) ? null : current
    })

    return removedAny
  }

  function resetScene() {
    setPlacements([])
    setSelectedPlacementId(null)
    setDraggedAssetId(null)
  }

  return {
    placements,
    setPlacements,
    selectedPlacementId,
    setSelectedPlacementId,
    selectedPlacement,
    draggedAssetId,
    setDraggedAssetId,
    draggedAsset,
    appendPlacement,
    updatePlacement,
    removePlacement,
    removePlacementsByAssetId,
    clearPlacements,
    resetScene,
  }
}
