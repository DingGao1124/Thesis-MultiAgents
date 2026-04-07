import type { KnowledgeGraphData, KnowledgeLink, KnowledgeNode } from "./data"

// Reuse the runtime status type defined in KnowledgeNode.
type RuntimeStatus = NonNullable<KnowledgeNode["status"]>

// Seed data for unit-level nodes.
type UnitSeed = {
  id: string
  title: string
  subtitle: string
  status: RuntimeStatus
}

// Seed data for module-level nodes and their child units.
type ModuleSeed = {
  id: string
  title: string
  subtitle: string
  status: RuntimeStatus
  units: UnitSeed[]
}

// Seed data for document-like graph nodes.
type DocumentSeed = {
  id: string
  title: string
  subtitle: string
  status: RuntimeStatus
}

// Root production line node.
const lineNode: KnowledgeNode = {
  id: "line-a",
  label: "产线层",
  group: "line",
  title: "电源组装产线",
  subtitle: "缺陷监测 / 分拣 / 装配协同，takt 56s",
  status: "running",
  fx: 0,
  fy: 0,
}

// Module seeds define the LS-MS-US hierarchy at module and unit levels.
const moduleSeeds: ModuleSeed[] = [
  {
    id: "module-asm-01",
    title: "M-ASM-01",
    subtitle: "上料模块",
    status: "running",
    units: [
      { id: "unit-rbt-01", title: "U-RBT-01", subtitle: "上料机械臂", status: "running" },
      { id: "unit-cnv-01", title: "U-CNV-01", subtitle: "入线输送线", status: "running" },
      { id: "unit-sns-01", title: "U-SNS-01", subtitle: "到位传感器", status: "running" },
      { id: "unit-bin-01", title: "U-BIN-01", subtitle: "来料料仓", status: "idle" },
      { id: "unit-rfid-01", title: "U-RFID-01", subtitle: "来料识别器", status: "running" },
    ],
  },
  {
    id: "module-vsn-01",
    title: "M-VSN-01",
    subtitle: "视觉初检模块",
    status: "running",
    units: [
      { id: "unit-vsn-01", title: "U-VSN-01", subtitle: "外观相机 A", status: "running" },
      { id: "unit-lgt-01", title: "U-LGT-01", subtitle: "环形光源 A", status: "running" },
      { id: "unit-cnv-02", title: "U-CNV-02", subtitle: "视觉输送线", status: "running" },
      { id: "unit-sns-02", title: "U-SNS-02", subtitle: "触发传感器 A", status: "running" },
      { id: "unit-pcs-01", title: "U-PCS-01", subtitle: "边缘推理主机", status: "running" },
      { id: "unit-vsn-02", title: "U-VSN-02", subtitle: "尺寸相机 B", status: "idle" },
    ],
  },
  {
    id: "module-buf-01",
    title: "M-BUF-01",
    subtitle: "缓存模块",
    status: "idle",
    units: [
      { id: "unit-buf-01", title: "U-BUF-01", subtitle: "缓存仓位", status: "idle" },
      { id: "unit-cnv-03", title: "U-CNV-03", subtitle: "缓存输送线", status: "running" },
      { id: "unit-sns-03", title: "U-SNS-03", subtitle: "缓存占用传感器", status: "running" },
      { id: "unit-gte-01", title: "U-GTE-01", subtitle: "放行闸门 A", status: "idle" },
      { id: "unit-rfid-02", title: "U-RFID-02", subtitle: "缓存识别器", status: "running" },
    ],
  },
  {
    id: "module-asm-02",
    title: "M-ASM-02",
    subtitle: "装配模块",
    status: "warning",
    units: [
      { id: "unit-rbt-02", title: "U-RBT-02", subtitle: "装配机械臂", status: "running" },
      { id: "unit-tcl-01", title: "U-TCL-01", subtitle: "换刀单元", status: "idle" },
      { id: "unit-cnv-07", title: "U-CNV-07", subtitle: "关键转运输送线", status: "warning" },
      { id: "unit-prs-01", title: "U-PRS-01", subtitle: "压装单元", status: "running" },
      { id: "unit-sns-07", title: "U-SNS-07", subtitle: "装配位检测", status: "running" },
      { id: "unit-jig-01", title: "U-JIG-01", subtitle: "装配夹具 A", status: "idle" },
      { id: "unit-tor-02", title: "U-TOR-02", subtitle: "预紧扭矩枪", status: "warning" },
    ],
  },
  {
    id: "module-trf-01",
    title: "M-TRF-01",
    subtitle: "物流转运模块",
    status: "running",
    units: [
      { id: "unit-cnv-04", title: "U-CNV-04", subtitle: "转运输送线 A", status: "running" },
      { id: "unit-agv-01", title: "U-AGV-01", subtitle: "AGV 对接车", status: "running" },
      { id: "unit-gte-02", title: "U-GTE-02", subtitle: "分流闸门 B", status: "running" },
      { id: "unit-sns-04", title: "U-SNS-04", subtitle: "转运光电", status: "running" },
      { id: "unit-rfid-03", title: "U-RFID-03", subtitle: "工装识别器", status: "idle" },
    ],
  },
  {
    id: "module-asm-03",
    title: "M-ASM-03",
    subtitle: "二次装配模块",
    status: "running",
    units: [
      { id: "unit-rbt-03", title: "U-RBT-03", subtitle: "紧固机械臂", status: "running" },
      { id: "unit-scr-01", title: "U-SCR-01", subtitle: "螺钉供给器", status: "running" },
      { id: "unit-cnv-05", title: "U-CNV-05", subtitle: "二装输送线", status: "running" },
      { id: "unit-sns-05", title: "U-SNS-05", subtitle: "扭矩到位传感器", status: "running" },
      { id: "unit-jig-02", title: "U-JIG-02", subtitle: "装配夹具 B", status: "idle" },
      { id: "unit-prs-02", title: "U-PRS-02", subtitle: "补压装单元", status: "running" },
    ],
  },
  {
    id: "module-mrk-01",
    title: "M-MRK-01",
    subtitle: "激光打标模块",
    status: "idle",
    units: [
      { id: "unit-lsr-01", title: "U-LSR-01", subtitle: "激光打标机", status: "idle" },
      { id: "unit-cnv-06", title: "U-CNV-06", subtitle: "打标输送线", status: "running" },
      { id: "unit-sns-06", title: "U-SNS-06", subtitle: "打标触发传感器", status: "running" },
      { id: "unit-cam-01", title: "U-CAM-01", subtitle: "打标校验相机", status: "idle" },
    ],
  },
  {
    id: "module-qc-01",
    title: "M-QC-01",
    subtitle: "质检模块",
    status: "warning",
    units: [
      { id: "unit-vsn-03", title: "U-VSN-03", subtitle: "终检视觉单元", status: "warning" },
      { id: "unit-tor-01", title: "U-TOR-01", subtitle: "扭矩复检仪", status: "running" },
      { id: "unit-cnv-08", title: "U-CNV-08", subtitle: "质检输送线", status: "running" },
      { id: "unit-sns-08", title: "U-SNS-08", subtitle: "质检到位传感器", status: "running" },
      { id: "unit-dbo-01", title: "U-DBO-01", subtitle: "缺陷判定主机", status: "warning" },
      { id: "unit-wgh-02", title: "U-WGH-02", subtitle: "重量复核单元", status: "idle" },
    ],
  },
  {
    id: "module-srt-01",
    title: "M-SRT-01",
    subtitle: "分拣模块",
    status: "running",
    units: [
      { id: "unit-rbt-04", title: "U-RBT-04", subtitle: "分拣机械臂", status: "running" },
      { id: "unit-cnv-09", title: "U-CNV-09", subtitle: "分拣输送线", status: "running" },
      { id: "unit-sns-09", title: "U-SNS-09", subtitle: "分拣检测光电", status: "running" },
      { id: "unit-bin-02", title: "U-BIN-02", subtitle: "NG 料箱", status: "idle" },
      { id: "unit-bin-03", title: "U-BIN-03", subtitle: "OK 料箱", status: "idle" },
    ],
  },
  {
    id: "module-rwk-01",
    title: "M-RWK-01",
    subtitle: "返修模块",
    status: "idle",
    units: [
      { id: "unit-rbt-05", title: "U-RBT-05", subtitle: "返修机械臂", status: "idle" },
      { id: "unit-cnv-10", title: "U-CNV-10", subtitle: "返修输送线", status: "idle" },
      { id: "unit-vsn-04", title: "U-VSN-04", subtitle: "返修复检相机", status: "idle" },
      { id: "unit-sns-10", title: "U-SNS-10", subtitle: "返修工位传感器", status: "running" },
      { id: "unit-sta-01", title: "U-STA-01", subtitle: "返修工装台", status: "idle" },
    ],
  },
  {
    id: "module-pkg-01",
    title: "M-PKG-01",
    subtitle: "包装模块",
    status: "running",
    units: [
      { id: "unit-rbt-06", title: "U-RBT-06", subtitle: "装箱机械臂", status: "running" },
      { id: "unit-cnv-11", title: "U-CNV-11", subtitle: "包装输送线", status: "running" },
      { id: "unit-wgh-01", title: "U-WGH-01", subtitle: "称重单元", status: "running" },
      { id: "unit-lbl-01", title: "U-LBL-01", subtitle: "贴标单元", status: "running" },
      { id: "unit-sns-11", title: "U-SNS-11", subtitle: "包装位传感器", status: "running" },
      { id: "unit-sea-01", title: "U-SEA-01", subtitle: "封箱单元", status: "idle" },
    ],
  },
  {
    id: "module-agv-01",
    title: "M-AGV-01",
    subtitle: "成品物流模块",
    status: "running",
    units: [
      { id: "unit-agv-02", title: "U-AGV-02", subtitle: "成品 AGV", status: "running" },
      { id: "unit-dck-01", title: "U-DCK-01", subtitle: "下线对接站", status: "running" },
      { id: "unit-sns-12", title: "U-SNS-12", subtitle: "对接传感器", status: "running" },
      { id: "unit-rfid-04", title: "U-RFID-04", subtitle: "成品识别器", status: "running" },
      { id: "unit-gte-03", title: "U-GTE-03", subtitle: "发运闸门", status: "idle" },
    ],
  },
]

