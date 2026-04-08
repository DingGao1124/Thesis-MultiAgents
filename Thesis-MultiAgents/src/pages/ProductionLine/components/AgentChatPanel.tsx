import type { FormEvent } from "react"
import { ArrowUp, SquarePen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import type { ChatMessage } from "../types"

type AgentChatPanelProps = {
  messages: ChatMessage[]
  input: string
  statusText: string
  onInputChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onNewChat: () => void
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)
}

export default function AgentChatPanel({
  messages,
  input,
  statusText,
  onInputChange,
  onSubmit,
  onNewChat,
}: AgentChatPanelProps) {
  return (
    <section className="flex h-full w-[300px] min-w-[300px] flex-col overflow-hidden rounded-sm border border-slate-200 bg-[#fcfcfd]">
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3">
        <div className="text-sm font-medium text-slate-900">布局会话</div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onNewChat}
          className="h-8 rounded-full px-3 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          <SquarePen className="size-3.5" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 px-3 py-4">
          {messages.map((message) => {
            const isAssistant = message.role === "assistant"

            return (
              <div
                key={message.id}
                className={`rounded-2xl border px-3.5 py-3 ${
                  isAssistant
                    ? "border-slate-200 bg-white"
                    : "border-slate-200 bg-slate-50/90"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{isAssistant ? "Agent" : "User"}</span>
                  <span>{formatTimestamp(message.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-900">
                  {message.content}
                </p>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      <div className="border-t border-slate-200/80 px-4 py-2 text-[11px] text-slate-500">
        {statusText}
      </div>

      <form onSubmit={onSubmit} className="border-t border-slate-200/80 px-3 py-3">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-xs">
          <Textarea
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="输入布局命令"
            className="min-h-28 resize-none border-0 bg-transparent px-4 py-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0"
          />

          <div className="flex items-center justify-end px-3 pb-3">
            <Button
              type="submit"
              size="icon-sm"
              className="rounded-full bg-slate-950 text-white hover:bg-slate-800"
            >
              <ArrowUp className="size-4" />
            </Button>
          </div>
        </div>
      </form>
    </section>
  )
}
