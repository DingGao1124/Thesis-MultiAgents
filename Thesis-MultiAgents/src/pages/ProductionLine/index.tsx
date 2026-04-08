import { useEffect, useState, type FormEvent } from "react"
import * as THREE from "three"

import type { ModelAsset } from "@/api/assets"
import { useModelAssetStore } from "@/stores/modelAssetStore"
import AgentChatPanel from "./components/AgentChatPanel"
import AssetLibraryPanel from "./components/AssetLibraryPanel"
import SceneWorkspacePanel from "./components/SceneWorkspacePanel"
import type { ChatMessage, DropPoint, ScenePlacement } from "./types"
import FloatingDockNav from "@/components/layout/FloatingDockNav"

const STORAGE_KEY = "production-line-layout-v3"
const DEFAULT_STATUS_TEXT = "支持放置、删除与清空命令。"

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function createInitialMessages(): ChatMessage[] {
  return [
    {
      id: createId("message"),
      role: "assistant",
      content: "布局代理已就绪。",
      createdAt: new Date().toISOString(),
    },
  ]
}

function roundCoordinate(value: number) {
  return Math.round(value * 100) / 100
}

function getNextPlacementPosition(items: ScenePlacement[]): [number, number, number] {
  const index = items.length
  const column = index % 6
  const row = Math.floor(index / 6)
  return [column * 3.4 - 8.5, 0, row * 3.1 - 3.1]
}

function getAssetDisplayName(asset: ModelAsset) {
  return asset.name || asset.filename.replace(/\.(glb|gltf)$/i, "")
}

function resolveAssetFromText(text: string, assets: ModelAsset[]) {
  const normalizedText = text.toLowerCase()
  const explicitFileMatch = text.match(/([\w\-.]+\.(?:glb|gltf))/i)?.[1]?.toLowerCase()

  if (explicitFileMatch) {
    const exact = assets.find((asset) => asset.filename.toLowerCase() === explicitFileMatch)
    if (exact) {
      return exact
    }
  }

  const byName = assets.find((asset) => getAssetDisplayName(asset).toLowerCase() === normalizedText.trim())
  if (byName) {
    return byName
  }

  return (
    assets.find((asset) => {
      const candidates = [
        getAssetDisplayName(asset),
        asset.filename,
        asset.filename.replace(/\.(glb|gltf)$/i, ""),
      ]
        .map((value) => value.toLowerCase())
        .filter(Boolean)

      return candidates.some((candidate) => normalizedText.includes(candidate))
    }) ?? null
  )
}

function parseCoordinates(text: string) {
  const axisMatches = {
    x: text.match(/x\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i),
    y: text.match(/y\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i),
    z: text.match(/z\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i),
  }

  if (axisMatches.x && axisMatches.y && axisMatches.z) {
    return {
      x: Number(axisMatches.x[1]),
      y: Number(axisMatches.y[1]),
      z: Number(axisMatches.z[1]),
    }
  }

  const tupleMatch = text.match(/\(\s*(-?\d+(?:\.\d+)?)\s*[,，]\s*(-?\d+(?:\.\d+)?)\s*[,，]\s*(-?\d+(?:\.\d+)?)\s*\)/)

  if (!tupleMatch) {
    return null
  }

  return {
    x: Number(tupleMatch[1]),
    y: Number(tupleMatch[2]),
    z: Number(tupleMatch[3]),
  }
}

function parseRotation(text: string) {
  const value =
    text.match(/rotation\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i)?.[1] ??
    text.match(/旋转\s*(-?\d+(?:\.\d+)?)/)?.[1]

  return value ? Number(value) : 0
}

function parseScale(text: string) {
  const value =
    text.match(/scale\s*[:=]?\s*(\d+(?:\.\d+)?)/i)?.[1] ??
    text.match(/缩放\s*(\d+(?:\.\d+)?)/)?.[1]

  return value ? Number(value) : 1
}

