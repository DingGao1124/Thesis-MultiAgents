import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import gsap from "gsap"

import { highlights, modules, quickEntries } from "./home-data"
import HomeFooter from "./components/HomeFooter"
import HomeHeader from "./components/HomeHeader"
import HomeHero from "./components/HomeHero"
import ModuleDetailsModal from "./components/ModuleDetailsModal"
import ModuleGrid from "./components/ModuleGrid"
import FloatingDockNav from "@/components/layout/FloatingDockNav"

export default function HomePage() {
  const navigate = useNavigate()
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  const [easterEggClicks, setEasterEggClicks] = useState(0)
  const [systemMenuOpen, setSystemMenuOpen] = useState(false)

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const originRectRef = useRef<DOMRect | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)
  const closeActionRef = useRef<(() => void) | null>(null)
  const easterEggTimerRef = useRef<number | null>(null)
  const systemMenuRef = useRef<HTMLDivElement | null>(null)
  const systemMenuItemsRef = useRef<(HTMLButtonElement | null)[]>([])
  const systemEntryRef = useRef<HTMLDivElement | null>(null)

  const activeModule = modules.find((item) => item.id === activeModuleId) ?? null

  useEffect(() => {
    if (!activeModuleId || !modalRef.current || !overlayRef.current || !originRectRef.current) {
      return
    }

    const modalEl = modalRef.current
    const overlayEl = overlayRef.current
    const originRect = originRectRef.current
    const modalRect = modalEl.getBoundingClientRect()

    const deltaX = originRect.left - modalRect.left
    const deltaY = originRect.top - modalRect.top
    const scaleX = originRect.width / modalRect.width
    const scaleY = originRect.height / modalRect.height

    gsap.set(overlayEl, { opacity: 0 })
    gsap.set(modalEl, {
      transformOrigin: "top left",
      x: deltaX,
      y: deltaY,
      scaleX,
      scaleY,
      borderRadius: 24,
    })

    const timeline = gsap.timeline()
    timeline.to(overlayEl, { opacity: 1, duration: 0.18, ease: "power1.out" }, 0)
    timeline.to(
      modalEl,
      {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        borderRadius: 32,
        duration: 0.38,
        ease: "power3.out",
      },
      0
    )

    return () => {
      timeline.kill()
    }
  }, [activeModuleId])

  useEffect(() => {
    const menuEl = systemMenuRef.current
    const items = systemMenuItemsRef.current.filter(Boolean)

    if (!menuEl || items.length === 0) {
      return
    }

    if (systemMenuOpen) {
      gsap.killTweensOf([menuEl, ...items])
      gsap.set(menuEl, { pointerEvents: "auto" })
      gsap.set(items, { x: 12, opacity: 0 })
      gsap.to(menuEl, { opacity: 1, duration: 0.18, ease: "power2.out" })
      gsap.to(items, {
        x: 0,
        opacity: 1,
        duration: 0.28,
        ease: "power3.out",
        stagger: 0.06,
      })
      return
    }

    const timeline = gsap.timeline()
    timeline.to(items.slice().reverse(), {
      x: 8,
      opacity: 0,
      duration: 0.18,
      ease: "power2.in",
      stagger: 0.04,
    })
    timeline.to(
      menuEl,
      {
        opacity: 0,
        duration: 0.14,
        ease: "power2.in",
        onComplete: () => {
          gsap.set(menuEl, { pointerEvents: "none" })
        },
      },
      0
    )
  }, [systemMenuOpen])

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!systemEntryRef.current?.contains(event.target as Node)) {
        setSystemMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [])

  useEffect(() => {
    closeActionRef.current = closeModule
  }, [activeModuleId])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeActionRef.current?.()
        setSystemMenuOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (easterEggClicks === 0) {
      return
    }

    if (easterEggTimerRef.current) {
      window.clearTimeout(easterEggTimerRef.current)
    }

    if (easterEggClicks >= 5) {
      navigate("/game")
      setEasterEggClicks(0)
      return
    }

    easterEggTimerRef.current = window.setTimeout(() => {
      setEasterEggClicks(0)
    }, 1200)

    return () => {
      if (easterEggTimerRef.current) {
        window.clearTimeout(easterEggTimerRef.current)
      }
    }
  }, [easterEggClicks, navigate])

  function openModule(moduleId: string) {
    const cardEl = cardRefs.current[moduleId]
    if (!cardEl) {
      setActiveModuleId(moduleId)
      return
    }

    originRectRef.current = cardEl.getBoundingClientRect()
    setActiveModuleId(moduleId)
  }

  function closeModule() {
    if (!activeModuleId || !modalRef.current || !overlayRef.current) {
      setActiveModuleId(null)
      return
    }

    const targetCard = cardRefs.current[activeModuleId]
    const targetRect = targetCard?.getBoundingClientRect()

    if (!targetRect) {
      setActiveModuleId(null)
      return
    }

    const modalEl = modalRef.current
    const overlayEl = overlayRef.current
    const modalRect = modalEl.getBoundingClientRect()

    const deltaX = targetRect.left - modalRect.left
    const deltaY = targetRect.top - modalRect.top
    const scaleX = targetRect.width / modalRect.width
    const scaleY = targetRect.height / modalRect.height

    const timeline = gsap.timeline({ onComplete: () => setActiveModuleId(null) })
    timeline.to(
      modalEl,
      {
        transformOrigin: "top left",
        x: deltaX,
        y: deltaY,
        scaleX,
        scaleY,
        borderRadius: 24,
        duration: 0.3,
        ease: "power3.inOut",
      },
      0
    )
    timeline.to(overlayEl, { opacity: 0, duration: 0.18, ease: "power1.out" }, 0)
  }

  function triggerEasterEgg() {
    setEasterEggClicks((count) => count + 1)
  }

  function handleQuickEntry(route: string) {
    setSystemMenuOpen(false)
    navigate(route)
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f3f6f8_100%)] text-slate-950 lg:h-screen lg:overflow-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-5 md:px-8 lg:h-screen lg:px-12 lg:py-6">
        <HomeHeader onTriggerEasterEgg={triggerEasterEgg} />

        <div className="flex flex-1 flex-col gap-8 py-6 lg:grid lg:min-h-0 lg:grid-cols-[0.88fr_1.12fr] lg:gap-8 lg:py-5">
          <HomeHero
            highlights={highlights}
            quickEntries={quickEntries}
            isSystemMenuOpen={systemMenuOpen}
            onToggleSystemMenu={() => setSystemMenuOpen((open) => !open)}
            onSelectQuickEntry={handleQuickEntry}
            systemMenuRef={systemMenuRef}
            systemEntryRef={systemEntryRef}
            systemMenuItemsRef={systemMenuItemsRef}
          />

          <ModuleGrid modules={modules} cardRefs={cardRefs} onOpenModule={openModule} />
        </div>

        <HomeFooter />
      </div>

      <ModuleDetailsModal
        module={activeModule}
        modalRef={modalRef}
        overlayRef={overlayRef}
        onClose={closeModule}
      />

      <FloatingDockNav />
    </main>
  )
}
