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

export type CypherResult = {
  title: string
  query: string
  summary: string
  graph: KnowledgeGraphData
  rows: Array<Record<string, string>>
  focusedNodeIds: string[]
}

export type QaMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

export const statusLabelMap: Record<KnowledgeFileStatus, string> = {
  uploaded: "已上传",
  queued: "Queued",
  extracting: "Extracting",
  aligning: "Aligning",
  summarizing: "Summarizing",
  completed: "Completed",
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
    summary: "包含装配路线、节拍参数、模块依赖关系及关键单元动作约束。",
    preview:
      "第 3 节定义了产线 A 的装配路线。模块 M-ASM-02 依赖单元 U-CNV-07 的输送同步信号，质检单元 U-VSN-03 负责扭矩校验与合格判定。",
    tags: ["工艺", "装配", "Line A"],
  },
  {
    id: "file-2",
    name: "机器人单元配置.docx",
    kind: "docx",
    size: "3.8 MB",
    source: "工程规范",
    updatedAt: "2026-04-07 09:48",
    status: "aligning",
    progress: 74,
    summary: "包含机械臂负载、夹具映射、模块资源绑定和动作位姿说明。",
    preview:
      "机器人单元 RC-02 由 U-RBT-02 和换刀具单元 U-TCL-01 构成，服务模块 M-ASM-02，回传节拍、位姿和工具占用状态。",
    tags: ["Robot", "模块", "资源"],
  },
  {
    id: "file-3",
    name: "视觉质检映射表.xlsx",
    kind: "xlsx",
    size: "1.1 MB",
    source: "检测表格",
    updatedAt: "2026-04-07 10:02",
    status: "queued",
    progress: 18,
    summary: "记录缺陷标签、阈值区间、相机与单元绑定关系。",
    preview:
      "相机 U-VSN-03 对应划痕、漏装、松动三类缺陷，报警阈值设为 0.82，并启用了预警复核规则。",
    tags: ["Vision", "表格", "质检"],
  },
  {
    id: "file-4",
    name: "输送线运行截图.png",
    kind: "png",
    size: "4.6 MB",
    source: "监控截图",
    updatedAt: "2026-04-07 10:18",
    status: "uploaded",
    progress: 8,
    summary: "图片 OCR 提取了输送速度、占用率、预警位置等运行信息。",
    preview:
      "识别结果显示产线 A 输送速度 1.2m/s、占用率 78%，并在 U-CNV-07 附近检测到转运口拥堵提示。",
    tags: ["Image", "运行态", "Conveyor"],
  },
  {
    id: "file-5",
    name: "模块社区摘要.txt",
    kind: "pdf",
    size: "0.4 MB",
    source: "LLM 摘要",
    updatedAt: "2026-04-07 10:21",
    status: "extracting",
    progress: 43,
    summary: "记录 Leiden 社区划分后的模块摘要，用于增量更新范围匹配。",
    preview:
      "社区 C-02 主要覆盖装配模块、输送单元与视觉单元，近期更新主题集中在节拍波动和质检误检率。",
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
    summary: "记录模块级动作时序、等待条件和信号依赖。",
    preview:
      "表中定义了 M-ASM-02 与 M-QC-01 之间的放行条件、等待时长以及信号确认顺序。",
    tags: ["时序", "动作", "控制"],
  },
]

