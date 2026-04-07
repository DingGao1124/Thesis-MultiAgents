import { useEffect, useRef } from "react"
import * as echarts from "echarts"

import type { KnowledgeGraphData, KnowledgeNode } from "../data"

type EChartsForceGraphProps = {
  graph: KnowledgeGraphData
  focusedNodeIds?: string[]
  selectedNodeId?: string | null
  onSelectNode?: (nodeId: string) => void
}

const categoryMeta = {
  line: {
    name: "产线层",
    color: "#f6c54f",
    border: "#c48a17",
    size: 82,
  },
  module: {
    name: "模块层",
    color: "#d8a7df",
    border: "#9d5ca9",
    size: 66,
  },
  unit: {
    name: "单元层",
    color: "#8ec5ff",
    border: "#3577c6",
    size: 56,
  },
  document: {
    name: "文档节点",
    color: "#95d89b",
    border: "#4f9d56",
    size: 50,
  },
} satisfies Record<
  KnowledgeNode["group"],
  { name: string; color: string; border: string; size: number }
>

const statusTextMap = {
  running: "running",
  idle: "idle",
  warning: "warning",
  offline: "offline",
} satisfies Record<NonNullable<KnowledgeNode["status"]>, string>

function getOpacity(nodeId: string, focusedNodeIds: string[]) {
  if (focusedNodeIds.length === 0) return 1
  return focusedNodeIds.includes(nodeId) ? 1 : 0.2
}

export default function EChartsForceGraph({
  graph,
  focusedNodeIds = [],
  selectedNodeId,
  onSelectNode,
}: EChartsForceGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = echarts.init(containerRef.current, undefined, { renderer: "canvas" })
    chartRef.current = chart

    const handleResize = () => chart.resize()
    const resizeObserver = new ResizeObserver(() => chart.resize())
    resizeObserver.observe(containerRef.current)
    window.addEventListener("resize", handleResize)

    chart.on("click", (params) => {
      if (params.dataType === "node" && params.data && "id" in (params.data as object)) {
        onSelectNode?.(String((params.data as { id: string }).id))
      }
    })

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", handleResize)
      chart.dispose()
      chartRef.current = null
    }
  }, [onSelectNode])

  useEffect(() => {
    if (!chartRef.current) return

    const option: echarts.EChartsOption = {
      animationDuration: 500,
      animationEasingUpdate: "cubicOut",
      tooltip: {
        backgroundColor: "rgba(255,255,255,0.97)",
        borderColor: "#cbd5e1",
        borderWidth: 1,
        textStyle: {
          color: "#0f172a",
          fontSize: 12,
        },
        formatter(params: any) {
          if (params.dataType === "edge") {
            return `${params.data.source} → ${params.data.target}<br/>关系：${params.data.relation}`
          }

          const node = params.data as {
            title: string
            layerLabel: string
            subtitle: string
            status?: KnowledgeNode["status"]
          }
          const status = node.status ? statusTextMap[node.status] : "unknown"
          return `${node.title}<br/>层级：${node.layerLabel}<br/>说明：${node.subtitle}<br/>状态：${status}`
        },
      },
      series: [
        {
          type: "graph",
          layout: "force",
          roam: true,
          draggable: true,
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          force: {
            repulsion: 1200,
            edgeLength: [120, 220],
            gravity: 0.04,
            friction: 0.12,
          },
          edgeSymbol: ["none", "arrow"],
          edgeSymbolSize: 7,
          emphasis: {
            focus: "adjacency",
            scale: true,
          },
          lineStyle: {
            color: "#9aa7b8",
            width: 1.2,
            curveness: 0.08,
            opacity: 0.78,
          },
          label: {
            show: true,
            position: "inside",
            formatter: "{b}",
            color: "#243041",
            fontSize: 11,
            fontWeight: 600,
          },
          edgeLabel: {
            show: true,
            formatter(params: any) {
              return params.data.relation
            },
            color: "#475569",
            fontSize: 10,
            backgroundColor: "rgba(255,255,255,0.95)",
            borderColor: "#d8e0ea",
            borderWidth: 1,
            borderRadius: 8,
            padding: [2, 6],
          },
          categories: Object.values(categoryMeta).map((item) => ({
            name: item.name,
            itemStyle: { color: item.color },
          })),
          data: graph.nodes.map((node) => {
            const meta = categoryMeta[node.group]
            const isSelected = selectedNodeId === node.id
            const opacity = getOpacity(node.id, focusedNodeIds)

            return {
              id: node.id,
              name: node.title,
              title: node.title,
              layerLabel: node.label,
              subtitle: node.subtitle,
              status: node.status,
              category: Object.keys(categoryMeta).indexOf(node.group),
              x: node.fx,
              y: node.fy,
              fixed: typeof node.fx === "number" || typeof node.fy === "number",
              symbol: "circle",
              symbolSize: meta.size,
              itemStyle: {
                color: meta.color,
                opacity,
                borderColor: isSelected ? "#7c2d12" : meta.border,
                borderWidth: isSelected ? 4 : 2,
                shadowBlur: isSelected ? 18 : 6,
                shadowColor: isSelected ? "rgba(124,45,18,0.22)" : "rgba(15,23,42,0.08)",
              },
              label: {
                color: "#243041",
                fontSize: node.group === "line" ? 12 : 10,
                width: meta.size - 12,
                overflow: "break",
                lineHeight: 12,
              },
            }
          }),
          links: graph.links.map((link) => {
            const sourceId = String(link.source)
            const targetId = String(link.target)
            const isFocused =
              focusedNodeIds.length === 0 ||
              (focusedNodeIds.includes(sourceId) && focusedNodeIds.includes(targetId))

            return {
              source: sourceId,
              target: targetId,
              relation: link.type,
              lineStyle: {
                color: "#97a6ba",
                opacity: isFocused ? 0.85 : 0.12,
                width: isFocused ? 1.4 : 0.8,
              },
              label: {
                opacity: isFocused ? 1 : 0,
              },
            }
          }),
        },
      ],
    }

    chartRef.current.setOption(option, true)
  }, [focusedNodeIds, graph, selectedNodeId])

  return (
    <div className="relative h-full min-h-[500px] overflow-hidden rounded-[14px] border border-slate-200 bg-[#fbfcfe]">
      <div
        className="absolute inset-0 opacity-65"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="absolute left-2.5 top-2.5 z-10 flex flex-wrap gap-1.5">
        {Object.values(categoryMeta).map((item) => (
          <div
            key={item.name}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-2 py-0.5 text-[11px] text-slate-700 shadow-sm"
          >
            <span
              className="h-2.5 w-2.5 rounded-full border"
              style={{ backgroundColor: item.color, borderColor: item.border }}
            />
            {item.name}
          </div>
        ))}
      </div>

      <div className="absolute right-2.5 top-2.5 z-10 rounded-[12px] border border-slate-200 bg-white/95 px-2.5 py-1.5 text-[11px] text-slate-700 shadow-sm">
        节点 {graph.nodes.length} / 关系 {graph.links.length}
      </div>

      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}
