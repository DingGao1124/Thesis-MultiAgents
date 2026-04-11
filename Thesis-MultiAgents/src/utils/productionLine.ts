import type { ModelAsset } from "@/api/assets"

export type ScenePlacement = {
  id: string
  assetId: string
  assetName: string
  assetFilename: string
  assetUrl: string
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  source: "manual" | "agent"
  createdAt: string
}

export type ChatMessage = {
  id: string
  role: "assistant" | "user"
  content: string
  createdAt: string
}

export type DropPoint = {
  x: number
  y: number
  z: number
}

export type PendingLayoutAction =
  | {
      type: "create"
    }
  | {
      type: "load"
      layoutId: string
    }

export type ConfirmDialogCopy = {
  title: string
  description: string
  saveLabel: string
  discardLabel: string
}

export const DEFAULT_STATUS_TEXT = "支持放置、删除与清空命令。"

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function createInitialMessages(): ChatMessage[] {
  return [
    {
      id: createId("message"),
      role: "assistant",
      content: "布局代理已就绪。",
      createdAt: new Date().toISOString(),
    },
  ]
}

export function roundCoordinate(value: number) {
  return Math.round(value * 100) / 100
}

export function getNextPlacementPosition(items: ScenePlacement[]): [number, number, number] {
  const index = items.length
  const column = index % 6
  const row = Math.floor(index / 6)
  return [column * 3.4 - 8.5, 0, row * 3.1 - 3.1]
}

export function getAssetDisplayName(asset: ModelAsset) {
  return asset.name || asset.filename.replace(/\.(glb|gltf)$/i, "")
}

export function getErrorMessage(error: unknown, fallback: string) {
  const detail = (error as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
  return typeof detail === "string" && detail.trim() ? detail : fallback
}

export function resolveAssetFromText(text: string, assets: ModelAsset[]) {
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

export function parseCoordinates(text: string) {
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

  const tupleMatch = text.match(
    /\(\s*(-?\d+(?:\.\d+)?)\s*[,，]\s*(-?\d+(?:\.\d+)?)\s*[,，]\s*(-?\d+(?:\.\d+)?)\s*\)/
  )

  if (!tupleMatch) {
    return null
  }

  return {
    x: Number(tupleMatch[1]),
    y: Number(tupleMatch[2]),
    z: Number(tupleMatch[3]),
  }
}

export function parseRotation(text: string) {
  const value =
    text.match(/rotation\s*[:=]?\s*(-?\d+(?:\.\d+)?)/i)?.[1] ??
    text.match(/旋转\s*(-?\d+(?:\.\d+)?)/)?.[1]

  return value ? Number(value) : 0
}

export function parseScale(text: string) {
  const value =
    text.match(/scale\s*[:=]?\s*(\d+(?:\.\d+)?)/i)?.[1] ??
    text.match(/缩放\s*(\d+(?:\.\d+)?)/)?.[1]

  return value ? Number(value) : 1
}

export function createPlacement(
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

export function getConfirmDialogCopy(action: PendingLayoutAction | null): ConfirmDialogCopy {
  if (!action) {
    return {
      title: "",
      description: "",
      saveLabel: "",
      discardLabel: "",
    }
  }

  if (action.type === "create") {
    return {
      title: "新建布局",
      description: "是否先保存当前布局和会话信息，再创建新的空白布局？",
      saveLabel: "保存后新建",
      discardLabel: "不保存直接新建",
    }
  }

  return {
    title: "加载布局",
    description: "是否先保存当前布局和会话信息，再加载选中的布局？",
    saveLabel: "保存后加载",
    discardLabel: "不保存直接加载",
  }
}