function createPlacement(
  asset: ModelAsset,
  items: ScenePlacement[],
  source: ScenePlacement["source"],
  point?: DropPoint | null,
  rotationY = 0,
  scale = 1
) {
  const fallback = getNextPlacementPosition(items)

  return {
    id: createId("placement"),
    assetId: asset.id,
    assetName: getAssetDisplayName(asset),
    assetFilename: asset.filename,
    assetUrl: asset.url,
    position: [
      roundCoordinate(point?.x ?? fallback[0]),
      roundCoordinate(point?.y ?? fallback[1]),
      roundCoordinate(point?.z ?? fallback[2]),
    ] as [number, number, number],
    rotation: [0, rotationY, 0] as [number, number, number],
    scale: Math.max(0.1, scale),
    source,
    createdAt: new Date().toISOString(),
  }
}

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

  const [placements, setPlacements] = useState<ScenePlacement[]>([])
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>(() => createInitialMessages())
  const [chatInput, setChatInput] = useState("")
  const [statusText, setStatusText] = useState(DEFAULT_STATUS_TEXT)
  const [draggedAssetId, setDraggedAssetId] = useState<string | null>(null)

  const selectedPlacement = placements.find((item) => item.id === selectedPlacementId) ?? null
  const draggedAsset = assets.find((asset) => asset.id === draggedAssetId) ?? null

  useEffect(() => {
    void loadAssets()
  }, [loadAssets])

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return
    }

    try {
      const parsed = JSON.parse(stored) as ScenePlacement[]
      setPlacements(parsed)
      setSelectedPlacementId(parsed[0]?.id ?? null)
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(placements))
  }, [placements])

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

  useEffect(() => {
    if (notice) {
      setStatusText(notice)
    }
  }, [notice])

  function pushMessage(role: ChatMessage["role"], content: string) {
    setMessages((current) => [
      ...current,
      {
        id: createId("message"),
        role,
        content,
        createdAt: new Date().toISOString(),
      },
    ])
  }

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

    const placement = createdPlacement
    setSelectedPlacementId(placement.id)
    return placement
  }

  function updatePlacement(
    placementId: string,
    patch: Partial<Pick<ScenePlacement, "position" | "rotation" | "scale">>
  ) {
    setPlacements((current) =>
      current.map((item) => (item.id === placementId ? { ...item, ...patch } : item))
    )
  }

  function removePlacement(placementId: string) {
    const target = placements.find((item) => item.id === placementId)
    if (!target) {
      return
    }

    setPlacements((current) => current.filter((item) => item.id !== placementId))
    setSelectedPlacementId((current) => (current === placementId ? null : current))
    setStatusText(`${target.assetFilename} 已从场景移除。`)
    pushMessage("assistant", `${target.assetFilename} 已从场景移除。`)
  }

  function clearScene() {
    setPlacements([])
    setSelectedPlacementId(null)
    setStatusText("场景已清空。")
    pushMessage("assistant", "场景已清空。")
  }

  function resetConversation() {
    setMessages(createInitialMessages())
    setChatInput("")
    setStatusText(DEFAULT_STATUS_TEXT)
  }

  async function handleUploadAsset(file: File) {
    const item = await uploadAsset(file)
    setStatusText(`已上传 ${item.filename}。`)
  }

  async function handleDeleteAsset(asset: ModelAsset) {
    await deleteAsset(asset.filename)
    const nextPlacements = placements.filter((item) => item.assetId !== asset.id)
    setPlacements(nextPlacements)
    setSelectedPlacementId((current) => {
      if (!current) {
        return current
      }
      return nextPlacements.some((item) => item.id === current) ? current : null
    })
    setStatusText(`已删除 ${asset.filename}。`)
  }

  function handleDropAsset(point: DropPoint | null) {
    if (!draggedAsset) {
      return
    }

    const placement = appendPlacement(draggedAsset, "manual", point)
    setSelectedPlacementId(null)
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

      removePlacement(target.id)
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

    const placement = appendPlacement(
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
          selectedPlacement={selectedPlacement}
          selectedPlacementId={selectedPlacementId}
          draggedAssetName={draggedAsset?.filename ?? null}
          onSelectPlacement={setSelectedPlacementId}
          onDropAsset={handleDropAsset}
          onUpdatePlacement={updatePlacement}
          onRemovePlacement={removePlacement}
        />
        <AgentChatPanel
          messages={messages}
          input={chatInput}
          statusText={statusText}
          onInputChange={setChatInput}
          onSubmit={handleAgentSubmit}
          onNewChat={resetConversation}
        />
      </div>
    </main>
  )
}
