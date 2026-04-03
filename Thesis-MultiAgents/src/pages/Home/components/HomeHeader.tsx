import { Badge } from "@/components/ui/badge"

interface HomeHeaderProps {
  onTriggerEasterEgg: () => void
}

export default function HomeHeader({ onTriggerEasterEgg }: HomeHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-slate-200/80 pb-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center overflow-hidden rounded-2xl">
          <img src="/Agent.svg" alt="Agent" className="size-6 object-contain" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">
            LLM-Multi-Agents for Digital Twin Production Line
          </p>
          <p className="text-xs text-slate-500">大语言模型多智能体协同建模平台</p>
        </div>
      </div>

      <Badge variant="outline" className="rounded-full px-3 py-1 text-slate-600">
        <button
          type="button"
          aria-label="System online status"
          className="mr-2 inline-flex size-3 items-center justify-center rounded-full"
          onClick={onTriggerEasterEgg}
        >
          <span className="inline-block size-2 rounded-full bg-emerald-500" />
        </button>
        System Online
      </Badge>
    </header>
  )
}
