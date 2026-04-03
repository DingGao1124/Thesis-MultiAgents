import type { ComponentType } from "react"
import { Bot, Factory, Network, Orbit } from "lucide-react"

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
    description: "查看实体关系与图谱结构。",
    to: "/knowledge-graph",
    icon: Network,
    details: [
      "支持实体关系梳理与图谱结构展示。",
      "提供知识节点关联分析与路径查看能力。",
    ],
  },
  {
    id: "multi-agents",
    title: "多智能体",
    description: "支持协同推理与任务分配。",
    to: "/multi-agents",
    icon: Bot,
    details: [
      "支持多角色任务协同与执行编排。",
      "适用于复杂流程推理与策略分发场景。",
    ],
  },
  {
    id: "production-line",
    title: "产线建模",
    description: "连接流程节点与系统状态。",
    to: "/production-line",
    icon: Factory,
    details: [
      "覆盖产线流程建模、状态管理与过程组织。",
      "支撑柔性生产系统的结构化表达。",
    ],
  },
  {
    id: "robotics",
    title: "机器人系统",
    description: "管理机械臂运动与交互能力。",
    to: "/robotics",
    icon: Orbit,
    details: [
      "支持机器人动作过程查看与交互控制。",
      "适配数字孪生场景下的系统联动能力。",
    ],
  },
]

export const quickEntries: QuickEntry[] = [
  { label: "产线知识图谱", to: "/knowledge-graph", icon: Network },
  { label: "多智能体交互", to: "/multi-agents", icon: Bot },
  { label: "孪生产线建模", to: "/production-line", icon: Factory },
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
    label: "数字孪生",
    className: "border-violet-200 bg-violet-50 text-violet-700",
  },
]
