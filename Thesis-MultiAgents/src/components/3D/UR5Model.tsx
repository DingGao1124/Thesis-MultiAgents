import { useEffect, useState } from "react"
import URDFLoader, { type URDFRobot } from "urdf-loader"
import * as THREE from 'three'
import { useControls } from 'leva'

const JOINT_NAMES = [
  'shoulder_pan_joint',
  'shoulder_lift_joint',
  'elbow_joint',
  'wrist_1_joint',
  'wrist_2_joint',
  'wrist_3_joint',
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
  jointAngles?: number[]
  enableControl?: boolean
}

const UR5Model = ({
  jointAngles = [0, -90, 0, -90, 0, 0],
}: UR5ModelProps) => {
  const [robot, setRobot] = useState<URDFRobot | null>(null)

  useEffect(() => {
    const loader = new URDFLoader()
    loader.workingPath = '/models/ur5/'
    loader.load("/models/ur5/ur5.urdf", (urdfRobot) => {
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

      JOINT_NAMES.forEach((jointName, index) => {
        const joint = urdfRobot.joints[jointName]
        if (joint) {
          joint.setJointValue(THREE.MathUtils.degToRad(jointAngles[index]))
        }
      })

      setRobot(urdfRobot)
    })

    return () => {
      setRobot(null)
    }
  }, [])

  const {
    shoulder_pan_joint,
    shoulder_lift_joint,
    elbow_joint,
    wrist_1_joint,
    wrist_2_joint,
    wrist_3_joint,
  } = useControls("UR5", {
    shoulder_pan_joint: { value: 0, min: JOINT_LIMITS[0].min, max: JOINT_LIMITS[0].max, step: 1 },
    shoulder_lift_joint: { value: -90, min: JOINT_LIMITS[1].min, max: JOINT_LIMITS[1].max, step: 1 },
    elbow_joint: { value: 0, min: JOINT_LIMITS[2].min, max: JOINT_LIMITS[2].max, step: 1 },
    wrist_1_joint: { value: -90, min: JOINT_LIMITS[3].min, max: JOINT_LIMITS[3].max, step: 1 },
    wrist_2_joint: { value: 0, min: JOINT_LIMITS[4].min, max: JOINT_LIMITS[4].max, step: 1 },
    wrist_3_joint: { value: 0, min: JOINT_LIMITS[5].min, max: JOINT_LIMITS[5].max, step: 1 },
  })

  const controlAngles = [
    shoulder_pan_joint,
    shoulder_lift_joint,
    elbow_joint,
    wrist_1_joint,
    wrist_2_joint,
    wrist_3_joint,
  ].map((deg) => THREE.MathUtils.degToRad(deg))

  useEffect(() => {
    if (!robot) {
      return
    }

    JOINT_NAMES.forEach((jointName, index) => {
      const joint = robot.joints[jointName]
      if (joint) {
        joint.setJointValue(controlAngles[index])
      }
    })
  }, [robot, controlAngles])

  if (!robot) {
    return null
  }

  return (
    <>
      <primitive object={robot} />
    </>
  )
}

export default UR5Model
