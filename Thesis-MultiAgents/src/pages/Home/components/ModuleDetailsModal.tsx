import { ArrowRight, X } from "lucide-react"
import { Link } from "react-router"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ModuleItem } from "../home-data"

interface ModuleDetailsModalProps {
  module: ModuleItem | null
  modalRef: React.RefObject<HTMLDivElement | null>
  overlayRef: React.RefObject<HTMLDivElement | null>
  onClose: () => void
}

export default function ModuleDetailsModal({
  module,
  modalRef,
  overlayRef,
  onClose,
}: ModuleDetailsModalProps) {
  if (!module) {
    return null
  }

  const ModuleIcon = module.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-3xl rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_120px_rgba(15,23,42,0.18)] md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
              <ModuleIcon className="size-6" />
            </div>
            <div>
              <Badge variant="outline" className="rounded-full px-3 py-1 text-slate-600">
                模块详情
              </Badge>
              <h2 className="mt-3 text-2xl font-semibold text-slate-950 md:text-3xl">
                {module.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                {module.description}
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="rounded-full text-slate-600"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-6 grid gap-3 border-t border-slate-200 pt-6">
          {module.details.map((detail) => (
            <div
              key={detail}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-7 text-slate-600"
            >
              {detail}
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" className="rounded-full px-6" onClick={onClose}>
            关闭
          </Button>
          <Button asChild className="rounded-full px-6">
            <Link to={module.to}>
              进入模块
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
