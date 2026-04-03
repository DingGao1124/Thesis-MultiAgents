import { ArrowRight } from "lucide-react"
import { Link } from "react-router"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ModuleItem } from "../home-data"

interface ModuleGridProps {
  modules: ModuleItem[]
  cardRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>
  onOpenModule: (moduleId: string) => void
}

export default function ModuleGrid({
  modules,
  cardRefs,
  onOpenModule,
}: ModuleGridProps) {
  return (
    <section className="grid gap-3 md:grid-cols-2 lg:min-h-0 lg:auto-rows-fr">
      {modules.map((item, index) => {
        const Icon = item.icon

        return (
          <div
            key={item.id}
            ref={(node) => {
              cardRefs.current[item.id] = node
            }}
          >
            <Card
              className="group relative h-full cursor-pointer overflow-hidden rounded-[1.6rem] border border-slate-200/55 bg-white/55 py-0 shadow-[0_6px_18px_rgba(15,23,42,0.03)] backdrop-blur-[2px] transition-all duration-300 hover:-translate-y-1 hover:border-slate-200/90 hover:bg-white/96 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
              onClick={() => onOpenModule(item.id)}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-slate-950/80 to-slate-400/20" />

              <CardHeader className="gap-0 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/65 text-slate-900 shadow-sm transition-colors duration-300 group-hover:bg-slate-50">
                        <Icon className="size-5" />
                      </div>
                      <div className="rounded-full border border-slate-200/70 bg-white/65 px-2.5 py-1 text-[11px] font-medium text-slate-500 transition-colors duration-300 group-hover:bg-slate-50">
                        Core Module
                      </div>
                    </div>

                    <CardTitle className="mt-4 text-[22px] leading-none tracking-tight">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="mt-3 text-[15px] leading-7 text-slate-600">
                      {item.description}
                    </CardDescription>
                  </div>

                  <div className="text-xs font-medium text-slate-400">0{index + 1}</div>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col justify-end pb-4">
                <div className="rounded-2xl border border-slate-200/60 bg-white/45 px-4 py-3 backdrop-blur-sm transition-all duration-300 group-hover:border-slate-200/80 group-hover:bg-slate-50/80">
                  <p className="text-sm leading-6 text-slate-600">{item.details[0]}</p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Button type="button" variant="ghost" className="h-8 rounded-full px-3 text-slate-600">
                    查看信息
                  </Button>

                  <Button asChild className="h-8 rounded-full bg-slate-950 px-3 text-white">
                    <Link
                      to={item.to}
                      className="group"
                      onClick={(event) => {
                        event.stopPropagation()
                      }}
                    >
                      进入模块
                      <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      })}
    </section>
  )
}
