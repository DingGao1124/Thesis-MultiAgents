import React, { useEffect, useRef, useState } from 'react'
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d'
import GraphPanel, { type GraphLegendItem } from './components/GraphPanel'

const KnowledgeGraph = () => {
  const fgRef = useRef<ForceGraphMethods>(undefined)
  const [showEdgeLabels, setShowEdgeLabels] = useState(true)

  const graphData = {
    nodes: [
      { id: '爷爷', name: '张大明', group: 1 },
      { id: '奶奶', name: '李秀英', group: 1 },
      { id: '爸爸', name: '张建国', group: 2 },
      { id: '妈妈', name: '王芳', group: 2 },
      { id: '叔叔', name: '张建军', group: 2 },
      { id: '婶婶', name: '刘梅', group: 2 },
      { id: '我', name: '张小明', group: 3 },
      { id: '妹妹', name: '张小红', group: 3 },
      { id: '堂弟', name: '张小强', group: 3 },
    ],
    links: [
      { source: '爷爷', target: '奶奶', label: '夫妻', color: '#ff6b6b' },
      { source: '爷爷', target: '爸爸', label: '父子', color: '#4ecdc4' },
      { source: '爷爷', target: '叔叔', label: '父子', color: '#4ecdc4' },
      { source: '奶奶', target: '爸爸', label: '母子', color: '#95e1d3' },
      { source: '奶奶', target: '叔叔', label: '母子', color: '#95e1d3' },
      { source: '爸爸', target: '妈妈', label: '夫妻', color: '#ff6b6b' },
      { source: '叔叔', target: '婶婶', label: '夫妻', color: '#ff6b6b' },
      { source: '爸爸', target: '我', label: '父子', color: '#4ecdc4' },
      { source: '爸爸', target: '妹妹', label: '父女', color: '#4ecdc4' },
      { source: '妈妈', target: '我', label: '母子', color: '#95e1d3' },
      { source: '妈妈', target: '妹妹', label: '母女', color: '#95e1d3' },
      { source: '叔叔', target: '堂弟', label: '父子', color: '#4ecdc4' },
      { source: '婶婶', target: '堂弟', label: '母子', color: '#95e1d3' },
      { source: '我', target: '妹妹', label: '兄妹', color: '#ffd93d' },
      { source: '我', target: '堂弟', label: '堂兄弟', color: '#ffd93d' },
    ]
  };

  const legendItems: GraphLegendItem[] = [
    { name: 'Group 1', color: '#ff6b6b', count: graphData.nodes.filter((node) => node.group === 1).length },
    { name: 'Group 2', color: '#4ecdc4', count: graphData.nodes.filter((node) => node.group === 2).length },
    { name: 'Group 3', color: '#ffd93d', count: graphData.nodes.filter((node) => node.group === 3).length }
  ]

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 50)
    }
  }, [])

  return (
    <GraphPanel
      title="Graph Relationship Visualization"
      showEdgeLabels={showEdgeLabels}
      onToggleEdgeLabels={setShowEdgeLabels}
      legendItems={legendItems}
    >
      <ForceGraph2D
        ref={fgRef}
        graphData={graphData}
        nodeLabel="name"
        nodeAutoColorBy="group"
        backgroundColor="rgba(0,0,0,0)"
        nodeCanvasObject={(node: any, ctx, globalScale) => {
          const label = node.name
          const fontSize = 14 / globalScale
          ctx.font = `${fontSize}px Sans-Serif`

          ctx.beginPath()
          ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI)
          ctx.fillStyle =
            node.group === 1 ? '#ff6b6b' : node.group === 2 ? '#4ecdc4' : '#ffd93d'
          ctx.fill()
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2 / globalScale
          ctx.stroke()

          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#333'
          ctx.fillText(label, node.x, node.y + 15)
        }}
        linkCanvasObject={(link: any, ctx, globalScale) => {
          const start = link.source
          const end = link.target

          const dx = end.x - start.x
          const dy = end.y - start.y
          const angle = Math.atan2(dy, dx)

          const nodeRadius = 8
          const arrowLength = 10 / globalScale
          const arrowWidth = 6 / globalScale

          const startX = start.x + nodeRadius * Math.cos(angle)
          const startY = start.y + nodeRadius * Math.sin(angle)
          const endX = end.x - nodeRadius * Math.cos(angle)
          const endY = end.y - nodeRadius * Math.sin(angle)

          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.strokeStyle = '#c0c0c0'
          ctx.lineWidth = 1.5 / globalScale
          ctx.stroke()

          ctx.save()
          ctx.translate(endX, endY)
          ctx.rotate(angle)
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.lineTo(-arrowLength, arrowWidth)
          ctx.lineTo(-arrowLength, -arrowWidth)
          ctx.closePath()
          ctx.fillStyle = '#c0c0c0'
          ctx.fill()
          ctx.restore()

          if (!showEdgeLabels) {
            return
          }

          const textPos = {
            x: (start.x + end.x) / 2,
            y: (start.y + end.y) / 2
          }

          const label = link.label
          const fontSize = 12 / globalScale
          ctx.font = `${fontSize}px Sans-Serif`

          const textWidth = ctx.measureText(label).width
          const padding = 4 / globalScale
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.fillRect(
            textPos.x - textWidth / 2 - padding,
            textPos.y - fontSize / 2 - padding,
            textWidth + padding * 2,
            fontSize + padding * 2
          )

          ctx.fillStyle = '#333'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(label, textPos.x, textPos.y)
        }}
        linkCanvasObjectMode={() => 'replace'}
        nodeCanvasObjectMode={() => 'replace'}
        cooldownTicks={100}
        onEngineStop={() => fgRef.current?.zoomToFit(400, 50)}
      />
    </GraphPanel>
  )
}

export default KnowledgeGraph