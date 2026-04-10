import { FolderOpen, Search, Trash2 } from "lucide-react"

import type { ProductionLineLayoutSummary } from "@/api/productionLineLayouts"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

type LayoutLibraryDialogProps = {
  open: boolean
  keyword: string
  layouts: ProductionLineLayoutSummary[]
  isLoading: boolean
  deletingLayoutId: string | null
  loadingLayoutId: string | null
  currentLayoutId: string | null
  onOpenChange: (open: boolean) => void
  onKeywordChange: (value: string) => void
  onLoad: (layoutId: string) => void
  onDelete: (layout: ProductionLineLayoutSummary) => void
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date)
}

export default function LayoutLibraryDialog({
  open,
  keyword,
  layouts,
  isLoading,
  deletingLayoutId,
  loadingLayoutId,
  currentLayoutId,
  onOpenChange,
  onKeywordChange,
  onLoad,
  onDelete,
}: LayoutLibraryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl gap-0 p-0">
        <DialogHeader className="border-b border-slate-200 px-6 py-4">
          <DialogTitle className="text-base text-slate-950">布局库</DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            检索、加载和管理已保存的布局场景。
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-slate-200 px-6 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder="搜索布局名称"
              className="h-10 border-slate-200 pl-9 text-sm shadow-none"
            />
          </div>
        </div>

        <ScrollArea className="h-[420px] px-6 py-4">
          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
                正在加载布局列表...
              </div>
            ) : null}

            {!isLoading && layouts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm text-slate-500">
                当前没有匹配的布局记录。
              </div>
            ) : null}

            {!isLoading
              ? layouts.map((layout) => {
                const isCurrent = layout.id === currentLayoutId
                const isDeleting = deletingLayoutId === layout.id
                const isLoadingLayout = loadingLayoutId === layout.id

                return (
                  <div
                    key={layout.id}
                    className={`rounded-2xl border px-4 py-4 ${
                      isCurrent
                        ? "border-sky-200 bg-sky-50/60"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {layout.name}
                          </p>
                          {isCurrent ? (
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] text-sky-700">
                              当前布局
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>模型实例 {layout.placement_count}</span>
                          <span>会话消息 {layout.message_count}</span>
                          <span>创建于 {formatTimestamp(layout.created_at)}</span>
                          <span>更新于 {formatTimestamp(layout.updated_at)}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => onLoad(layout.id)}
                          disabled={isDeleting || isLoadingLayout}
                          className="rounded-full border-slate-200"
                        >
                          <FolderOpen className="size-3.5" />
                          {isLoadingLayout ? "加载中" : "加载"}
                        </Button>

                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => onDelete(layout)}
                          disabled={isDeleting || isLoadingLayout}
                          className="rounded-full"
                        >
                          <Trash2 className="size-3.5" />
                          {isDeleting ? "删除中" : "删除"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })
              : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
