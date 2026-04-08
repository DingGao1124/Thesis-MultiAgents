import type { FormEvent } from "react"

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
}: AgentChatPanelProps) {
  return (
    <section className="flex h-full w-[360px] min-w-[360px] flex-col overflow-hidden rounded-sm border border-slate-950 bg-white text-slate-950">
      <div className="border-b border-slate-950 px-3 py-3">
        <div className="text-sm font-medium">布局对话</div>
      </div>

      <ScrollArea className="min-h-0 flex-1 bg-white">
        <div className="space-y-3 p-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`border px-3 py-2 ${
                message.role === "assistant"
                  ? "border-slate-200 bg-white"
                  : "border-slate-950 bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{message.role === "assistant" ? "agent" : "user"}</span>
                <span>{formatTimestamp(message.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-900">{message.content}</p>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="border-t border-slate-200 px-3 py-2 text-[11px] text-slate-500">
        {statusText}
      </div>

      <form onSubmit={onSubmit} className="border-t border-slate-950 p-3">
        <Textarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder="输入布局命令"
          className="min-h-28 rounded-none border-slate-950 bg-white text-sm text-slate-950 placeholder:text-slate-400 focus-visible:border-slate-950 focus-visible:ring-0"
        />

        <div className="mt-3 flex justify-end">
          <Button type="submit" className="rounded-none bg-slate-950 px-4 text-white hover:bg-slate-800">
            执行
          </Button>
        </div>
      </form>
    </section>
  )
}
