import { 
  useProgress,
  Html
} from "@react-three/drei"
import Loading from '@/components/layout/Loading'

const LoaderOverlay = () => {
  const { progress } = useProgress()

  return (
    <Html center className="h-full w-full">
      <Loading />
    </Html>
  )
}

export default LoaderOverlay
