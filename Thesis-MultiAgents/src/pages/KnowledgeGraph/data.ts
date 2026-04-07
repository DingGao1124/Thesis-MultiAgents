import {
  cypherExamples,
  knowledgeGraphExample,
} from "./knowledge_data"

export type KnowledgeFileStatus =
  | "uploaded"
  | "queued"
  | "extracting"
  | "aligning"
  | "summarizing"
  | "completed"

export type KnowledgeFile = {
  id: string
  name: string
  kind: "pdf" | "docx" | "xlsx" | "png"
  size: string
  source: string
  updatedAt: string
  status: KnowledgeFileStatus
  progress: number
  summary: string
  preview: string
  tags: string[]
}

export type KnowledgeNode = {
  id: string
  label: string
  group: "line" | "module" | "unit" | "document"
  title: string
  subtitle: string
  status?: "running" | "idle" | "warning" | "offline"
  fx?: number
  fy?: number
}

export type KnowledgeLink = {
  source: string
  target: string
  type: string
}

export type KnowledgeGraphData = {
  nodes: KnowledgeNode[]
  links: KnowledgeLink[]
}

export type QaMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

export const statusLabelMap: Record<KnowledgeFileStatus, string> = {
  uploaded: "已上传",
  queued: "排队中",
  extracting: "抽取中",
  aligning: "对齐中",
  summarizing: "摘要中",
  completed: "已完成",
}

export const buildStages = [
  {
    key: "queued",
    label: "任务接入",
    description: "新文件已登记，正在绑定目标 LS-MS-US 社区范围。",
  },
  {
    key: "extracting",
    label: "Chain-of-IE",
    description: "按工业 Prompt 模板执行实体识别与关系抽取。",
  },
  {
    key: "aligning",
    label: "增量融合",
    description: "按社区摘要限定范围，执行跨模态实体对齐与融合。",
  },
  {
    key: "summarizing",
    label: "社区摘要",
    description: "刷新社区摘要，为 Cypher 和 Agent QA 准备上下文。",
  },
  {
    key: "completed",
    label: "Graph Ready",
    description: "已写入 Line-Module-Unit 图谱，可用于查询与智能体调用。",
  },
] as const satisfies ReadonlyArray<{
  key: KnowledgeFileStatus
  label: string
  description: string
}>

export const mockFiles: KnowledgeFile[] = [
  {
    id: "file-1",
    name: "产线A装配工艺说明.pdf",
    kind: "pdf",
    size: "12.4 MB",
    source: "工艺文档",
    updatedAt: "2026-04-07 09:20",
    status: "completed",
    progress: 100,
    summary: "覆盖上料、视觉初检、装配、质检、分拣与包装全流程。",
    preview:
      "文档定义了 M-ASM-02、M-QC-01 与 M-RWK-01 的任务约束、节拍范围以及跨模块放行条件。",
    tags: ["工艺", "装配", "Line A"],
  },
  {
    id: "file-2",
    name: "机器人单元配置.docx",
    kind: "docx",
    size: "3.8 MB",
    source: "工程规范",
    updatedAt: "2026-04-07 09:48",
    status: "completed",
    progress: 100,
    summary: "包含装配、分拣、返修与包装机械臂的负载、工具与位姿参数。",
    preview:
      "U-RBT-02、U-RBT-04 与 U-RBT-06 的工具切换、抓取范围和站位坐标已完成结构化归档。",
    tags: ["Robot", "模块", "资源"],
  },
  {
    id: "file-3",
    name: "视觉质检映射表.xlsx",
    kind: "xlsx",
    size: "1.1 MB",
    source: "检测表格",
    updatedAt: "2026-04-07 10:02",
    status: "completed",
    progress: 100,
    summary: "记录缺陷标签、阈值区间、相机与模块绑定关系。",
    preview:
      "U-VSN-01、U-VSN-03 与 U-VSN-04 对应划痕、漏装、扭矩异常和标签缺失等多类缺陷。",
    tags: ["Vision", "表格", "质检"],
  },
  {
    id: "file-4",
    name: "换型工单 WO-20260407-A.pdf",
    kind: "pdf",
    size: "4.6 MB",
    source: "MES 工单",
    updatedAt: "2026-04-07 10:18",
    status: "uploaded",
    progress: 18,
    summary: "描述 A 型产品换型后的模块优先级、节拍目标与返修策略。",
    preview:
      "工单要求优先启用 M-ASM-02、M-QC-01 和 M-PKG-01，目标节拍 56s，返修闭环不超过 2 次。",
    tags: ["工单", "换型", "MES"],
  },
  {
    id: "file-5",
    name: "模块社区摘要 C-02.txt",
    kind: "pdf",
    size: "0.4 MB",
    source: "LLM 摘要",
    updatedAt: "2026-04-07 10:21",
    status: "extracting",
    progress: 43,
    summary: "覆盖装配模块、质检模块与关键转运单元的局部子图摘要。",
    preview:
      "社区 C-02 当前重点关注 U-CNV-07 占用率升高、U-VSN-03 误检率波动以及 M-ASM-02 等待链问题。",
    tags: ["LLM", "社区", "更新"],
  },
  {
    id: "file-6",
    name: "工位动作时序表.xlsx",
    kind: "xlsx",
    size: "0.9 MB",
    source: "时序配置",
    updatedAt: "2026-04-07 10:26",
    status: "uploaded",
    progress: 12,
    summary: "定义装配、质检、分拣和返修之间的动作时序与等待条件。",
    preview:
      "表中给出了 M-ASM-02 → M-QC-01 → M-SRT-01 的放行顺序、重试逻辑和状态超时阈值。",
    tags: ["时序", "动作", "控制"],
  },
  {
    id: "file-7",
    name: "三维资产映射表.docx",
    kind: "docx",
    size: "2.6 MB",
    source: "资产配置",
    updatedAt: "2026-04-07 10:40",
    status: "aligning",
    progress: 67,
    summary: "建立模块、设备单元与孪生资产 UUID 的一一映射。",
    preview:
      "M-ASM-02、M-QC-01、U-RBT-02 与 U-VSN-03 已完成三维模型绑定并支持状态驱动更新。",
    tags: ["资产", "孪生", "绑定"],
  },
  {
    id: "file-8",
    name: "返修规则与质检阈值.xlsx",
    kind: "xlsx",
    size: "0.8 MB",
    source: "规则表",
    updatedAt: "2026-04-07 10:44",
    status: "queued",
    progress: 21,
    summary: "记录返修判定门限、视觉阈值以及二次检测条件。",
    preview:
      "当 U-VSN-03 置信度低于 0.82 或 U-TOR-01 扭矩偏差超过 5% 时，工件被路由到 M-RWK-01。",
    tags: ["规则", "阈值", "返修"],
  },
]

