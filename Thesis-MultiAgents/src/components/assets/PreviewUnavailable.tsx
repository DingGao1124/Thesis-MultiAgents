import { Box } from "lucide-react"

export default function PreviewUnavailable({
  compact = false,
  sizeLabel,
}: {
  compact?: boolean
  sizeLabel?: string
}) {
  return (
    <div className="flex h-full items-center justify-center bg-slate-100/80 px-4 text-center">
      <div className="flex max-w-[240px] flex-col items-center gap-3 text-slate-500">
        <div className="rounded-full border border-slate-200 bg-white p-3 shadow-sm">
          <Box className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </div>
        <div className={compact ? "text-xs" : "text-sm"}>
          文件过大，暂不支持预览
        </div>
        {sizeLabel ? (
          <div className="text-[11px] text-slate-400">{sizeLabel}</div>
        ) : null}
      </div>
    </div>
  )
}
