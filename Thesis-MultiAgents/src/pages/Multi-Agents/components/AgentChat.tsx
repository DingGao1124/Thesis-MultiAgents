import { useState } from 'react'
import clsx from 'clsx'
import { Send } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { agentConversationMessages, userConversationMessages } from '../data'

interface ConversationProps {
  productionName: string
}

const agentColors = {
  line: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    avatar: 'bg-blue-200',
  },
  module: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    avatar: 'bg-green-200',
  },
  unit: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    avatar: 'bg-purple-200',
  },
} as const

type AgentType = keyof typeof agentColors

function getAgentType(agentName: string): AgentType {
  if (agentName.includes('产线')) {
    return 'line'
  }

  if (agentName.includes('模块')) {
    return 'module'
  }

  return 'unit'
}

interface MessageProps {
  content: string
  avatarUrl: string
  avatarFallback: string
  isUser?: boolean
  from?: string
  to?: string
}

function Message({ content, avatarUrl, avatarFallback, isUser = false, from, to }: MessageProps) {
  const fromType = getAgentType(from ?? '')
  const toType = getAgentType(to ?? '')

  return (
    <div className={clsx('flex gap-2', isUser && 'flex-row-reverse')}>
      <Avatar>
        <AvatarImage src={avatarUrl} alt={isUser ? 'User' : from || 'Agent'} />
        <AvatarFallback className={isUser ? 'bg-slate-300' : from ? agentColors[fromType].avatar : 'bg-green-300'}>
          {avatarFallback}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-col gap-1">
        {from && to && (
          <div className="flex items-center gap-1 text-xs">
            <span className={clsx('rounded-full px-2 py-0.5 shadow-sm', agentColors[fromType].bg, agentColors[fromType].text)}>
              {from}
            </span>
            <span className="text-gray-400">→</span>
            <span className={clsx('rounded-full px-2 py-0.5 shadow-sm', agentColors[toType].bg, agentColors[toType].text)}>
              {to}
            </span>
          </div>
        )}

        <div
          className={clsx(
            'rounded-2xl p-3 text-sm shadow-md',
            isUser
              ? 'rounded-tr-lg bg-[#027171] text-white'
              : from
                ? `${agentColors[fromType].bg.replace('100', '50')} ${agentColors[fromType].text} rounded-tl-lg border border-gray-100`
                : 'rounded-tl-lg bg-[#EFF2E8]',
          )}
        >
          {content}
        </div>
      </div>
    </div>
  )
}

export default function AgentChat({ productionName }: ConversationProps) {
  const [draftMessage, setDraftMessage] = useState('')
  const [isAgentMode, setIsAgentMode] = useState(true)

  return (
    <ScrollArea className="relative flex h-full flex-col bg-white/30">
      <div className="flex items-center justify-between p-4">
        <div className="flex flex-1 items-center justify-between gap-2">
          <span className="text-lg font-semibold">{productionName}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{isAgentMode ? '智能体会话' : '用户会话'}</span>
            <Switch checked={isAgentMode} onCheckedChange={setIsAgentMode} />
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-auto p-4 pt-0">
        {isAgentMode
          ? agentConversationMessages.map((message, index) => (
              <div key={`${message.timestamp}-${index}`} className="space-y-1">
                <Message
                  content={message.content}
                  from={message.from}
                  to={message.to}
                  avatarUrl="/agent.png"
                  avatarFallback={message.from[0]}
                />
                <div className="pl-12 text-xs text-slate-400">{message.timestamp}</div>
              </div>
            ))
          : userConversationMessages.map((message) => (
              <div key={message.id} className="space-y-2">
                <Message content={message.prompt} isUser avatarUrl="https://github.com/shadcn.png" avatarFallback="U" />
                <Message content={message.response} avatarUrl="/agent.png" avatarFallback="A" />
              </div>
            ))}
      </div>

      {!isAgentMode && (
        <div className="absolute bottom-2 left-1 right-2 p-1">
          <div className="flex items-center justify-between gap-2 rounded-full bg-[#EFF2E8] px-4 py-2">
            <input
              type="text"
              className="flex-1 bg-transparent outline-none"
              placeholder={`@${productionName}`}
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
            />
            <Button size="icon" className="rounded-full bg-teal-800 text-white">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </ScrollArea>
  )
}
