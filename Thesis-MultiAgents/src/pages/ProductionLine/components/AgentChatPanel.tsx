import type { FormEvent } from "react"
import { ArrowUp, FolderOpen, MessageSquareText, Save, SquarePen } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import type { ChatMessage } from "@/utils/productionLine"

type AgentChatPanelProps = {
  messages: ChatMessage[]
  input: string
  statusText: string
  currentLayoutName: string | null
  currentLayoutId: string | null
  isDirty: boolean
  onInputChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onNewLayout: () => void
  onSaveLayout: () => void
  onOpenLayoutLibrary: () => void
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

function getLayoutName(currentLayoutName: string | null) {
  return currentLayoutName?.trim() || "未命名布局"
}

function getLayoutStatus(currentLayoutId: string | null, isDirty: boolean) {
  if (!currentLayoutId || isDirty) {
    return {
      label: "未保存",
      dotClassName: "bg-amber-400",
      textClassName: "text-amber-600",
    }
  }

  return {
    label: "已保存",
    dotClassName: "bg-emerald-500",
    textClassName: "text-emerald-600",
  }
}

export default function AgentChatPanel({
  messages,
  input,
  statusText,
  currentLayoutName,
  currentLayoutId,
  isDirty,
  onInputChange,
  onSubmit,
  onNewLayout,
  onSaveLayout,
  onOpenLayoutLibrary,
}: AgentChatPanelProps) {
  const layoutName = getLayoutName(currentLayoutName)
  const layoutStatus = getLayoutStatus(currentLayoutId, isDirty)

  return (
    <section className="flex h-full w-85 min-w-85 flex-col overflow-hidden rounded-sm border border-slate-200 bg-[#fcfcfd]">
      <div className="border-b border-slate-200/80 px-4 py-3">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-900">
            <MessageSquareText size={16} />
            布局会话
          </div>

          <div className="min-w-0 text-center text-ellipsis">
            <p className="truncate text-sm font-medium text-slate-900">{layoutName}</p>
          </div>

          <div className={`flex items-center gap-2 text-xs ${layoutStatus.textClassName}`}>
            <span className={`inline-block size-2 rounded-full ${layoutStatus.dotClassName}`} />
            <span>{layoutStatus.label}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenLayoutLibrary}
            className="rounded-md border-slate-200 text-xs text-slate-700"
          >
            <FolderOpen className="size-3.5" />
            布局库
          </Button>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSaveLayout}
              className="rounded-md border-slate-200 text-xs text-slate-700"
            >
              <Save className="size-3.5" />
              保存布局
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onNewLayout}
              className="rounded-md border-slate-200 text-xs text-slate-700"
            >
              <SquarePen className="size-3.5" />
              新建布局
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 px-3 py-4">
          {messages.map((message) => {
            const isAssistant = message.role === "assistant"

            return (
              <div
                key={message.id}
                className={`rounded-xl border px-3.5 py-3 ${
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
        <span className="mr-2 inline-block size-2 rounded-full bg-emerald-500" />
        {statusText}
      </div>

      <form onSubmit={onSubmit} className="border-t border-slate-200/80">
        <div className="relative m-1 rounded-xl border border-slate-200 bg-white shadow-xs">
          <Textarea
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="请输入布局命令..."
            className="resize-none border-0 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus-visible:ring-0"
          />

          <div className="absolute right-2 bottom-2 flex items-center justify-end">
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
