import { del, get, post } from "./config/client"

export interface ModelAsset {
  id: string
  name: string
  filename: string
  format: string
  size_bytes: number
  size_label: string
  updated_at: string
  url: string
}

interface ModelAssetListResponse {
  items: ModelAsset[]
  total: number
}

interface ModelAssetMutationResponse {
  item: ModelAsset
}

export function listModelAssets() {
  return get<ModelAssetListResponse>("/assets/models")
}

export function uploadModelAsset(file: File) {
  const formData = new FormData()
  formData.append("file", file)

  return post<ModelAssetMutationResponse>("/assets/models/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
}

export function deleteModelAsset(filename: string) {
  return del<{ success: boolean; filename: string }>(
    `/assets/models/${encodeURIComponent(filename)}`
  )
}
