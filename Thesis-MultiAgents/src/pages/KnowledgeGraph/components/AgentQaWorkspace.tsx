import { useState } from "react"
import { ArrowUpRight, BrainCircuit, Database, FileJson2, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { KnowledgeGraphView } from ".."
import {
  knowledgeGraphExample,
  qaMessages,
  qaStructuredResult,
  qaSuggestions,
  type QaMessage,
} from "../data"
import EChartsForceGraph from "./EChartsForceGraph"

const qaAnswerMap: Record<string, QaMessage> = {
  [qaSuggestions[0]]: {
    id: "qa-answer-1",
    role: "assistant",
    content:
      "M-ASM-02 位于缓存模块 M-BUF-01 与物流转运模块 M-TRF-01 之间，是当前产线的装配核心。它直接挂接 U-RBT-02、U-TCL-01、U-CNV-07、U-PRS-01 和 U-TOR-02 等关键单元，其中 U-CNV-07 负责跨模块转运衔接，U-TOR-02 与压装单元共同影响当前节拍波动。相关工艺约束由工艺说明、任务树快照和社区摘要 C-02 提供。",
  },
  [qaSuggestions[1]]: {
    id: "qa-answer-2",
    role: "assistant",
    content:
      "当前 warning 节点包括模块 M-ASM-02、M-QC-01，单元 U-CNV-07、U-TOR-02、U-VSN-03、U-DBO-01，以及文档节点质检阈值表。图谱语义表明，warning 主要由转运段拥堵、终检复判频次升高和阈值更新未完成共同触发，适合智能体优先排查装配等待链、视觉置信度和缺陷判定负载。",
  },
  [qaSuggestions[2]]: {
    id: "qa-answer-3",
    role: "assistant",
    content:
      "已整理出适合程序化调用的质检模块 JSON，包含模块状态、关键单元、返修去向以及关联证据文档字段，后续可以直接替换为后端结构化输出接口。",
  },
}

type AgentQaWorkspaceProps = {
  activeView: KnowledgeGraphView
  onViewChange: (view: KnowledgeGraphView) => void
}

export default function AgentQaWorkspace({ activeView, onViewChange }: AgentQaWorkspaceProps) {
  const [messages, setMessages] = useState(qaMessages)
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null)

  function handleAsk(question: string) {
    const answer = qaAnswerMap[question]
    setActiveQuestion(question)
    setMessages([...qaMessages, { id: `user-${question}`, role: "user", content: question }, answer])
  }

  return (
    <div className="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="min-h-0 rounded-[14px] border-slate-200 bg-white/92 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <CardHeader className="gap-3 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div>
                <CardTitle className="text-sm text-slate-900">Agent QA</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  使用增强后的 LS-MS-US 图谱数据演示 Hybrid RAG 与结构化输出
                </CardDescription>
              </div>

              <div className="flex items-center rounded-[10px] border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => onViewChange("build")}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-sm transition",
                    activeView === "build"
                      ? "bg-white font-medium text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  图谱构建
                </button>
                <button
                  type="button"
                  onClick={() => onViewChange("qa")}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-sm transition",
                    activeView === "qa"
                      ? "bg-white font-medium text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  智能体问答
                </button>
              </div>
            </div>

            <Badge variant="outline" className="rounded-full border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
              Synthetic Graph
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {qaSuggestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => handleAsk(question)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
              >
                {question}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="grid min-h-0 gap-3 px-3 pb-3 xl:grid-cols-[minmax(0,1fr)_300px]">
          <Card className="min-h-0 rounded-2xl border-slate-200 bg-slate-50 shadow-none">
            <CardHeader className="px-4 py-3">
              <CardTitle className="text-sm text-slate-900">对话记录</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-4">
              {messages.slice(-4).map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "assistant"
                      ? "border border-slate-200 bg-white text-slate-700"
                      : "ml-auto bg-slate-950 text-white"
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-3">
            <Card className="rounded-2xl border-slate-200 bg-slate-50 shadow-none">
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-sm text-slate-900">检索链路</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-4">
                {[
                  {
                    icon: Database,
                    title: "向量 + BM25",
                    text: "从社区摘要、模块拓扑、设备名称和文档片段中召回上下文。",
                  },
                  {
                    icon: BrainCircuit,
                    title: "RRF 重排",
                    text: "融合词法匹配与语义匹配，压缩出当前最相关的证据窗口。",
                  },
                  {
                    icon: Sparkles,
                    title: "结构化生成",
                    text: "将图谱结果整理为 JSON，便于多智能体程序调用。",
                  },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="rounded-[10px] border border-slate-200 bg-white p-3">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{item.title}</div>
                          <div className="mt-1 text-xs leading-5 text-slate-500">{item.text}</div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-slate-50 shadow-none">
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-sm text-slate-900">结构化结果</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  {activeQuestion ?? "默认显示质检模块 JSON"}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="rounded-[10px] border border-slate-200 bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                  <div className="mb-3 flex items-center gap-2 text-slate-300">
                    <FileJson2 className="size-4" />
                    JSON
                  </div>
                  <pre className="whitespace-pre-wrap break-all font-mono">
                    {JSON.stringify(qaStructuredResult, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="grid min-h-0 grid-rows-[1fr_168px] gap-3">
        <Card className="min-h-0 rounded-[14px] border-slate-200 bg-white/92 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm text-slate-900">证据子图</CardTitle>
          </CardHeader>
          <CardContent className="h-full min-h-0 px-3 pb-3">
            <EChartsForceGraph
              graph={knowledgeGraphExample}
              selectedNodeId="module-qc-01"
            />
          </CardContent>
        </Card>

        <Card className="rounded-[14px] border-slate-200 bg-white/92 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <CardHeader className="px-4 py-3">
            <CardTitle className="text-sm text-slate-900">待接后端能力</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-4">
            {[
              "Cypher 查询结果实时注入",
              "Hybrid RAG 得分明细",
              "语义过滤阈值设置",
              "流式回答与工具调用轨迹",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
              >
                <span>{item}</span>
                <ArrowUpRight className="size-4 text-slate-400" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
