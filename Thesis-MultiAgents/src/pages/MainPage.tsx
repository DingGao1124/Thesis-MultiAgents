import { Link } from "react-router"
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Boxes,
  GitBranch,
  MoveRight,
  Network,
  Orbit,
  Sparkles,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const heroStats = [
  { label: "Core Modules", value: "04" },
  { label: "Research Flow", value: "RAG + Agent" },
  { label: "Visualization", value: "Graph / 3D" },
]

const entranceModules = [
  {
    title: "Knowledge Graph Analysis",
    description:
      "Inspect entities, relationships, graph structure, and retrieval paths through a visual knowledge layer.",
    to: "/knowledge-graph",
    status: "Ready",
    icon: Network,
    accent: "from-sky-500/20 via-cyan-400/10 to-transparent",
    bullets: ["Entity relationship graph", "Semantic path exploration"],
  },
  {
    title: "Multi-Agent Collaboration",
    description:
      "Compare planning, delegation, and reasoning behavior across multiple agents in one experiment space.",
    to: "/multi-agents",
    status: "Preview",
    icon: Bot,
    accent: "from-emerald-500/20 via-teal-400/10 to-transparent",
    bullets: ["Task orchestration", "Decision trace comparison"],
  },
  {
    title: "Production Line Modeling",
    description:
      "Connect process nodes, execution states, and digital-twin logic for flexible production line experiments.",
    to: "/production-line",
    status: "Preview",
    icon: GitBranch,
    accent: "from-amber-500/20 via-orange-400/10 to-transparent",
    bullets: ["Dynamic flow modeling", "State-aware simulation"],
  },
  {
    title: "Robotics Simulation",
    description:
      "Explore robot motion, pose transitions, and interactive demonstrations for embodied system validation.",
    to: "/robotics",
    status: "Ready",
    icon: Orbit,
    accent: "from-fuchsia-500/20 via-pink-400/10 to-transparent",
    bullets: ["Motion trajectory view", "Interactive arm control"],
  },
]

const capabilityGroups = [
  {
    title: "Knowledge Layer",
    description: "Structured knowledge extraction, graph linking, and relationship visualization.",
    icon: BrainCircuit,
  },
  {
    title: "Agent Layer",
    description: "Planning, coordination, retrieval, and response generation in a multi-agent loop.",
    icon: Boxes,
  },
  {
    title: "Experiment Layer",
    description: "Digital-twin scenarios, robotics demos, and interface-driven thesis presentation.",
    icon: Sparkles,
  },
]

const workflowSteps = [
  "Collect domain knowledge and production context.",
  "Build structured knowledge representations and retrieval indexes.",
  "Drive agent collaboration for reasoning and decision making.",
  "Visualize results through graphs, interfaces, and embodied demos.",
]