// Document nodes support work orders, summaries, memory, and asset binding.
const documentSeeds: DocumentSeed[] = [
  { id: "doc-process", title: "工艺说明", subtitle: "Prompt 抽取", status: "idle" },
  { id: "doc-vision", title: "视觉配置表", subtitle: "增量更新", status: "idle" },
  { id: "doc-workorder-a", title: "工单 WO-20260407-A", subtitle: "动态任务", status: "running" },
  { id: "doc-workorder-b", title: "工单 WO-20260407-B", subtitle: "换型任务", status: "running" },
  { id: "doc-bom-a", title: "BOM-A 型", subtitle: "结构化 BOM", status: "idle" },
  { id: "doc-bom-b", title: "BOM-B 型", subtitle: "结构化 BOM", status: "idle" },
  { id: "doc-layout-v3", title: "产线布局 V3", subtitle: "场景装配", status: "idle" },
  { id: "doc-summary-c02", title: "社区摘要 C-02", subtitle: "Leiden 社区", status: "idle" },
  { id: "doc-summary-c05", title: "社区摘要 C-05", subtitle: "Leiden 社区", status: "idle" },
  { id: "doc-qc-threshold", title: "质检阈值表", subtitle: "规则约束", status: "warning" },
  { id: "doc-task-tree", title: "任务树快照", subtitle: "HTT 重构", status: "running" },
  { id: "doc-agent-memory-asm", title: "装配 Agent 记忆", subtitle: "长期经验", status: "idle" },
  { id: "doc-agent-memory-qc", title: "质检 Agent 记忆", subtitle: "长期经验", status: "idle" },
  { id: "doc-asset-map", title: "三维资产映射表", subtitle: "虚实绑定", status: "idle" },
]

