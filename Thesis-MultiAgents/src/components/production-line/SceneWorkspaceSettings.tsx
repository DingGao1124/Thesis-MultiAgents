import { Switch } from "@/components/ui/switch"
import type { SceneSettings } from "./SceneWorkspaceCanvas"

type SceneWorkspaceSettingsProps = {
  open: boolean
  onToggle: () => void
  settings: SceneSettings
  onSettingsChange: (updater: (current: SceneSettings) => SceneSettings) => void
}

export default function SceneWorkspaceSettings({
  open,
  onToggle,
  settings,
  onSettingsChange,
}: SceneWorkspaceSettingsProps) {
  return (
    <div className="absolute top-2 right-2 z-10 flex flex-col items-end">
      <button
        type="button"
        onClick={onToggle}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/96 text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700"
        title="渲染设置"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
        </svg>
      </button>

      {open ? (
        <div className="mt-1 w-48 rounded-xl border border-slate-200 bg-white/96 p-3 shadow-sm backdrop-blur-sm">
          <div className="mb-2 text-[11px] font-medium text-slate-900">渲染设置</div>
          <div className="space-y-2.5">
            <label className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600">高清 (2x DPR)</span>
              <Switch
                checked={settings.maxDpr === 2}
                onCheckedChange={(checked) =>
                  onSettingsChange((current) => ({ ...current, maxDpr: checked ? 2 : 1 }))
                }
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600">抗锯齿</span>
              <Switch
                checked={settings.antialias}
                onCheckedChange={(checked) =>
                  onSettingsChange((current) => ({ ...current, antialias: checked }))
                }
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600">网格</span>
              <Switch
                checked={settings.showGrid}
                onCheckedChange={(checked) =>
                  onSettingsChange((current) => ({ ...current, showGrid: checked }))
                }
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-[11px] text-slate-600">坐标轴</span>
              <Switch
                checked={settings.showAxes}
                onCheckedChange={(checked) =>
                  onSettingsChange((current) => ({ ...current, showAxes: checked }))
                }
              />
            </label>
          </div>
        </div>
      ) : null}
    </div>
  )
}
