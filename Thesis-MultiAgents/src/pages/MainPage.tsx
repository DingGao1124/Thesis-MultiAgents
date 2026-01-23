import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { type Mesh } from 'three'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(useGSAP)

function AnimatedBox() {
  const meshRef = useRef<Mesh>(null)
  const timelineRef = useRef<gsap.core.Timeline>(null)

  useGSAP(() => {
    if (!meshRef.current) return

    timelineRef.current = gsap.timeline({ repeat: -1 })

    timelineRef.current
      .to(
        meshRef.current.position,
        {
          x: 3,
          duration: 2,
          ease: 'power2.inOut'
        },
        0
      )
      .to(
        meshRef.current.rotation,
        {
          x: Math.PI * 2,
          duration: 2,
          ease: 'power2.inOut'
        },
        0
      )
  })

  useFrame((state, delta) => {

  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  )
}

export default function MainPage() {
  return (
    <Canvas>
      <ambientLight intensity={Math.PI / 2} />
      <pointLight position={[10, 10, 10]} />
      <AnimatedBox />
    </Canvas>
  )
}
