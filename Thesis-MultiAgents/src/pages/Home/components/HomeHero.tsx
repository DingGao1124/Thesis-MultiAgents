import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { HighlightItem, QuickEntry } from "../home-data"
import SystemEntryMenu from "./SystemEntryMenu"

interface HomeHeroProps {
  highlights: HighlightItem[]
  quickEntries: QuickEntry[]
  isSystemMenuOpen: boolean
  onToggleSystemMenu: () => void
  onSelectQuickEntry: (route: string) => void
  systemMenuRef: React.RefObject<HTMLDivElement | null>
  systemEntryRef: React.RefObject<HTMLDivElement | null>
  systemMenuItemsRef: React.MutableRefObject<(HTMLButtonElement | null)[]>
}

export default function HomeHero({
  highlights,
  quickEntries,
  isSystemMenuOpen,
  onToggleSystemMenu,
  onSelectQuickEntry,
  systemMenuRef,
  systemEntryRef,
  systemMenuItemsRef,
}: HomeHeroProps) {
  return (
    <section className="flex flex-col justify-center lg:min-h-0">
      <div className="max-w-2xl">
        <Badge
          variant="secondary"
          className="mb-3 rounded-full bg-white px-3 py-1 text-slate-600 shadow-sm"
        >
          Multi-Agent System + Digital Twin
        </Badge>

        <h1 className="text-4xl leading-tight font-semibold tracking-tight md:text-5xl xl:text-6xl">
          LLM 驱动的
          <span className="block">多智能体协同建模平台</span>
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 md:text-base">
          集成知识图谱、协同推理、产线建模与三维模型资产能力，面向柔性生产线数字孪生场景快速展示。
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <SystemEntryMenu
            menuRef={systemMenuRef}
            entryRef={systemEntryRef}
            itemRefs={systemMenuItemsRef}
            quickEntries={quickEntries}
            isOpen={isSystemMenuOpen}
            onToggle={onToggleSystemMenu}
            onSelect={onSelectQuickEntry}
          />

          <Button asChild size="lg" variant="outline" className="rounded-full px-6">
            <Link to="/model-assets">进入模型资产模块</Link>
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          {highlights.map((item) => (
            <Badge
              key={item.label}
              variant="outline"
              className={`rounded-full px-3 py-1 ${item.className}`}
            >
              {item.label}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  )
}
