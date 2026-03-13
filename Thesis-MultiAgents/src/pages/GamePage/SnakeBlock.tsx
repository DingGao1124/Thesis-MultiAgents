import type { PropsWithChildren, PropsWithoutRef, Ref } from "react"

interface SnakeProps {
  ref: Ref<HTMLDivElement>
}

const SnakeBlock = ({ ref }: SnakeProps) => {
  return (
    <div className="aspect-square w-2 bg-pink-300 transition-all" ref={ref}/>
  )
}

export default SnakeBlock