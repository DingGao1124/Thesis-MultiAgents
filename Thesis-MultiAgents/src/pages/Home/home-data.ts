import type { ComponentType } from "react"
import { Bot, Boxes, Factory, Network } from "lucide-react"

export type IconComponent = ComponentType<{ className?: string }>

export type ModuleItem = {
  id: string
  title: string
  description: string
  to: string
  icon: IconComponent
  details: string[]
}

export type QuickEntry = {
  label: string
  to: string
  icon: IconComponent
}

export type HighlightItem = {
  label: string
  className: string
}

export const modules: ModuleItem[] = [
  {
    id: "knowledge-graph",
    title: "知识图谱",
    description: "查看产线实体关系、层级结构与图谱演化结果。",
    to: "/knowledge-graph",
    icon: Network,
    details: [
      "支持 Line -> Module -> Unit 三层结构展示与关系追踪。",
      "用于查看知识节点、关联路径与图谱更新结果。",
    ],
  },
  {
    id: "multi-agents",
    title: "多智能体协同",
    description: "观察任务拆解、协同推理与执行过程。",
    to: "/multi-agents",
    icon: Bot,
    details: [
      "支持多角色任务协同、调度监控与过程追踪。",
      "适合展示复杂生产任务的分解与执行链路。",
    ],
  },
  {
    id: "production-line",
    title: "产线建模",
    description: "连接业务流程、设备状态与产线结构信息。",
    to: "/production-line",
    icon: Factory,
    details: [
      "覆盖产线流程建模、状态管理与业务组织能力。",
      "用于承接数字孪生产线的结构化表达。",
    ],
  },
  {
    id: "model-assets",
    title: "三维模型资产",
    description: "管理产线 glb 模型，并支持本地渲染预览。",
    to: "/model-assets",
    icon: Boxes,
    details: [
      "直接读取根目录 models 文件夹中的产线模型资产。",
      "支持模型展示、上传、删除和详细属性查看。",
    ],
  },
]

export const quickEntries: QuickEntry[] = [
  { label: "知识图谱", to: "/knowledge-graph", icon: Network },
  { label: "多智能体协同", to: "/multi-agents", icon: Bot },
  { label: "产线建模", to: "/production-line", icon: Factory },
  { label: "模型资产", to: "/model-assets", icon: Boxes },
]

export const highlights: HighlightItem[] = [
  {
    label: "知识驱动",
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  {
    label: "协同推理",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    label: "三维资产",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
]
