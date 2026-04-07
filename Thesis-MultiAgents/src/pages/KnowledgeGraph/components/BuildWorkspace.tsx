import { useEffect, useState } from "react"
import {
  CheckCircle2,
  Clock3,
  ChevronDown,
  Eye,
  FileImage,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  Pencil,
  Play,
  Plus,
  ArrowRight,
  Search,
  Trash2,
  Loader,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import type { KnowledgeGraphView } from ".."
import {
  buildStages,
  cypherExamples,
  knowledgeGraphExample,
  mockFiles,
  statusLabelMap,
  type KnowledgeFile,
  type KnowledgeFileStatus,
  type KnowledgeGraphData,
} from "../data"
import EChartsForceGraph from "./EChartsForceGraph"
import GraphDetail from "./GraphDetail"
import NodeDetail from "./NodeDetail"

const statusTone: Record<KnowledgeFileStatus, string> = {
  uploaded: "bg-slate-100 text-slate-600 border-slate-200",
  queued: "bg-blue-50 text-blue-700 border-blue-200",
  extracting: "bg-violet-50 text-violet-700 border-violet-200",
  aligning: "bg-amber-50 text-amber-700 border-amber-200",
  summarizing: "bg-cyan-50 text-cyan-700 border-cyan-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

function getFileIcon(kind: KnowledgeFile["kind"]) {
  if (kind === "pdf" || kind === "docx") return FileText
  if (kind === "xlsx") return FileSpreadsheet
  return FileImage
}

type BuildWorkspaceProps = {
  onViewChange: (view: KnowledgeGraphView) => void
}

export default function BuildWorkspace({ onViewChange }: BuildWorkspaceProps) {
  const [files, setFiles] = useState(mockFiles)
  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [buildTargetId, setBuildTargetId] = useState<string | null>(null)
  const [activeStageIndex, setActiveStageIndex] = useState(0)
  const [graphData, setGraphData] = useState<KnowledgeGraphData>(knowledgeGraphExample)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [cypherInput, setCypherInput] = useState("")
  const [queryRowCount, setQueryRowCount] = useState<number | null>(null)
  const [hasExecutedCypher, setHasExecutedCypher] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<KnowledgeFile | null>(null)
  const [progressOpen, setProgressOpen] = useState(false)

  const uploadedFiles = files
  const processingFiles = files.filter((file) =>
    ["queued", "extracting", "aligning", "summarizing"].includes(file.status)
  )
  const uploadTaskFiles = files.filter((file) => file.status === "uploaded" && file.progress < 100)
  const selectedFile =
    files.find((item) => item.id === buildTargetId) ??
    processingFiles[0] ??
    files[0] ??
    null
  const selectedNode = graphData.nodes.find((node) => node.id === selectedNodeId) ?? null
  const completedCount = files.filter((file) => file.status === "completed").length
  const currentStageKey = selectedFile?.status ?? "uploaded"
  const stageIndex = buildStages.findIndex((stage) => stage.key === currentStageKey)
  const currentStage = buildStages[Math.max(stageIndex, 0)] ?? buildStages[0]

  useEffect(() => {
    if (!buildTargetId) return

    if (activeStageIndex >= buildStages.length) {
      setBuildTargetId(null)
      setGraphData(knowledgeGraphExample)
      setQueryRowCount(null)
      setCypherInput("")
      setHasExecutedCypher(false)
      return
    }

    const stage = buildStages[activeStageIndex]
    const progress = Math.round(((activeStageIndex + 1) / buildStages.length) * 100)

    setFiles((current) =>
      current.map((file) =>
        file.id === buildTargetId
          ? { ...file, status: stage.key, progress, updatedAt: "2026-04-07 11:35" }
          : file
      )
    )

    const timer = window.setTimeout(() => {
      setActiveStageIndex((index) => index + 1)
    }, 900)

    return () => window.clearTimeout(timer)
  }, [activeStageIndex, buildTargetId])

  function handleUploadMockFile() {
    const nextFile: KnowledgeFile = {
      id: `file-${Date.now()}`,
      name: "新增运行日报.pdf",
      kind: "pdf",
      size: "5.2 MB",
      source: "手动上传",
      updatedAt: "2026-04-07 11:31",
      status: "uploaded",
      progress: 12,
      summary: "用于前端展示的 mock 文件，包含运行态和单元 warning 信息。",
      preview:
        "日报记录了产线 A 的节拍波动、转运口拥堵与视觉复检情况，涉及 M-ASM-02、U-CNV-07 与 U-VSN-03。",
      tags: ["新增", "运行态", "Mock"],
    }

    setFiles((current) => [nextFile, ...current].slice(0, 12))
    setEditingFileId(null)
  }

  function handleDeleteFile(fileId: string) {
    const nextFiles = files.filter((file) => file.id !== fileId)
    setFiles(nextFiles)
  }

  function handleStartRename(file: KnowledgeFile) {
    setEditingFileId(file.id)
    setEditingName(file.name)
  }

  function handleCommitRename() {
    if (!editingFileId || !editingName.trim()) {
      setEditingFileId(null)
      return
    }

    setFiles((current) =>
      current.map((file) =>
        file.id === editingFileId ? { ...file, name: editingName.trim() } : file
      )
    )
    setEditingFileId(null)
  }

  function handleBuildGraph() {
    const target = selectedFile ?? files[0]
    if (!target) return
    setBuildTargetId(target.id)
    setActiveStageIndex(0)
    setGraphData(knowledgeGraphExample)
    setSelectedNodeId(null)
  }

  function handleRunCypher() {
    // Placeholder for backend response wiring.
    setQueryRowCount(null)
    setGraphData(knowledgeGraphExample)
    setSelectedNodeId(null)
    setHasExecutedCypher(true)
  }

  function handleResetCypher() {
    setCypherInput("")
    setQueryRowCount(null)
    setGraphData(knowledgeGraphExample)
    setSelectedNodeId(null)
    setHasExecutedCypher(false)
  }

  function handleOpenPreview(file: KnowledgeFile) {
    setPreviewFile(file)
    setPreviewOpen(true)
  }

  return (
    <>
      <div className="grid h-full min-h-0 gap-2.5 xl:grid-cols-[360px_minmax(0,1fr)_286px]">
        <div className="min-h-0 rounded-xl border border-slate-200 bg-white/94 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <div className="grid h-full min-h-0 grid-rows-[82px_minmax(0,1fr)_222px] gap-2 p-2.5">
            <section className="rounded-xl border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)] p-1.5 h-full">
              <div className="flex h-full items-center justify-between gap-1.5">
                <div className="grid h-full flex-1 grid-cols-3 gap-1.5">
                  {[
                    {
                      label: "文件",
                      value: files.length,
                      badge: "总量",
                      badgeTone: "border-slate-200 bg-slate-100 text-slate-600",
                    },
                    {
                      label: "完成",
                      value: completedCount,
                      badge: "完成",
                      badgeTone: "border-emerald-200 bg-emerald-50 text-emerald-700",
                    },
                    {
                      label: "处理中",
                      value: processingFiles.length,
                      badge: "进行中",
                      badgeTone: "border-blue-200 bg-blue-50 text-blue-700",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex h-full min-w-0 flex-col justify-center rounded-[10px] border border-slate-200 bg-white/95 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
                    >
                      <div className="flex items-center justify-between gap-0.5">
                        <div className="whitespace-nowrap text-[10px] font-medium text-slate-500">{item.label}</div>
                        <Badge
                          variant="outline"
                          className={cn("h-4 whitespace-nowrap rounded-full px-1 text-[8px] font-medium leading-none", item.badgeTone)}
                        >
                          {item.badge}
                        </Badge>
                      </div>
                      <div className="mt-1 px-0.5 text-[1.5rem] font-semibold leading-none tracking-tight text-slate-900">{item.value}</div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={handleUploadMockFile}
                  className="h-full shrink-0 flex-col gap-1 rounded-[10px] bg-slate-950 px-2 py-0 text-[11px] font-medium text-white shadow-[0_6px_14px_rgba(15,23,42,0.2)] transition hover:bg-slate-900"
                >
                  <Plus className="size-3" />
                  上传
                </Button>
              </div>
            </section>

            <section className="min-h-0 rounded-xl border border-slate-200 bg-slate-50/90">
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5">
                <div className="text-sm font-semibold text-slate-900">已上传文件列表</div>
                <div className="text-xs text-slate-500">{uploadedFiles.length} 项</div>
              </div>

              <div className="grid h-[calc(100%-57px)] auto-rows-max gap-1.5 overflow-y-auto px-2 py-2">
                {uploadedFiles.map((file) => {
                  const Icon = getFileIcon(file.kind)

                  return (
                    <div
                      key={file.id}
                      className="grid h-18 grid-cols-[30px_minmax(0,1fr)_86px] items-center gap-1.5 rounded-[10px] border border-slate-200 bg-white px-2 py-1.5 text-left transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                        <Icon className="size-3.5" />
                      </div>

                      <div className="min-w-0">
                        {editingFileId === file.id ? (
                          <Input
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            onBlur={handleCommitRename}
                            onKeyDown={(event) => {
                              if (event.key === "Enter") handleCommitRename()
                            }}
                            autoFocus
                            className="h-7 rounded-xl border-0 px-2 text-sm shadow-none"
                          />
                        ) : (
                          <div className="line-clamp-1 text-sm font-medium text-slate-900">{file.name}</div>
                        )}

                        <div className="mt-1 truncate text-[11px] text-slate-500">
                          {file.source} · {file.size}
                        </div>
                      </div>

                      <div className="grid justify-items-end gap-1">
                        <Badge
                          variant="outline"
                          className={cn("h-5 rounded-full border px-1.5 text-[10px]", statusTone[file.status])}
                        >
                          {statusLabelMap[file.status]}
                        </Badge>

                        <div className="flex items-center gap-0.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-[7px] text-slate-600"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleOpenPreview(file)
                            }}
                          >
                            <Eye className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-[7px] text-slate-600"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleStartRename(file)
                            }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-[7px] text-slate-600"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleDeleteFile(file.id)
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="min-h-0 rounded-xl border border-slate-200 bg-slate-50/90">
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5">
                <div className="text-sm font-semibold text-slate-900">当前上传任务</div>
                <div className="text-xs text-slate-500">{uploadTaskFiles.length} 项</div>
              </div>

              <div className="grid max-h-[calc(100%-57px)] auto-rows-max gap-2 overflow-y-auto px-2 py-2">
                {uploadTaskFiles.length > 0 ? (
                  uploadTaskFiles.map((file) => (
                    <div key={file.id} className="rounded-[10px] border border-slate-200 bg-white px-3 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="truncate text-sm font-medium text-slate-900">{file.name}</div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px]",
                            file.progress >= 100
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-blue-200 bg-blue-50 text-blue-700"
                          )}
                        >
                          {file.progress >= 100 ? "已上传" : "上传中"}
                        </Badge>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        {file.source} · {file.updatedAt}
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-slate-900" style={{ width: `${file.progress}%` }} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[10px] border border-dashed border-slate-300 bg-white px-3 py-10 text-sm text-slate-500">
                    当前没有正在处理的上传任务。
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-1">
          <Card className="gap-2 pt-1.5 pb-0.5 overflow-hidden rounded-xl border-slate-200 bg-white/92 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <CardHeader className="gap-1 pl-3 pr-2 pt-1">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    <Search className="size-4" />
                    Cypher查询
                  </CardTitle>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleBuildGraph}
                    disabled={Boolean(buildTargetId)}
                    className="h-7 rounded-[10px] bg-slate-950 px-2 text-xs text-white disabled:bg-slate-300"
                  >
                    {buildTargetId ? <LoaderCircle className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                    {buildTargetId ? "构建中" : "开始构建"}
                  </Button>
                  <Button variant="outline" onClick={handleResetCypher} className="h-7 rounded-[10px] border-slate-300 px-2 text-xs">
                    重置
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-2 pb-1.5">
              <div className="grid gap-1 xl:grid-cols-[minmax(0,1fr)_118px]">
                <div className="grid gap-2">
                  <div className="flex flex-wrap gap-1">
                    {cypherExamples.map((example) => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setCypherInput(example)}
                        className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600 hover:border-slate-300 hover:text-slate-900"
                      >
                        {example}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-[10px] border border-slate-200 bg-white px-2 py-0.5">
                    <textarea
                      value={cypherInput}
                      onChange={(event) => setCypherInput(event.target.value)}
                      placeholder="MATCH (n)-[r]->(m) RETURN n,r,m LIMIT 25"
                      className="min-h-10 w-full resize-none border-0 bg-transparent font-mono text-sm text-slate-800 outline-none p-0.5"
                    />
                  </div>
                </div>

                <div className="grid gap-1">
                  <Button onClick={handleRunCypher} className="h-8 rounded-[10px] bg-sky-600 text-xs text-white hover:bg-sky-700">
                    <Search className="size-3.5" />
                    执行查询
                  </Button>

                  <div className="rounded-[10px] border border-slate-200 bg-white px-2 py-1">
                    <div className="text-[10px] text-slate-500">结果数</div>
                    <div className="mt-0.5 text-xl font-semibold leading-none text-slate-900">
                      {hasExecutedCypher ? queryRowCount : "--"}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="p-2 min-h-0 rounded-xl border-slate-200 bg-white/92 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <CardContent className="h-full p-1">
              <EChartsForceGraph
                graph={graphData}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex h-full min-h-0 flex-col gap-1">
          <GraphDetail graph={graphData} selectedNode={selectedNode} />
          <NodeDetail graph={graphData} selectedNode={selectedNode} />
          <Card className="h-55 shrink-0 py-2 gap-3 overflow-hidden rounded-xl border-slate-200 bg-white/92 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
            <CardHeader className="px-3 -mb-2 mt-0.5">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  <Loader className="size-4" />
                  当前进程
                </CardTitle>
                <button
                  type="button"
                  onClick={() => onViewChange("qa")}
                  className="group inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900"
                >
                  进入智能体问答
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="h-[calc(100%-50px)] px-3">
              <button
                type="button"
                onClick={() => setProgressOpen(true)}
                className="flex h-full w-full flex-col overflow-hidden rounded-[10px] border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-slate-300 hover:bg-slate-100/70"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{currentStage.label}</div>
                    <div className="max-w-47.5 truncate text-xs text-slate-500">{selectedFile?.name ?? "未选择文件"}</div>
                  </div>
                </div>

                <div className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{currentStage.description}</div>

                <div className="mt-auto h-1.5 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-slate-900" style={{ width: `${selectedFile?.progress ?? 0}%` }} />
                </div>
                <div className="mt-2 text-xs text-slate-500">进度 {selectedFile?.progress ?? 0}%</div>
              </button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-160 rounded-xl border-slate-200">
          <DialogHeader>
            <DialogTitle>文档预览</DialogTitle>
            <DialogDescription>
              {previewFile ? `当前文件：${previewFile.name}` : "当前文件预览"}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
            <div className="text-sm font-medium text-slate-900">预览 Modal 待开发</div>
            <div className="mt-2 text-sm text-slate-500">
              后续这里可以接入 PDF、DOCX、图片文件的真实预览能力。
            </div>
          </div>

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>

      <Dialog open={progressOpen} onOpenChange={setProgressOpen}>
        <DialogContent className="max-w-130 rounded-xl border-slate-200 p-4">
          <DialogHeader>
            <DialogTitle>完整进程</DialogTitle>
            <DialogDescription>
              {selectedFile ? `${selectedFile.name} 的构建阶段` : "当前构建阶段"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-1.5">
            {buildStages.map((stage, index) => {
              const passed = index < Math.max(stageIndex, 0)
              const active = stage.key === currentStage.key
              const statusText = active ? "当前阶段" : passed ? "已完成" : "待执行"
              const StageIcon = active ? LoaderCircle : passed ? CheckCircle2 : Clock3

              return (
                <div key={stage.key} className="grid justify-items-center gap-0">
                  <div
                    className={cn(
                      "w-full rounded-[14px] border px-3.5 py-3",
                      active
                        ? "border-slate-900 bg-slate-950 text-white"
                        : passed
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-slate-200 bg-slate-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border",
                            active
                              ? "border-white/15 bg-white/10 text-white"
                              : passed
                                ? "border-emerald-200 bg-white text-emerald-600"
                                : "border-slate-200 bg-white text-slate-400"
                          )}
                        >
                          <StageIcon className={cn("size-4.5", active && "animate-spin")} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{stage.label}</div>
                          <div className={cn("mt-1 text-xs", active ? "text-slate-300" : "text-slate-400")}>
                            Step {index + 1}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] leading-4",
                          active
                            ? "border-white/20 bg-white/10 text-white"
                            : passed
                              ? "border-emerald-200 bg-white text-emerald-700"
                              : "border-slate-200 bg-white text-slate-500"
                        )}
                      >
                        {statusText}
                      </Badge>
                    </div>
                    <div className={cn("mt-2 pl-12 text-[13px] leading-5", active ? "text-slate-300" : "text-slate-500")}>
                      {stage.description}
                    </div>
                  </div>

                  {index < buildStages.length - 1 ? (
                    <div className="flex h-8 flex-col items-center justify-center">
                      <div
                        className={cn(
                          "h-3 w-0.5 rounded-full",
                          passed || active ? "bg-slate-900" : "bg-slate-200"
                        )}
                      />
                      <ChevronDown
                        className={cn(
                          "mt-0.5 size-3.5",
                          passed || active ? "text-slate-900" : "text-slate-300"
                        )}
                      />
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </>
  )
}
