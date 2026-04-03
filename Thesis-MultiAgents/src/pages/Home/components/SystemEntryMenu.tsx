import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { QuickEntry } from "../home-data"

interface SystemEntryMenuProps {
  menuRef: React.RefObject<HTMLDivElement | null>
  entryRef: React.RefObject<HTMLDivElement | null>
  itemRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>
  quickEntries: QuickEntry[]
  isOpen: boolean
  onToggle: () => void
  onSelect: (route: string) => void
}

export default function SystemEntryMenu({
  menuRef,
  entryRef,
  itemRefs,
  quickEntries,
  isOpen,
  onToggle,
  onSelect,
}: SystemEntryMenuProps) {
  return (
    <div ref={entryRef} className="relative flex items-center">
      <div
        ref={menuRef}
        className="pointer-events-none absolute right-full top-1/2 z-10 mr-3 -translate-y-1/2 opacity-0"
      >
        <div className="flex flex-col items-end gap-2">
          {quickEntries.map((entry, index) => {
            const EntryIcon = entry.icon

            return (
              <button
                key={entry.to}
                ref={(node) => {
                  itemRefs.current[index] = node
                }}
                type="button"
                className="group flex min-w-[176px] items-center justify-between rounded-xl border border-slate-200 bg-white/95 px-2.5 py-1.5 text-sm text-slate-700 shadow-[0_10px_25px_rgba(15,23,42,0.08)] backdrop-blur-sm transition-colors hover:border-slate-300 hover:bg-white"
                onClick={() => onSelect(entry.to)}
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                    <EntryIcon className="size-3.5" />
                  </span>
                  <span>{entry.label}</span>
                </span>
                <ArrowRight className="size-4 text-slate-500 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            )
          })}
        </div>
      </div>

      <Button type="button" size="lg" className="rounded-full px-6" onClick={onToggle}>
        <ArrowRight
          className={`size-4 rotate-180 transition-transform duration-200 ${isOpen ? "-translate-x-1" : ""}`}
        />
        进入系统
      </Button>
    </div>
  )
}
