import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Stats,
  KeyboardControls,
  GizmoHelper,
  GizmoViewport,
  Sky,
} from '@react-three/drei'
import LoaderOverlay from '@/components/3D/LoaderOverLay'
import UR5Model from '@/components/3D/UR5Model'
import { Leva } from 'leva'

export default function RobotAnimation() {
  return (
    <main className="h-screen w-screen">
      <Leva hidden={false} isRoot />
      <KeyboardControls
        map={[
          { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
          { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
          { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
          { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
        ]}
      >
        <Canvas
          camera={{ position: [1.8, 1.2, 1.8], fov: 45 }}
          gl={{
            antialias: false,
          }}
          shadows
        >
          <Suspense fallback={<LoaderOverlay />}>
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[1, 2, 3]}
              intensity={1.5}
            />
            <Sky />

            <UR5Model />

            <gridHelper args={[10, 100]} />
            <axesHelper args={[10]} />
            <GizmoHelper alignment="bottom-left" margin={[80, 80]}>
              <GizmoViewport
                axisColors={['#ff4d4f', '#52c41a', '#40a9ff']}
                labelColor="white"
              />
            </GizmoHelper>
            <Stats />
            <OrbitControls makeDefault enabled={true} />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </main>
  )
}