// Simple polar helper used to place nodes on the canvas.
function polar(radius: number, angle: number) {
  return {
    x: Math.round(Math.cos(angle) * radius),
    y: Math.round(Math.sin(angle) * radius),
  }
}

// Build one module node positioned on a ring around the line node.
function buildModuleNode(seed: ModuleSeed, index: number, total: number): KnowledgeNode {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / total
  const pos = polar(380, angle)
  return {
    id: seed.id,
    label: "模块层",
    group: "module",
    title: seed.title,
    subtitle: seed.subtitle,
    status: seed.status,
    fx: pos.x,
    fy: pos.y,
  }
}

// Build one unit node positioned near its parent module.
function buildUnitNode(
  moduleIndex: number,
  moduleCount: number,
  unitSeed: UnitSeed,
  unitIndex: number,
  unitCount: number
): KnowledgeNode {
  const moduleAngle = -Math.PI / 2 + (2 * Math.PI * moduleIndex) / moduleCount
  const base = polar(380, moduleAngle)
  const localAngle =
    moduleAngle - Math.PI / 3 + (2 * Math.PI * (unitIndex + 1)) / (3 * Math.max(unitCount, 4))
  const spread = 120 + (unitIndex % 2) * 18
  const offset = polar(spread, localAngle)
  return {
    id: unitSeed.id,
    label: "单元层",
    group: "unit",
    title: unitSeed.title,
    subtitle: unitSeed.subtitle,
    status: unitSeed.status,
    fx: base.x + offset.x,
    fy: base.y + offset.y,
  }
}

