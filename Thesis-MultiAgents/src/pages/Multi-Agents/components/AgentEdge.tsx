import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow } from 'reactflow'
import type { EdgeProps } from 'reactflow'

export default function AgentEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  source,
  target,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  const gradientId = `gradient-${id}`
  const markerId = `marker-${id}`
  const particleId = `particle-${id}`
  const { setEdges } = useReactFlow()

  const isModuleToUnit = Number(source) >= 10 && Number(source) <= 13 && Number(target) >= 14
  const endColor = isModuleToUnit ? '#1677ff' : '#52c41a'

  return (
    <>
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1677ff">
            <animate attributeName="offset" values="-100%;0%" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor={endColor}>
            <animate attributeName="offset" values="0%;100%" dur="2s" repeatCount="indefinite" />
          </stop>
        </linearGradient>

        <marker
          id={markerId}
          viewBox="0 0 20 20"
          refX="10"
          refY="10"
          markerWidth="10"
          markerHeight="10"
          orient="auto-start-reverse"
        >
          <path
            d="M 0 0 L 20 10 L 0 20 z"
            fill={endColor}
            style={{ filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.3))' }}
          />
        </marker>

        <circle id={particleId} r="3" fill="#fff">
          <animate attributeName="r" values="2;3;2" dur="1s" repeatCount="indefinite" />
        </circle>
      </defs>

      <BaseEdge path={edgePath} markerEnd={`url(#${markerId})`} style={{ strokeWidth: 2, stroke: `url(#${gradientId})` }} />

      <use href={`#${particleId}`}>
        <animateMotion dur="2s" repeatCount="indefinite" path={edgePath} />
      </use>

      <EdgeLabelRenderer>
        <button
          onClick={() => setEdges((edges) => edges.filter((edge) => edge.id !== id))}
          className="nodrag nopan rounded bg-white/80 px-1 text-[0.5rem] backdrop-blur-sm hover:bg-pink-300 active:bg-blue-400"
          style={{
            position: 'absolute',
            transform: `translate(${labelX}px, ${labelY}px) translate(-50%,-50%)`,
            pointerEvents: 'all',
          }}
        >
          delete
        </button>
      </EdgeLabelRenderer>
    </>
  )
}
