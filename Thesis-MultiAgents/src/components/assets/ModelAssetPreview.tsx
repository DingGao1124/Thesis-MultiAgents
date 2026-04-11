import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import {
  Bounds,
  Center,
  Clone,
  Environment,
  Html,
  OrbitControls,
  useGLTF,
} from "@react-three/drei"

import type { ModelAsset } from "@/api/assets"
import PreviewUnavailable from "./PreviewUnavailable"

const MAX_PREVIEW_SIZE_BYTES = 50 * 1024 * 1024

function AssetModel({ url }: { url: string }) {
  const gltf = useGLTF(url)

  return (
    <Bounds fit clip observe margin={1.12}>
      <Center>
        <Clone object={gltf.scene} />
      </Center>
    </Bounds>
  )
}

function PreviewFallback({ compact = false }: { compact?: boolean }) {
  return (
    <Html center>
      <div
        style={{ writingMode: "horizontal-tb" }}
        className={`whitespace-nowrap rounded-full border border-slate-200 bg-white/94 text-slate-600 shadow-sm ${
          compact ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-xs"
        }`}
      >
        正在加载模型...
      </div>
    </Html>
  )
}

function shouldSkipPreview(asset: ModelAsset) {
  return asset.size_bytes > MAX_PREVIEW_SIZE_BYTES
}

export function ModelAssetCardPreview({ asset }: { asset: ModelAsset }) {
  if (shouldSkipPreview(asset)) {
    return <PreviewUnavailable compact sizeLabel={asset.size_label} />
  }

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1]}
      gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
      camera={{ position: [4.6, 3.4, 4.8], fov: 34 }}
    >
      <color attach="background" args={["#edf4f7"]} />
      <ambientLight intensity={1.05} />
      <directionalLight position={[5, 6, 4]} intensity={1.25} />
      <directionalLight position={[-4, 3, -3]} intensity={0.28} />
      <gridHelper args={[12, 12, "#d3dde2", "#e5ecef"]} position={[0, -0.8, 0]} />
      <Suspense fallback={<PreviewFallback compact />}>
        <AssetModel url={asset.url} />
      </Suspense>
      <OrbitControls makeDefault enableDamping enablePan={false} />
    </Canvas>
  )
}

export function ModelAssetViewer({
  asset,
  viewerKey,
}: {
  asset: ModelAsset | null
  viewerKey: number
}) {
  if (!asset) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        请选择模型查看详情
      </div>
    )
  }

  if (shouldSkipPreview(asset)) {
    return <PreviewUnavailable sizeLabel={asset.size_label} />
  }

  return (
    <Canvas
      key={viewerKey}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [6, 4, 6], fov: 36 }}
    >
      <color attach="background" args={["#edf3f5"]} />
      <ambientLight intensity={1.05} />
      <directionalLight position={[6, 8, 4]} intensity={1.45} />
      <directionalLight position={[-5, 4, -4]} intensity={0.45} />
      <gridHelper args={[22, 22, "#c9d5db", "#dde7eb"]} position={[0, -1.1, 0]} />
      <Suspense fallback={<PreviewFallback />}>
        <AssetModel url={asset.url} />
        <Environment preset="warehouse" />
      </Suspense>
      <OrbitControls makeDefault enableDamping />
    </Canvas>
  )
}
