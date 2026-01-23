import { OrbitControls, Stats } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useState } from 'react'
import URDFLoader, { type URDFRobot } from 'urdf-loader'
import { Button } from '@/components/ui/button'
import * as THREE from 'three'

const JOINT_NAMES = [
  'shoulder_pan_joint',
  'shoulder_lift_joint',
  'elbow_joint',
  'wrist_1_joint',
  'wrist_2_joint',
  'wrist_3_joint',
]

const JOINT_LABELS = [
  'Shoulder Pan',
  'Shoulder Lift',
  'Elbow',
  'Wrist 1',
  'Wrist 2',
  'Wrist 3',
]

const JOINT_LIMITS = [
  { min: -180, max: 180 },
  { min: -180, max: 180 },
  { min: -180, max: 180 },
  { min: -180, max: 180 },
  { min: -180, max: 180 },
  { min: -180, max: 180 },
]

interface UR5ModelProps {
  jointAngles: number[]
}

function UR5Model({ jointAngles }: UR5ModelProps) {
  const [robot, setRobot] = useState<URDFRobot | null>(null)

  useEffect(() => {
    const loader = new URDFLoader()
    loader.workingPath = '/models/ur5/'
    loader.load('/models/ur5/ur5.urdf', (urdfRobot) => {
      console.log(urdfRobot)
      urdfRobot.rotation.x = -Math.PI / 2
      urdfRobot.position.set(0, 0, 0)

      urdfRobot.traverse((child) => {
        if ('castShadow' in child) {
          child.castShadow = true
        }
        if ('receiveShadow' in child) {
          child.receiveShadow = true
        }
      })

      setRobot(urdfRobot)
    })

    return () => {
      setRobot(null)
    }
  }, [])

  useEffect(() => {
    if (!robot) {
      return
    }

    JOINT_NAMES.forEach((jointName, index) => {
      const joint = robot.joints[jointName]
      if (joint) {
        joint.setJointValue(jointAngles[index] ?? 0)
      }
    })
  }, [robot, jointAngles])

  useFrame((state, delta) => {
    // state.camera.position.set(Math.sin(state.clock.elapsedTime), state.camera.position.y, Math.cos(state.clock.elapsedTime))
    // state.camera.lookAt(new THREE.Vector3(0, 0, 0))
  })

  if (!robot) {
    return null
  }

  return <primitive object={robot} />
}

export default function RobotAnimation() {
  const [anglesDeg, setAnglesDeg] = useState<number[]>([0, 0, 0, 0, 0, 0])
  const anglesRad = useMemo(
    () => anglesDeg.map((angle) => (angle * Math.PI) / 180),
    [anglesDeg],
  )

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col bg-slate-950 text-white">
      <div className="flex flex-1">
        <div className="relative flex-1">
          <Canvas
            shadows
            camera={{ position: [1.8, 1.2, 1.8], fov: 45 }}
            className="h-full w-full"
          >
            {/* White Background*/}
            {/* <color attach="background" args={['#0b1120']} /> */}
            {/* Dark Background*/}
            <color attach="background" args={['#0b1120']} />
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[2.5, 3.5, 2]}
              intensity={1.2}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
            />
            <Suspense fallback={null}>
              <UR5Model jointAngles={anglesRad} />
            </Suspense>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} receiveShadow>
              <planeGeometry args={[6, 6]} />
              <shadowMaterial opacity={0.3} />
            </mesh>
            <axesHelper args={[1.2]} />
            <gridHelper args={[6, 12, '#334155', '#1f2937']} />
            <OrbitControls makeDefault enableDamping />
            <Stats className="stats-panel" />
          </Canvas>
        </div>
        <aside className="w-full max-w-sm border-l border-slate-800 bg-slate-900/70 p-6">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">UR5 Joint Control</h2>
            <p className="text-sm text-slate-300">
              Adjust each axis angle (degrees) to animate the six joints.
            </p>
          </div>
          <div className="mt-6 space-y-5">
            {anglesDeg.map((value, index) => (
              <label key={JOINT_NAMES[index]} className="block space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-200">
                  <span>{JOINT_LABELS[index]}</span>
                  <span className="font-mono text-slate-100">{value}°</span>
                </div>
                <input
                  type="range"
                  min={JOINT_LIMITS[index].min}
                  max={JOINT_LIMITS[index].max}
                  step={1}
                  value={value}
                  onChange={(event) => {
                    const next = [...anglesDeg]
                    next[index] = Number(event.target.value)
                    setAnglesDeg(next)
                  }}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-700"
                />
              </label>
            ))}
          </div>
          <div className='space-y-12 mt-10 flex justify-between'>
            <Button
              className='bg-slate-400'
              onClick={() => {
                setAnglesDeg(Array.from({ length: 6 }, _ => -Math.random() * 360 + 180))
              }}
            >Random</Button>
            <Button className='bg-slate-400' onClick={() => setAnglesDeg([0, 0, 0, 0, 0, 0])}>Reset</Button>
          </div>
        </aside>
      </div>
    </div>
  )
}