// Build document nodes in a top row for easier visual grouping.
function buildDocumentNode(seed: DocumentSeed, index: number, total: number): KnowledgeNode {
  const x = Math.round(-520 + (index * 1040) / Math.max(total - 1, 1))
  const y = index % 2 === 0 ? -620 : -555
  return {
    id: seed.id,
    label: "文档节点",
    group: "document",
    title: seed.title,
    subtitle: seed.subtitle,
    status: seed.status,
    fx: x,
    fy: y,
  }
}

// Materialize all module, unit, and document nodes.
const moduleNodes = moduleSeeds.map((seed, index) => buildModuleNode(seed, index, moduleSeeds.length))
const unitNodes = moduleSeeds.flatMap((moduleSeed, moduleIndex) =>
  moduleSeed.units.map((unitSeed, unitIndex) =>
    buildUnitNode(moduleIndex, moduleSeeds.length, unitSeed, unitIndex, moduleSeed.units.length)
  )
)
const documentNodes = documentSeeds.map((seed, index) =>
  buildDocumentNode(seed, index, documentSeeds.length)
)

// Small helper for creating links.
function link(source: string, target: string, type: string): KnowledgeLink {
  return { source, target, type }
}

// Module-to-module process flow relations.
const moduleRouteSeeds = [
  ["module-asm-01", "module-vsn-01", "FEEDS"],
  ["module-vsn-01", "module-buf-01", "ROUTES_TO"],
  ["module-buf-01", "module-asm-02", "FEEDS"],
  ["module-asm-02", "module-trf-01", "ROUTES_TO"],
  ["module-trf-01", "module-asm-03", "FEEDS"],
  ["module-asm-03", "module-mrk-01", "ROUTES_TO"],
  ["module-mrk-01", "module-qc-01", "ROUTES_TO"],
  ["module-qc-01", "module-srt-01", "ROUTES_TO"],
  ["module-srt-01", "module-pkg-01", "ROUTES_TO"],
  ["module-pkg-01", "module-agv-01", "ROUTES_TO"],
  ["module-qc-01", "module-rwk-01", "REWORKS_TO"],
  ["module-rwk-01", "module-qc-01", "RETURNS_TO"],
  ["module-srt-01", "module-rwk-01", "DIVERTS_TO"],
  ["module-buf-01", "module-trf-01", "BYPASSES_TO"],
] as Array<[string, string, string]>

// Unit-to-unit operational relations.
const unitLinkSeeds = [
  ["unit-rbt-01", "unit-cnv-01", "SENDS_TO"],
  ["unit-cnv-01", "unit-cnv-02", "SENDS_TO"],
  ["unit-pcs-01", "unit-vsn-01", "MONITORS"],
  ["unit-pcs-01", "unit-vsn-02", "MONITORS"],
  ["unit-buf-01", "unit-cnv-07", "FEEDS"],
  ["unit-tcl-01", "unit-rbt-02", "CONFIGURES"],
  ["unit-prs-01", "unit-rbt-02", "FEEDBACK_TO"],
  ["unit-rbt-02", "unit-cnv-07", "SENDS_TO"],
  ["unit-cnv-07", "unit-cnv-04", "SENDS_TO"],
  ["unit-agv-01", "unit-cnv-05", "SENDS_TO"],
  ["unit-rbt-03", "unit-scr-01", "USES"],
  ["unit-lsr-01", "unit-cam-01", "VALIDATES"],
  ["unit-vsn-03", "unit-cnv-07", "MONITORS"],
  ["unit-vsn-03", "unit-tor-01", "MONITORS"],
  ["unit-dbo-01", "unit-vsn-03", "ANALYZES"],
  ["unit-rbt-04", "unit-bin-02", "SORTS_TO"],
  ["unit-rbt-04", "unit-bin-03", "SORTS_TO"],
  ["unit-vsn-04", "unit-rbt-05", "VALIDATES"],
  ["unit-wgh-01", "unit-lbl-01", "FEEDBACK_TO"],
  ["unit-agv-02", "unit-dck-01", "DOCKS_WITH"],
  ["unit-rfid-04", "unit-agv-02", "TRACKS"],
] as Array<[string, string, string]>

