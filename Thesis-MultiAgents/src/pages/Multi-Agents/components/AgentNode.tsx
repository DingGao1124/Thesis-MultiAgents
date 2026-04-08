import { useEffect, useState } from 'react'
import { Handle, NodeToolbar, Position } from 'reactflow'
import { ArrowRightLeft, Edit3, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Textarea } from '@/components/ui/textarea'
import type { NodeProps } from 'reactflow'
import type { AgentNodeData } from '../types'
import { agentInteractionTimes, getAgentTools, getDefaultModel, getModelOptions } from '../data'
import ModelViewer from './ModelViewer'

interface AgentNodeState extends AgentNodeData {
  onDelete?: (nodeId: string) => void
}

const handleStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
}

const toolBadgeClassByColor: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  purple: 'bg-violet-100 text-violet-700 border-violet-200',
  orange: 'bg-amber-100 text-amber-700 border-amber-200',
  cyan: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  red: 'bg-rose-100 text-rose-700 border-rose-200',
}

export default function AgentNode({ data, isConnectable }: NodeProps<AgentNodeState>) {
  const [showModel, setShowModel] = useState(false)
  const [selectedModel, setSelectedModel] = useState('')

  useEffect(() => {
    setSelectedModel(getDefaultModel(data.role))
  }, [data.role])

  const tools = getAgentTools(data.role)
  const modelOptions = getModelOptions(data.role)

  const handleDelete = () => {
    data.onDelete?.(data.id)
  }

  return (
    <div className="relative">
      <NodeToolbar align="end" className="flex items-center space-x-1 rounded-md bg-white/50 px-1 py-0.5 backdrop-blur-sm">
        <Button variant="ghost" size="icon-xs" onClick={() => setShowModel((value) => !value)}>
          <ArrowRightLeft className="size-3" />
        </Button>
        {!showModel && (
          <Button variant="ghost" size="icon-xs">
            <Edit3 className="size-3" />
          </Button>
        )}
        <Button variant="ghost" size="icon-xs" onClick={handleDelete} className="text-rose-600 hover:text-rose-700">
          <Trash2 className="size-3" />
        </Button>
      </NodeToolbar>

      <Handle type="target" position={Position.Top} id="top" style={{ ...handleStyle, background: '#1677ff' }} isConnectable={isConnectable} />
      <Handle type="target" position={Position.Left} id="left" style={{ ...handleStyle, background: '#1677ff' }} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Right} id="right" style={{ ...handleStyle, background: '#52c41a' }} isConnectable={isConnectable} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ ...handleStyle, background: '#52c41a' }} isConnectable={isConnectable} />

      <Card className="w-75 py-2 shadow-md">
        <CardContent className="space-y-2 px-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarFallback>{data.avatarId}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold">
                {data.role}
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              AgentNode
            </Badge>
          </div>

          <div>
            <h5 className="mb-1 text-sm font-semibold">
              Agent Profile
            </h5>
            <Textarea
              readOnly
              className="min-h-12 resize-none bg-gray-50 text-xs"
              value={data.backstory}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              LLM
            </span>
            <NativeSelect
              value={selectedModel}
              className="w-36"
              onChange={(event) => setSelectedModel(event.target.value)}
              size="sm"
            >
              {modelOptions.map((option) => (
                <NativeSelectOption key={option.value} value={option.value}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <h5 className="mb-1 text-sm font-semibold">
                Tools
              </h5>
              <div className="flex flex-col gap-1">
                {tools.map((tool) => (
                  <Badge key={tool.id} variant="outline" className={`m-0 py-0.5 text-center text-xs ${toolBadgeClassByColor[tool.color] ?? ''}`}>
                    {tool.name}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <h5 className="mb-1 text-sm font-semibold">
                Memory
              </h5>
              <div className="h-13 overflow-hidden rounded bg-gray-50 p-1 text-xs text-gray-500">
                Latest interaction: {agentInteractionTimes[data.id] ?? '1 minute ago'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showModel && (
        <div className="flex h-56.25 w-75 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 shadow-inner">
          <ModelViewer url={data.modelUrl} />
        </div>
      )}
    </div>
  )
}