export {
  cypherExamples,
  knowledgeGraphExample,
}

export const qaSuggestions = [
  "请总结 M-ASM-02 模块的上下游依赖和关键单元。",
  "当前 Knowledge Graph 里有哪些 warning 状态节点？",
  "请输出适合 Agent 调用的质检模块 JSON 摘要。",
]

export const qaMessages: QaMessage[] = [
  {
    id: "qa-1",
    role: "user",
    content: "请概括电源组装产线 中装配模块、质检模块与返修模块之间的关键关系。",
  },
  {
    id: "qa-2",
    role: "assistant",
    content:
      "图谱显示，M-ASM-02 完成核心装配后将工件路由到 M-TRF-01 和 M-ASM-03，随后进入 M-QC-01 终检；当终检判定异常时，任务会被回路到 M-RWK-01，并在返修完成后再次返回 M-QC-01。关键瓶颈集中在 U-CNV-07、U-VSN-03 和 U-DBO-01。",
  },
]

export const qaStructuredResult = {
  模块: "M-QC-01",
  产线: "电源组装产线",
  状态: "warning",
  任务角色: "终检与缺陷复判",
  坐标: {
    x: knowledgeGraphExample.nodes.find((node) => node.id === "module-qc-01")?.fx ?? 0,
    y: knowledgeGraphExample.nodes.find((node) => node.id === "module-qc-01")?.fy ?? 0,
  },
  UnitList: [
    { 名称: "U-VSN-03", 角色: "终检视觉单元", 状态: "warning" },
    { 名称: "U-TOR-01", 角色: "扭矩复检仪", 状态: "running" },
    { 名称: "U-DBO-01", 角色: "缺陷判定主机", 状态: "warning" },
    { 名称: "U-CNV-08", 角色: "质检输送线", 状态: "running" },
  ],
  Relations: [
    { 类型: "HAS_UNIT", 目标: "U-VSN-03" },
    { 类型: "HAS_UNIT", 目标: "U-TOR-01" },
    { 类型: "REWORKS_TO", 目标: "M-RWK-01" },
    { 类型: "ROUTES_TO", 目标: "M-SRT-01" },
    { 类型: "UPDATES", 来源: "视觉配置表" },
    { 类型: "CONFIGURES", 来源: "质检阈值表" },
  ],
  EvidenceDocs: ["视觉配置表", "质检阈值表", "社区摘要 C-02", "任务树快照"],
}
