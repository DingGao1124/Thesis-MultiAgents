import { useEffect, useRef, useState } from "react"
import { Link } from "react-router"
import gsap from "gsap"
import { Bot, Boxes, Factory, Home, Network } from "lucide-react"

const dockItems = [
  { label: "主页", to: "/", icon: Home, className: "bg-white text-slate-700" },
  { label: "知识图谱", to: "/knowledge-graph", icon: Network, className: "bg-sky-50 text-sky-700" },
  { label: "多智能体", to: "/multi-agents", icon: Bot, className: "bg-emerald-50 text-emerald-700" },
  { label: "产线建模", to: "/production-line", icon: Factory, className: "bg-amber-50 text-amber-700" },
  { label: "模型资产", to: "/model-assets", icon: Boxes, className: "bg-slate-950 text-white" },
]

const dockTransforms = [
  { x: 46, y: -104 },
  { x: 62, y: -56 },
  { x: 70, y: -8 },
  { x: 62, y: 40 },
  { x: 46, y: 88 },
]

export default function FloatingDockNav() {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [isPinned, setIsPinned] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const isExpanded = isPinned || isHovering

  useEffect(() => {
    if (!shellRef.current) {
      return
    }

    gsap.killTweensOf(shellRef.current)
    gsap.to(shellRef.current, {
      x: isExpanded ? 2 : -22,
      duration: 0.12,
      ease: "power3.out",
    })
  }, [isExpanded])

  useEffect(() => {
    const items = itemRefs.current.filter(Boolean)
    if (!items.length) {
      return
    }

    gsap.killTweensOf(items)

    if (isPinned) {
      gsap.set(items, { pointerEvents: "auto" })
      gsap.to(items, {
        x: (index) => dockTransforms[index].x,
        y: (index) => dockTransforms[index].y,
        opacity: 1,
        scale: 1,
        duration: 0.01,
        ease: "expo.out",
        overwrite: "auto",
      })
      return
    }

    gsap.to(items, {
      x: 0,
      y: 0,
      opacity: 0,
      scale: 0.9,
      duration: 0.22,
      ease: "power3.inOut",
      overwrite: "auto",
      onComplete: () => {
        gsap.set(items, { pointerEvents: "none" })
      },
    })
  }, [isPinned])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (!shellRef.current?.contains(target)) {
        setIsPinned(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPinned(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  return (
    <div
      ref={shellRef}
      className="fixed top-1/2 left-0 z-40 -translate-y-1/2"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative flex items-center">
        {dockItems.map((item, index) => {
          const Icon = item.icon
          return (
            <Link
              key={item.to}
              ref={(node) => {
                itemRefs.current[index] = node
              }}
              to={item.to}
              title={item.label}
              aria-label={item.label}
              className={`absolute left-[10px] top-1/2 flex h-8.5 w-8.5 -translate-y-1/2 items-center justify-center rounded-full border border-white/85 shadow-[0_10px_20px_rgba(15,23,42,0.1)] backdrop-blur transition-transform hover:scale-105 ${item.className}`}
              style={{ opacity: 0, transform: "translate(0px, 0px) scale(0.88)" }}
              onClick={() => setIsPinned(false)}
            >
              <Icon className="size-3.5" />
            </Link>
          )
        })}

        <button
          type="button"
          aria-label="Toggle platform navigation"
          onClick={() => setIsPinned((value) => !value)}
          className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/85 bg-white/92 shadow-[0_12px_28px_rgba(15,23,42,0.12)] backdrop-blur"
        >
          <img src="/Agent.svg" alt="Platform Logo" className="size-3.5 object-contain" />
        </button>
      </div>
    </div>
  )
}
