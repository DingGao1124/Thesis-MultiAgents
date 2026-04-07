import { Boxes, FileText, Link2, Network, Workflow } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import type { KnowledgeGraphData, KnowledgeNode } from "../data"

type GraphDetailProps = {
  graph: KnowledgeGraphData
  selectedNode: KnowledgeNode | null
}

export default function GraphDetail({ graph }: GraphDetailProps) {
  const lineCount = graph.nodes.filter((node) => node.group === "line").length
  const moduleCount = graph.nodes.filter((node) => node.group === "module").length
  const unitCount = graph.nodes.filter((node) => node.group === "unit").length
  const documentCount = graph.nodes.filter((node) => node.group === "document").length

  return (
    <Card className="py-0 gap-0 flex h-57 shrink-0 flex-col overflow-hidden rounded-xl border-slate-200 bg-white/92 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <CardHeader className="px-4 pb-1.5 pt-3">
        <div className="flex items-center justify-between gap-1">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Network className="size-4" />
            图谱概览
          </CardTitle>
          <Badge variant="outline" className="rounded-full border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-600">
            当前图谱
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col px-4 mb-2">
        <div className="grid flex-1 grid-cols-2 gap-1.5"> 
          <div className="rounded-[10px] border border-slate-200 bg-slate-50/80 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Boxes className="size-3.5" />
              节点总数
            </div>
            <div className="mt-1.5 text-[30px] font-semibold leading-none text-slate-900">{graph.nodes.length}</div>
          </div>

          <div className="rounded-[10px] border border-slate-200 bg-slate-50/80 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Link2 className="size-3.5" />
              关系总数
            </div>
            <div className="mt-1.5 text-[30px] font-semibold leading-none text-slate-900">{graph.links.length}</div>
          </div>

          <div className="rounded-[10px] border border-slate-200 bg-slate-50/80 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <Workflow className="size-3.5" />
              层级结构
            </div>
            <div className="mt-1.5 text-lg font-semibold leading-none text-slate-900">
              {lineCount}/{moduleCount}/{unitCount}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">产线 / 模块 / 单元</div>
          </div>

          <div className="rounded-[10px] border border-slate-200 bg-slate-50/80 px-3 py-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <FileText className="size-3.5" />
              文档节点
            </div>
            <div className="mt-1.5 text-lg font-semibold leading-none text-slate-900">{documentCount}</div>
            <div className="mt-0.5 text-[11px] text-slate-500">关联知识资源</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