export const initialGraph: KnowledgeGraphData = {
  nodes: [
    {
      id: "line-a",
      label: "产线层",
      group: "line",
      title: "柔性产线 A",
      subtitle: "全局计划 / takt 56s",
      status: "running",
      fx: 0,
      fy: -10,
    },
    {
      id: "module-asm-01",
      label: "模块层",
      group: "module",
      title: "M-ASM-01",
      subtitle: "上料模块",
      status: "running",
      fx: -190,
      fy: 110,
    },
    {
      id: "module-asm-02",
      label: "模块层",
      group: "module",
      title: "M-ASM-02",
      subtitle: "装配模块",
      status: "warning",
      fx: 20,
      fy: 135,
    },
    {
      id: "module-qc-01",
      label: "模块层",
      group: "module",
      title: "M-QC-01",
      subtitle: "质检模块",
      status: "idle",
      fx: 218,
      fy: 110,
    },
    {
      id: "unit-rbt-01",
      label: "单元层",
      group: "unit",
      title: "U-RBT-01",
      subtitle: "上料 Robot",
      status: "running",
      fx: -238,
      fy: 270,
    },
    {
      id: "unit-cnv-07",
      label: "单元层",
      group: "unit",
      title: "U-CNV-07",
      subtitle: "Transfer Conveyor",
      status: "warning",
      fx: 36,
      fy: 288,
    },
  ],
  links: [
    { source: "line-a", target: "module-asm-01", type: "HAS_MODULE" },
    { source: "line-a", target: "module-asm-02", type: "HAS_MODULE" },
    { source: "line-a", target: "module-qc-01", type: "HAS_MODULE" },
    { source: "module-asm-01", target: "unit-rbt-01", type: "HAS_UNIT" },
    { source: "module-asm-02", target: "unit-cnv-07", type: "HAS_UNIT" },
    { source: "module-asm-01", target: "module-asm-02", type: "FEEDS" },
    { source: "module-asm-02", target: "module-qc-01", type: "ROUTES_TO" },
  ],
}

export const builtGraph: KnowledgeGraphData = {
  nodes: [
    ...initialGraph.nodes,
    {
      id: "unit-rbt-02",
      label: "单元层",
      group: "unit",
      title: "U-RBT-02",
      subtitle: "Assembly Robot",
      status: "running",
      fx: -62,
      fy: 305,
    },
    {
      id: "unit-vsn-03",
      label: "单元层",
      group: "unit",
      title: "U-VSN-03",
      subtitle: "Vision Unit",
      status: "idle",
      fx: 214,
      fy: 280,
    },
    {
      id: "doc-process",
      label: "文档节点",
      group: "document",
      title: "工艺说明",
      subtitle: "Prompt 抽取",
      status: "idle",
      fx: -132,
      fy: -144,
    },
    {
      id: "doc-vision",
      label: "文档节点",
      group: "document",
      title: "视觉配置表",
      subtitle: "Incremental Update",
      status: "idle",
      fx: 166,
      fy: -144,
    },
  ],
  links: [
    ...initialGraph.links,
    { source: "module-asm-02", target: "unit-rbt-02", type: "HAS_UNIT" },
    { source: "module-qc-01", target: "unit-vsn-03", type: "HAS_UNIT" },
    { source: "unit-rbt-02", target: "unit-cnv-07", type: "SENDS_TO" },
    { source: "unit-vsn-03", target: "unit-cnv-07", type: "MONITORS" },
    { source: "doc-process", target: "module-asm-02", type: "DESCRIBES" },
    { source: "doc-vision", target: "unit-vsn-03", type: "CONFIGURES" },
    { source: "doc-vision", target: "module-qc-01", type: "UPDATES" },
  ],
}

export const cypherExamples = [
  "MATCH (l:Line)-[:HAS_MODULE]->(m) RETURN l,m LIMIT 8",
  "MATCH (m:Module {title:'M-ASM-02'})-[r]-(n) RETURN m,r,n",
  "MATCH (u:Unit) WHERE u.status = 'warning' RETURN u",
]

