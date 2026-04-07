import { Boxes, Hash, Info, ScanSearch } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { KnowledgeGraphData, KnowledgeNode } from "../data"

type NodeDetailProps = {
  graph: KnowledgeGraphData
  selectedNode: KnowledgeNode | null
}

const nodeGroupTone: Record<KnowledgeNode["group"], string> = {
  line: "border-[#f6c54f] bg-[rgba(246,197,79,0.14)] text-[#8a5d00]",
  module: "border-[#d8a7df] bg-[rgba(216,167,223,0.16)] text-[#7a3f86]",
  unit: "border-[#8ec5ff] bg-[rgba(142,197,255,0.16)] text-[#155f9b]",
  document: "border-[#95d89b] bg-[rgba(149,216,155,0.16)] text-[#256f2e]",
}

const relationToneMap: Record<KnowledgeNode["group"], string> = {
  line: "border-[#fde68a] bg-[#fffbeb] text-[#92400e]",
  module: "border-[#e9d5ff] bg-[#faf5ff] text-[#7e22ce]",
  unit: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
  document: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
}

const nodeGroupLabelMap: Record<KnowledgeNode["group"], string> = {
  line: "产线",
  module: "模块",
  unit: "单元",
  document: "文档",
}

export default function NodeDetail({ graph, selectedNode }: NodeDetailProps) {
  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]))
  const relatedLinks = selectedNode
    ? graph.links
      .filter((link) => link.source === selectedNode.id || link.target === selectedNode.id)
      .map((link) => {
        const isOutgoing = link.source === selectedNode.id
        const relatedId = isOutgoing ? link.target : link.source
        const relatedNode = nodeMap.get(relatedId)

        return {
          key: `${link.source}-${link.type}-${link.target}`,
          relation: link.type,
          direction: isOutgoing ? "出向" : "入向",
          relatedId,
          relatedTitle: relatedNode?.title ?? relatedId,
          relatedGroup: relatedNode?.group,
        }
      })
    : []

  return (
    <Card className="py-0 gap-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border-slate-200 bg-white/92 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <CardHeader className="px-4 pt-3 pb-1">
        <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <Info className="size-4"/>
          节点详情
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-4 pb-4">
        {selectedNode ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
            <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-xl font-semibold text-slate-900">{selectedNode.title}</div>
                  <div className="mt-1 text-sm leading-6 text-slate-500">{selectedNode.subtitle || "当前节点暂无补充描述"}</div>
                </div>
                <Badge variant="outline" className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[11px]", nodeGroupTone[selectedNode.group])}>
                  {nodeGroupLabelMap[selectedNode.group]}
                </Badge>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-[10px] border border-slate-200 bg-white px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Hash className="size-3.5" />
                    节点 ID
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-800">{selectedNode.id}</div>
                </div>
                <div className="rounded-[10px] border border-slate-200 bg-white px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Boxes className="size-3.5" />
                    节点类型
                  </div>
                  <div className="mt-1 text-sm font-medium text-slate-800">{nodeGroupLabelMap[selectedNode.group]}</div>
                </div>
              </div>
            </div>

            <div className="rounded-[12px] border border-slate-200 bg-slate-50/90 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <ScanSearch className="size-4" />
                  关联关系
                </div>
                <div className="text-xs text-slate-500">{relatedLinks.length} 条</div>
              </div>

              {relatedLinks.length > 0 ? (
                <div className="mt-3 grid gap-2">
                  {relatedLinks.map((item) => (
                    <div key={item.key} className="rounded-[10px] border border-slate-200 bg-white px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-medium text-slate-800">{item.relatedTitle}</div>
                        {item.relatedGroup ? (
                          <Badge
                            variant="outline"
                            className={cn("rounded-full border px-2 py-0.5 text-[10px]", relationToneMap[item.relatedGroup])}
                          >
                            {nodeGroupLabelMap[item.relatedGroup]}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <Badge variant="outline" className="rounded-full border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600">
                          {item.direction}
                        </Badge>
                        <span>{item.relation}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{item.relatedId}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-[10px] border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                  当前节点暂无关联关系
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-[12px] border border-dashed border-slate-300 bg-slate-50/90 px-4 text-sm text-slate-500">
            请选择图谱节点以查看当前节点及其关系信息
          </div>
        )}
      </CardContent>
    </Card>
  )
}
