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