export const cypherResults: Record<string, CypherResult> = {
  default: {
    title: "完整图谱快照",
    query: "MATCH (n)-[r]->(m) RETURN n,r,m LIMIT 25",
    summary: "当前显示最近一次前端 mock 构建后的 LS-MS-US 全量图谱。",
    graph: builtGraph,
    rows: [
      { 节点A: "柔性产线 A", 节点B: "M-ASM-02", 关系: "HAS_MODULE" },
      { 节点A: "M-QC-01", 节点B: "U-VSN-03", 关系: "HAS_UNIT" },
      { 节点A: "视觉配置表", 节点B: "U-VSN-03", 关系: "CONFIGURES" },
    ],
    focusedNodeIds: ["line-a", "module-asm-02", "unit-vsn-03"],
  },
  line: {
    title: "Line-Module 拓扑",
    query: cypherExamples[0],
    summary: "突出产线层到模块层的组织结构，适合全局计划视图。",
    graph: {
      nodes: builtGraph.nodes.filter((node) =>
        ["line-a", "module-asm-01", "module-asm-02", "module-qc-01"].includes(node.id)
      ),
      links: builtGraph.links.filter((link) => link.type === "HAS_MODULE"),
    },
    rows: [
      { 产线: "柔性产线 A", 模块: "M-ASM-01", 状态: "running" },
      { 产线: "柔性产线 A", 模块: "M-ASM-02", 状态: "warning" },
      { 产线: "柔性产线 A", 模块: "M-QC-01", 状态: "idle" },
    ],
    focusedNodeIds: ["line-a", "module-asm-01", "module-asm-02", "module-qc-01"],
  },
  assembly: {
    title: "Assembly 模块邻域",
    query: cypherExamples[1],
    summary: "聚焦 M-ASM-02 周围的关键单元、文档节点和流转关系。",
    graph: {
      nodes: builtGraph.nodes.filter((node) =>
        [
          "module-asm-01",
          "module-asm-02",
          "module-qc-01",
          "unit-cnv-07",
          "unit-rbt-02",
          "doc-process",
        ].includes(node.id)
      ),
      links: builtGraph.links.filter((link) =>
        ["module-asm-02", "unit-cnv-07", "unit-rbt-02", "doc-process"].includes(String(link.source)) ||
        ["module-asm-02", "unit-cnv-07", "unit-rbt-02", "doc-process"].includes(String(link.target))
      ),
    },
    rows: [
      { 节点: "M-ASM-02", 类型: "模块层", 说明: "Assembly 核心模块" },
      { 节点: "U-CNV-07", 类型: "单元层", 说明: "关键转运单元" },
      { 节点: "工艺说明", 类型: "文档节点", 说明: "提供动作约束" },
    ],
    focusedNodeIds: ["module-asm-02", "unit-cnv-07", "unit-rbt-02", "doc-process"],
  },
  warning: {
    title: "warning 节点筛选",
    query: cypherExamples[2],
    summary: "筛选状态为 warning 的节点，用于诊断和增量更新验证。",
    graph: {
      nodes: builtGraph.nodes.filter((node) =>
        ["module-asm-02", "unit-cnv-07", "unit-vsn-03"].includes(node.id)
      ),
      links: builtGraph.links.filter((link) =>
        ["module-asm-02", "unit-cnv-07", "unit-vsn-03"].includes(String(link.source)) &&
        ["module-asm-02", "unit-cnv-07", "unit-vsn-03"].includes(String(link.target))
      ),
    },
    rows: [{ 节点: "U-CNV-07", 状态: "warning", 原因: "转运口占用率偏高" }],
    focusedNodeIds: ["module-asm-02", "unit-cnv-07"],
  },
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
    content: "请概括柔性产线 A 中装配模块的关键资源和关系。",
  },
  {
    id: "qa-2",
    role: "assistant",
    content:
      "M-ASM-02 是装配核心模块，当前关联 U-RBT-02 与 U-CNV-07 两个关键单元。它接收 M-ASM-01 的上料，向 M-QC-01 输出工件；工艺说明节点补充了动作约束，视觉配置表则提供质检和增量更新语义。",
  },
]

export const qaStructuredResult = {
  模块: "M-QC-01",
  产线: "柔性产线 A",
  状态: "idle",
  坐标: { x: 208, y: 118 },
  UnitList: [
    { 名称: "U-VSN-03", 角色: "Vision Inspection", 状态: "idle" },
    { 名称: "U-CNV-07", 角色: "Transfer Observation", 状态: "warning" },
  ],
  Relations: [
    { 类型: "HAS_UNIT", 目标: "U-VSN-03" },
    { 类型: "MONITORS", 目标: "U-CNV-07" },
    { 类型: "UPDATES", 来源: "视觉配置表" },
  ],
}
