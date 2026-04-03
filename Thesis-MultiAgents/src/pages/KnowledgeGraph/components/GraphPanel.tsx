import React from 'react'

export type GraphLegendItem = {
  name: string
  color: string
  count?: number
}

type GraphPanelProps = {
  title?: string
  isLoading?: boolean
  onRefresh?: () => void
  onToggleMaximize?: () => void
  showEdgeLabels: boolean
  onToggleEdgeLabels: (value: boolean) => void
  legendItems?: GraphLegendItem[]
  children: React.ReactNode
}

export default function GraphPanel({
  title = 'Graph Relationship Visualization',
  isLoading = false,
  onRefresh,
  onToggleMaximize,
  showEdgeLabels,
  onToggleEdgeLabels,
  legendItems = [],
  children
}: GraphPanelProps) {
  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[#FAFAFA]"
      style={{
        backgroundImage: 'radial-gradient(#D0D0D0 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px'
      }}
    >
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-[rgba(255,255,255,0.95)] to-[rgba(255,255,255,0)] px-5 py-4">
        <span className="pointer-events-auto text-[14px] font-semibold text-[#333]">
          {title}
        </span>
        <div className="pointer-events-auto flex items-center gap-2.5">
          <button
            className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#E0E0E0] bg-white px-3 text-[13px] text-[#666] shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:border-[#CCC] hover:bg-[#F5F5F5] hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onRefresh}
            disabled={isLoading || !onRefresh}
            title="Refresh graph"
            type="button"
          >
            <span className="text-[12px]">Refresh</span>
          </button>
          <button
            className="flex h-8 items-center justify-center gap-1.5 rounded-md border border-[#E0E0E0] bg-white px-3 text-[13px] text-[#666] shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:border-[#CCC] hover:bg-[#F5F5F5] hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onToggleMaximize}
            disabled={!onToggleMaximize}
            title="Maximize/Restore"
            type="button"
          >
            <span className="text-[12px]">Maximize</span>
          </button>
        </div>
      </div>

      <div className="h-full w-full">
        <div className="block h-full w-full">{children}</div>
      </div>

      {legendItems.length > 0 && (
        <div className="absolute bottom-6 left-6 z-10 rounded-lg border border-[#EAEAEA] bg-white/95 px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.5px] text-[#E91E63]">
            Entity Types
          </span>
          <div className="flex max-w-[320px] flex-wrap gap-x-4 gap-y-2">
            {legendItems.map((item) => (
              <div className="flex items-center gap-1.5 text-[12px] text-[#555]" key={item.name}>
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="whitespace-nowrap">
                  {item.name}
                  {typeof item.count === 'number' ? ` (${item.count})` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="absolute right-5 top-[60px] z-10 flex items-center gap-2.5 rounded-full border border-[#E0E0E0] bg-white px-3.5 py-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <label className="relative inline-flex h-[22px] w-10 items-center">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={showEdgeLabels}
            onChange={(event) => onToggleEdgeLabels(event.target.checked)}
          />
          <span className="absolute inset-0 rounded-[22px] bg-[#E0E0E0] transition peer-checked:bg-[#7B2D8E]" />
          <span className="absolute left-[3px] top-[3px] h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-[18px]" />
        </label>
        <span className="text-[12px] text-[#666]">Show Edge Labels</span>
      </div>
    </div>
  )
}