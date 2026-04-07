import { useState } from "react"

import FloatingDockNav from "@/components/layout/FloatingDockNav"

import AgentQaWorkspace from "./components/AgentQaWorkspace"
import BuildWorkspace from "./components/BuildWorkspace"

export type KnowledgeGraphView = "build" | "qa"

export default function KnowledgeGraphPage() {
  const [activeView, setActiveView] = useState<KnowledgeGraphView>("build")

  return (
    <main className="h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7fafc_0%,#edf2f7_36%,#e8edf4_100%)] text-slate-950">
      <FloatingDockNav />

      <div className="h-full px-1.5 py-1.5 md:px-2 md:py-2">
        {activeView === "qa" ? (
          <AgentQaWorkspace activeView={activeView} onViewChange={setActiveView} />
        ) : (
          <BuildWorkspace onViewChange={setActiveView} />
        )}
      </div>
    </main>
  )
}
