import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useLoader, useThree } from '@react-three/fiber'
import { Center, OrbitControls } from '@react-three/drei'
import { Box, ScanSearch } from 'lucide-react'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'

type ModelStatus = 'checking' | 'ready' | 'missing'

const checkedModelCache = new Map<string, boolean>()

function ModelPlaceholder({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#f8fafc,#e2e8f0)] p-4">
      <div className="flex max-w-52 flex-col items-center text-center">
        <div className="mb-3 flex size-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ScanSearch className="size-6 text-slate-500" />
        </div>
        <div className="text-sm font-semibold text-slate-700">{title}</div>
        <div className="mt-1 text-xs leading-5 text-slate-500">{description}</div>
      </div>
    </div>
  )
}

function LoadedModel({ url }: { url: string }) {
  const groupRef = useRef<THREE.Group>(null)
  const { camera } = useThree()

  const gltf = useLoader(GLTFLoader, url, (loader) => {
    const dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    loader.setDRACOLoader(dracoLoader)
  })

  const model = useMemo(() => gltf.scene.clone(true), [gltf])

  useEffect(() => {
    if (!groupRef.current) {
      return
    }

    const box = new THREE.Box3().setFromObject(groupRef.current)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxAxis = Math.max(size.x, size.y, size.z) || 1
    const scale = 6 / maxAxis

    groupRef.current.scale.setScalar(scale)
    groupRef.current.position.set(-center.x * scale, -center.y * scale, -center.z * scale)

    camera.position.set(5, 5, 5)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, model])

  return (
    <Center>
      <gridHelper args={[20, 20]} position={[0, -2, 0]} />
      <axesHelper args={[10]} />
      <primitive ref={groupRef} object={model} castShadow receiveShadow />
    </Center>
  )
}

interface ModelViewerProps {
  url?: string
}

export default function ModelViewer({ url }: ModelViewerProps) {
  const [status, setStatus] = useState<ModelStatus>(url ? 'checking' : 'missing')

  useEffect(() => {
    let cancelled = false

    if (!url) {
      setStatus('missing')
      return
    }

    const cachedState = checkedModelCache.get(url)
    if (cachedState !== undefined) {
      setStatus(cachedState ? 'ready' : 'missing')
      return
    }

    async function verifyModel() {
      setStatus('checking')

      try {
        const response = await fetch(url!, { method: 'GET' })
        const contentType = response.headers.get('content-type') ?? ''
        const looksLikeHtml = contentType.includes('text/html')

        if (!response.ok || looksLikeHtml) {
          checkedModelCache.set(url!, false)
          if (!cancelled) {
            setStatus('missing')
          }
          return
        }

        checkedModelCache.set(url!, true)
        if (!cancelled) {
          setStatus('ready')
        }
      } catch {
        checkedModelCache.set(url!, false)
        if (!cancelled) {
          setStatus('missing')
        }
      }
    }

    void verifyModel()

    return () => {
      cancelled = true
    }
  }, [url])

  if (status === 'checking') {
    return (
      <div className="h-full w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
        <ModelPlaceholder
          title="3D preview loading"
          description="The workspace is checking whether the model asset is available."
        />
      </div>
    )
  }

  if (status === 'missing') {
    return (
      <div className="h-full w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,#f8fafc,#e2e8f0)] p-4">
          <div className="flex max-w-56 flex-col items-center text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
              <Box className="size-6 text-slate-500" />
            </div>
            <div className="text-sm font-semibold text-slate-700">3D preview reserved</div>
            <div className="mt-1 text-xs leading-5 text-slate-500">
              No model asset is available yet. This area is reserved for the production-line or node 3D preview.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-full w-full overflow-hidden rounded-xl"
      style={{
        background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
      }}
    >
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50, near: 0.1, far: 1000 }}
        shadows
        linear
        dpr={[1, 2]}
        frameloop="always"
      >
        <color attach="background" args={['#f8f9fa']} />
        <fog attach="fog" args={['#f8f9fa', 10, 20]} />
        <ambientLight intensity={1} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-far={20}
          shadow-camera-near={0.1}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
          shadow-camera-left={-10}
          shadow-camera-right={10}
        />
        <pointLight position={[-5, 5, -5]} intensity={1} />

        <Suspense fallback={null}>
          <LoadedModel url={url!} />
        </Suspense>

        <OrbitControls
          enablePan
          minDistance={3}
          maxDistance={10}
          enableDamping
          dampingFactor={0.05}
          makeDefault
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  )
}
