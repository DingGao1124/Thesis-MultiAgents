export interface AgentTool {
  id: string
  name: string
  color: string
}

export interface AgentNodeData {
  id: string
  role: string
  avatarId: string
  backstory: string
  modelUrl: string
}

export interface AgentMessage {
  from: string
  to: string
  content: string
  timestamp: string
}

export interface ChatMessage {
  id: number
  prompt: string
  response: string
  createdAt: string
}
