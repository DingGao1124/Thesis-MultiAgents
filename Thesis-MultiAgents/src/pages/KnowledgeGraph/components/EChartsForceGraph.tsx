import { useEffect, useRef } from "react"
import * as echarts from "echarts/core"
import {
  LegendComponent,
  ThumbnailComponent,
  TooltipComponent,
  type LegendComponentOption,
  type ThumbnailComponentOption,
  type TooltipComponentOption,
} from "echarts/components"
import { GraphChart, type GraphSeriesOption } from "echarts/charts"
import { CanvasRenderer } from "echarts/renderers"

import type { KnowledgeGraphData, KnowledgeNode } from "../data"

echarts.use([ThumbnailComponent, LegendComponent, TooltipComponent, GraphChart, CanvasRenderer])

type EChartsOption = echarts.ComposeOption<
  ThumbnailComponentOption | LegendComponentOption | TooltipComponentOption | GraphSeriesOption
>

type EChartsForceGraphProps = {
  graph: KnowledgeGraphData
  selectedNodeId?: string | null
  onSelectNode?: (nodeId: string) => void
}

const nodeColorMap: Record<KnowledgeNode["group"], string> = {
  line: "#f6c54f",
  module: "#d8a7df",
  unit: "#8ec5ff",
  document: "#95d89b",
}

const nodeSizeMap: Record<KnowledgeNode["group"], number> = {
  line: 58,
  module: 44,
  unit: 30,
  document: 26,
}

const categoryNameMap: Record<KnowledgeNode["group"], string> = {
  line: "产线层",
  module: "模块层",
  unit: "单元层",
  document: "文本文档层",
}

const categoryIndexMap: Record<KnowledgeNode["group"], number> = {
  line: 0,
  module: 1,
  unit: 2,
  document: 3,
}

const groupOrder: KnowledgeNode["group"][] = ["line", "module", "unit", "document"]

export default function EChartsForceGraph({
  graph,
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
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.current)
    window.addEventListener("resize", handleResize)

    chart.on("click", (params) => {
      if (params.dataType !== "node") return
      const data = params.data as { id?: string | number } | undefined
      if (data?.id == null) return
      onSelectNode?.(String(data.id))
    })

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", handleResize)
      chart.dispose()
      chartRef.current = null
    }
  }, [onSelectNode])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return

    const largeGraph = graph.nodes.length > 60

    const option: EChartsOption = {
      legend: {
        left: 12,
        top: 10,
        selectedMode: false,
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 10,
        icon: "circle",
        textStyle: {
          color: "#334155",
          fontSize: 11,
        },
        data: Object.values(categoryNameMap),
      },
      tooltip: {
        formatter(params: any) {
          if (params.dataType === "edge") {
            return `${params.data.source} -> ${params.data.target}<br/>Relation: ${params.data.relation}`
          }

          const data = params.data as { name?: string; subtitle?: string; status?: string } | undefined
          if (!data) return ""
          return [
            data.name,
            data.subtitle ? `<br/>${data.subtitle}` : "",
            data.status ? `<br/>Status: ${data.status}` : "",
          ].join("")
        },
      },
      animationDurationUpdate: 300,
      series: [
        {
          type: "graph",
          layout: "force",
          animation: true,
          roam: true,
          draggable: true,
          emphasis: {
            focus: "adjacency",
            scale: true,
          },
          force: {
            repulsion: largeGraph ? 220 : 260,
            edgeLength: largeGraph ? [50, 82] : [64, 96],
            gravity: 0.16,
            friction: 0.32,
            layoutAnimation: true,
          },
          label: {
            show: true,
            position: "inside",
            distance: 5,
            fontSize: largeGraph ? 8 : 11,
            color: "#1f2937",
            formatter(params: any) {
              const data = params.data as { name?: string } | undefined
              return data?.name ?? ""
            },
          },
          edgeLabel: {
            show: true,
            position: "middle",
            distance: 0,
            fontSize: largeGraph ? 8 : 10,
            color: "#64748b",
            formatter(params: any) {
              return params.data.relation
            },
          },
          lineStyle: {
            color: "#94a3b8",
            width: largeGraph ? 0.9 : 1.2,
            opacity: largeGraph ? 0.5 : 0.9,
            curveness: largeGraph ? 0.08 : 0.03,
          },
          edgeSymbol: ["none", "arrow"],
          edgeSymbolSize: 6,
          categories: groupOrder.map((group) => ({
            name: categoryNameMap[group],
            itemStyle: {
              color: nodeColorMap[group],
            },
          })),
          data: graph.nodes.map((node) => {
            const isSelected = selectedNodeId === node.id
            return {
              id: node.id,
              name: node.title,
              subtitle: node.subtitle,
              status: node.status,
              category: categoryIndexMap[node.group],
              fixed: false,
              draggable: true,
              symbolSize: isSelected ? nodeSizeMap[node.group] + 6 : nodeSizeMap[node.group],
              itemStyle: {
                color: nodeColorMap[node.group],
                borderColor: isSelected ? "red" : "#475569",
                borderWidth: isSelected ? 2 : 1,
              },
            }
          }),
          links: graph.links.map((link) => ({
            source: String(link.source),
            target: String(link.target),
            relation: link.type,
          })),
        },
      ],
      thumbnail: {
        width: "15%",
        height: "15%",
        windowStyle: {
          color: "rgba(140, 212, 250, 0.5)",
          borderColor: "rgba(30, 64, 175, 0.7)",
          opacity: 1,
        },
      },
    }

    chart.setOption(option, {
      notMerge: false,
      lazyUpdate: true,
    })
  }, [graph, selectedNodeId])

  return (
    <div
      ref={containerRef}
      className="h-full min-h-125 w-full rounded-xl border border-slate-200"
      style={{
        backgroundColor: "#f8fafc",
        backgroundImage: "radial-gradient(circle, rgba(148, 163, 184, 0.4) 1px, transparent 1.1px)",
        backgroundSize: "18px 18px",
        backgroundPosition: "0 0",
      }}
    />
  )
}