// Document-to-entity semantic relations.
const documentLinkSeeds = [
  ["doc-process", "module-asm-02", "DESCRIBES"],
  ["doc-process", "module-asm-03", "DESCRIBES"],
  ["doc-vision", "unit-vsn-01", "CONFIGURES"],
  ["doc-vision", "unit-vsn-03", "CONFIGURES"],
  ["doc-vision", "module-qc-01", "UPDATES"],
  ["doc-workorder-a", "line-a", "DEFINES_TASK"],
  ["doc-workorder-a", "module-asm-02", "DEFINES_TASK"],
  ["doc-workorder-b", "module-rwk-01", "DEFINES_TASK"],
  ["doc-workorder-b", "module-pkg-01", "DEFINES_TASK"],
  ["doc-bom-a", "module-asm-01", "SUPPORTS"],
  ["doc-bom-a", "module-asm-02", "SUPPORTS"],
  ["doc-bom-b", "module-asm-03", "SUPPORTS"],
  ["doc-bom-b", "module-pkg-01", "SUPPORTS"],
  ["doc-layout-v3", "line-a", "BINDS_ASSET"],
  ["doc-layout-v3", "module-trf-01", "BINDS_ASSET"],
  ["doc-summary-c02", "module-asm-02", "SUMMARIZES"],
  ["doc-summary-c02", "module-qc-01", "SUMMARIZES"],
  ["doc-summary-c02", "unit-cnv-07", "SUMMARIZES"],
  ["doc-summary-c05", "module-pkg-01", "SUMMARIZES"],
  ["doc-summary-c05", "module-agv-01", "SUMMARIZES"],
  ["doc-qc-threshold", "unit-vsn-03", "CONFIGURES"],
  ["doc-qc-threshold", "unit-dbo-01", "CONFIGURES"],
  ["doc-task-tree", "module-asm-02", "DEFINES_TASK"],
  ["doc-task-tree", "module-qc-01", "DEFINES_TASK"],
  ["doc-task-tree", "module-rwk-01", "DEFINES_TASK"],
  ["doc-agent-memory-asm", "module-asm-02", "STORES_MEMORY"],
  ["doc-agent-memory-asm", "unit-rbt-02", "STORES_MEMORY"],
  ["doc-agent-memory-qc", "module-qc-01", "STORES_MEMORY"],
  ["doc-agent-memory-qc", "unit-vsn-03", "STORES_MEMORY"],
  ["doc-asset-map", "module-asm-02", "BINDS_ASSET"],
  ["doc-asset-map", "module-qc-01", "BINDS_ASSET"],
  ["doc-asset-map", "unit-rbt-02", "BINDS_ASSET"],
  ["doc-asset-map", "unit-vsn-03", "BINDS_ASSET"],
] as Array<[string, string, string]>

// Line-to-module hierarchy links.
const lineModuleLinks = moduleSeeds.map((seed) => link("line-a", seed.id, "HAS_MODULE"))

// Process flow links between modules.
const moduleRouteLinks = moduleRouteSeeds.map(([source, target, type]) => link(source, target, type))

// Hierarchy links from each module to its units.
const moduleUnitLinks = moduleSeeds.flatMap((seed) =>
  seed.units.map((unit) => link(seed.id, unit.id, "HAS_UNIT"))
)

// Operational links between units.
const unitOperationalLinks = unitLinkSeeds.map(([source, target, type]) =>
  link(source, target, type)
)

// Semantic links from documents to graph entities.
const documentLinks = documentLinkSeeds.map(([source, target, type]) =>
  link(source, target, type)
)

// Final flattened graph collections.
const allNodes: KnowledgeNode[] = [lineNode, ...moduleNodes, ...unitNodes, ...documentNodes]
const allLinks: KnowledgeLink[] = [
  ...lineModuleLinks,
  ...moduleRouteLinks,
  ...moduleUnitLinks,
  ...unitOperationalLinks,
  ...documentLinks,
]

// Export the full example graph used by the front end.
export const knowledgeGraphExample: KnowledgeGraphData = {
  nodes: allNodes,
  links: allLinks,
}

// Example Cypher queries shown in the UI.
export const cypherExamples = [
  "MATCH (l:Line)-[:HAS_MODULE]->(m) RETURN l,m LIMIT 20",
  "MATCH (m:Module {title:'M-ASM-02'})-[r]-(n) RETURN m,r,n",
  "MATCH (u:Unit) WHERE u.status = 'warning' RETURN u",
]