export default function MainPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_24%),radial-gradient(circle_at_80%_10%,_rgba(251,191,36,0.12),_transparent_18%),linear-gradient(180deg,_#f7fbff_0%,_#eef4f7_46%,_#f8fafc_100%)] text-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]" />
        <div className="absolute left-[8%] top-24 h-64 w-64 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="absolute right-[10%] top-12 h-72 w-72 rounded-full bg-amber-200/25 blur-3xl" />
        <div className="absolute bottom-20 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-200/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-6 py-6 md:px-10 lg:px-12">
        <header className="flex items-center justify-between rounded-full border border-white/60 bg-white/70 px-5 py-3 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15">
              <BrainCircuit className="size-5" />
            </div>
            <div>
              <p className="text-xs font-medium tracking-[0.28em] text-slate-500 uppercase">
                Thesis Platform
              </p>
              <p className="text-sm font-semibold text-slate-900">
                Multi-Agent Digital Twin Research Demo
              </p>
            </div>
          </div>

          <div className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 md:block">
            Local environment online
          </div>
        </header>

        <section className="grid gap-8 pb-12 pt-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pb-16 lg:pt-16">
          <div className="space-y-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur">
              <Sparkles className="size-4 text-sky-600" />
              Research interface for graph, agent, and robotics experiments
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-4xl leading-tight font-semibold tracking-tight text-balance md:text-6xl">
                A cleaner thesis homepage for
                <span className="block bg-gradient-to-r from-slate-950 via-sky-800 to-cyan-600 bg-clip-text text-transparent">
                  multi-agent reasoning and digital-twin demos
                </span>
              </h1>
              <p className="max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
                This workspace brings knowledge graphs, RAG pipelines, collaborative
                agents, and robotics simulation into one polished entrance page so
                the project reads like a focused research product instead of a list of links.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-full bg-slate-950 px-6 text-sm font-semibold shadow-lg shadow-slate-950/20 hover:bg-slate-800"
              >
                <Link to="/knowledge-graph">
                  Explore modules
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-white/70 bg-white/75 px-6 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur hover:bg-white"
              >
                <Link to="/robotics">Open robotics demo</Link>
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {heroStats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white/70 bg-white/72 px-5 py-4 shadow-[0_14px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl"
                >
                  <div className="text-2xl font-semibold tracking-tight text-slate-950">
                    {item.value}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-12 h-24 w-24 rounded-full border border-white/60 bg-white/60 blur-sm" />
            <Card className="relative overflow-hidden rounded-[2rem] border-white/70 bg-white/78 py-0 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_32%),linear-gradient(135deg,_rgba(15,23,42,0.02),_rgba(255,255,255,0.65))]" />
              <CardHeader className="relative gap-4 border-b border-slate-200/70 py-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardDescription className="text-slate-500 uppercase tracking-[0.22em]">
                      System snapshot
                    </CardDescription>
                    <CardTitle className="mt-2 text-2xl text-slate-950">
                      Research pipeline at a glance
                    </CardTitle>
                  </div>
                  <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                    Live Demo
                  </div>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-6 py-6">
                <div className="grid gap-3">
                  {workflowSteps.map((step, index) => (
                    <div
                      key={step}
                      className="flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-white/85 px-4 py-4"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-7 text-slate-700">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl border border-slate-200/70 bg-slate-950 px-5 py-5 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs tracking-[0.22em] text-slate-400 uppercase">
                        Presentation focus
                      </p>
                      <p className="mt-2 text-lg font-medium">
                        Better storytelling for your thesis demo
                      </p>
                    </div>
                    <MoveRight className="size-5 text-sky-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="pb-12">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium tracking-[0.22em] text-slate-500 uppercase">
                Module access
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Four entrances, one consistent visual language
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-slate-600">
              Each card now acts like a product-level navigation tile with clearer
              status, stronger hierarchy, and a more premium research-dashboard feel.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {entranceModules.map((item) => {
              const Icon = item.icon

              return (
                <Card
                  key={item.to}
                  className="group relative overflow-hidden rounded-[1.75rem] border-white/70 bg-white/78 py-0 shadow-[0_18px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.accent}`} />

                  <CardHeader className="relative gap-5 py-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15">
                        <Icon className="size-5" />
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-xs font-medium text-slate-600">
                        {item.status}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <CardTitle className="text-2xl tracking-tight text-slate-950">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-7 text-slate-600">
                        {item.description}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="relative space-y-5 pb-6">
                    <div className="flex flex-wrap gap-2">
                      {item.bullets.map((bullet) => (
                        <span
                          key={bullet}
                          className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600"
                        >
                          {bullet}
                        </span>
                      ))}
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      className="h-11 w-full rounded-full border-slate-200 bg-white/85 text-slate-900 shadow-sm transition-colors hover:bg-slate-950 hover:text-white"
                    >
                      <Link to={item.to}>
                        Enter module
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <section className="grid gap-5 pb-14 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-[1.75rem] border-white/70 bg-slate-950 py-0 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
            <CardHeader className="gap-3 py-6">
              <CardDescription className="text-slate-400 uppercase tracking-[0.22em]">
                Platform value
              </CardDescription>
              <CardTitle className="text-3xl text-white">
                A thesis project should feel intentional on first glance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pb-6 text-sm leading-7 text-slate-300">
              <p>
                The homepage now frames the project as a coherent research platform:
                clearer priorities, stronger visual identity, and faster access to the
                experiments you want to show in a presentation.
              </p>
              <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4">
                <p className="text-xs tracking-[0.22em] text-slate-400 uppercase">
                  Best use case
                </p>
                <p className="mt-2 text-base text-white">
                  Demo day, thesis defense, lab showcase, and project onboarding
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 md:grid-cols-3">
            {capabilityGroups.map((item) => {
              const Icon = item.icon

              return (
                <Card
                  key={item.title}
                  className="rounded-[1.75rem] border-white/70 bg-white/78 py-0 shadow-[0_18px_60px_rgba(15,23,42,0.1)] backdrop-blur-xl"
                >
                  <CardHeader className="gap-4 py-6">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-slate-950">{item.title}</CardTitle>
                      <CardDescription className="mt-2 text-sm leading-7 text-slate-600">
                        {item.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
