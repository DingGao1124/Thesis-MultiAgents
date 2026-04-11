import 'reactflow/dist/style.css'
import { useState } from 'react'
import {
  Bot,
  ChevronDown,
  Factory,
  Grid2x2,
  ImagePlus,
  MessageSquareMore,
  MousePointer2,
  Play,
  Settings2,
  X,
} from 'lucide-react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Panel,
  SelectionMode,
  addEdge,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import type { Connection, Edge, Node } from 'reactflow'
import { Button } from '@/components/ui/button'
import FloatingDockNav from '@/components/layout/FloatingDockNav'
import AgentChat from './components/AgentChat'
import AgentEdge from './components/AgentEdge'
import AgentNode from './components/AgentNode'
import RealtimeProductionLinePanel from './components/RealtimeProductionLinePanel'
import { initialEdges, initialNodes } from './data'
import type { AgentNodeData } from './types'

const nodeTypes = {
  agentNode: AgentNode,
}

const edgeTypes = {
  agentEdge: AgentEdge,
}

const toolbarIconButtonClass =
  'h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50'

export default function MultiAgents() {
  const [nodes, setNodes, onNodesChange] = useNodesState<AgentNodeData>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isRealtime3DOpen, setIsRealtime3DOpen] = useState(false)

  const handleDeleteNode = (nodeId: string) => {
    setNodes((currentNodes) => currentNodes.filter((node) => node.id !== nodeId))
    setEdges((currentEdges) => currentEdges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId))
  }

  const nodesWithActions: Node<AgentNodeData & { onDelete: (nodeId: string) => void }>[] = nodes.map((node) => ({
    ...node,
    data: {
      ...node.data,
      onDelete: handleDeleteNode,
    },
  }))

  const handleConnect = (connection: Connection) => {
    const { source, target, sourceHandle, targetHandle } = connection

    if (!source || !target) {
      return
    }

    const nextEdge: Edge = {
      id: `e${source}-${target}-${sourceHandle ?? 'source'}-${targetHandle ?? 'target'}`,
      type: 'agentEdge',
      source,
      target,
      sourceHandle,
      targetHandle,
    }

    setEdges((currentEdges) => addEdge(nextEdge, currentEdges))
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-100">
      <FloatingDockNav />
      <div className="h-full w-full">
        <ReactFlow
          nodes={nodesWithActions}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          selectionMode={SelectionMode.Partial}
          fitView
        >
          <Panel position="top-center" className="mt-2! flex items-center gap-2 bg-transparent px-3 py-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="h-8 w-8 rounded-full border-slate-300 bg-white text-slate-700 shadow-sm transition-transform duration-300 hover:scale-105"
              onClick={() => setIsRealtime3DOpen((value) => !value)}
              aria-label={isRealtime3DOpen ? 'Close 3D production-line realtime status' : 'Open 3D production-line realtime status'}
              title={isRealtime3DOpen ? 'Close 3D production-line realtime status' : 'Open 3D production-line realtime status'}
            >
              <Factory className="size-4" />
            </Button>
            <div className="flex items-center rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-base font-semibold tracking-wide text-slate-700 shadow-sm">
              <Bot className="mr-1.5 inline-block size-5 text-teal-600" />
              LLM 多智能体协作工作流
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="h-8 w-8 rounded-full border-slate-300 bg-white text-slate-700 shadow-sm transition-transform duration-300 hover:scale-105"
              onClick={() => setIsChatOpen((value) => !value)}
              aria-label={isChatOpen ? 'Close conversation panel' : 'Open conversation panel'}
            >
              {isChatOpen ? <X className="size-4" /> : <MessageSquareMore className="size-4" />}
            </Button>
          </Panel>

          <Panel position="bottom-center" className="mb-2! flex items-center gap-1.5 bg-transparent px-2 py-0.5">
            <div className="flex items-center gap-1.5 rounded-[16px] border border-slate-200 bg-white/96 px-3 py-1 shadow-[0_8px_18px_rgba(15,23,42,0.06)] backdrop-blur-sm">
              <button type="button" className="flex items-center gap-1 text-slate-700">
                <MousePointer2 className="size-4" />
                <ChevronDown className="size-3.5 text-slate-400" />
              </button>

              <div className="flex h-7 min-w-22 items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-2 font-semibold text-slate-700">
                <span className="text-sm font-medium">85%</span>
                <ChevronDown className="size-3.5 text-slate-400" />
              </div>

              <div className="h-5 w-px bg-slate-200" />

              <button type="button" className={toolbarIconButtonClass} aria-label="Messages">
                <MessageSquareMore className="mx-auto size-3.5" />
              </button>
              <button type="button" className={toolbarIconButtonClass} aria-label="Grid">
                <Grid2x2 className="mx-auto size-3.5" />
              </button>
              <button type="button" className={toolbarIconButtonClass} aria-label="Assets">
                <ImagePlus className="mx-auto size-3.5" />
              </button>
              <button type="button" className={toolbarIconButtonClass} aria-label="Settings">
                <Settings2 className="mx-auto size-3.5" />
              </button>

              <div className="h-5 w-px bg-slate-200" />

              <button
                type="button"
                className="flex h-8 min-w-31 items-center justify-center gap-1.5 rounded-[12px] bg-indigo-100 px-3 text-xs font-semibold text-indigo-600 shadow-inner transition-colors duration-200 hover:bg-indigo-200"
              >
                <span className="text-base leading-none">+</span>
                <span>Add node</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 rounded-[16px] border border-slate-200 bg-white/96 px-2 py-1 shadow-[0_8px_18px_rgba(15,23,42,0.06)] backdrop-blur-sm">
              <div className="flex items-center gap-1.5 border-r border-slate-200 pr-2">
                <div className="flex size-6 items-center justify-center rounded-full bg-teal-500 text-white">
                  <Bot className="size-3.5" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Characters</span>
              </div>

              <button type="button" className={toolbarIconButtonClass} aria-label="Character settings">
                <Settings2 className="mx-auto size-3.5" />
              </button>

              <button
                type="button"
                className="flex h-8 min-w-29 items-center justify-center gap-1.5 rounded-[12px] bg-emerald-500 px-3 text-xs font-semibold text-white transition-colors duration-200 hover:bg-emerald-600"
              >
                <Play className="size-3.5 fill-white" />
                <span>运行</span>
              </button>
            </div>
          </Panel>

          <Background variant={BackgroundVariant.Dots} color="#94a3b8" gap={16} size={1.5} />
        </ReactFlow>
      </div>

      <RealtimeProductionLinePanel
        open={isRealtime3DOpen}
        isChatOpen={isChatOpen}
        onOpenChange={setIsRealtime3DOpen}
      />

      <div className="pointer-events-none absolute right-4 top-4 bottom-4 z-20 w-90 max-w-[calc(100vw-2rem)]">
        <div
          className={`h-full overflow-hidden rounded-xl border border-slate-200 bg-white/92 shadow-xl backdrop-blur-sm transition-all duration-300 ease-out ${
            isChatOpen
              ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none translate-y-3 scale-95 opacity-0'
          }`}
        >
          <AgentChat productionName="锂电池包组装产线" />
        </div>
      </div>
    </div>
  )
}
