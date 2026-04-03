---
applyTo: "Thesis-MultiAgents/src/**/*.{ts,tsx,css}"
---

# Frontend Scoped Rules (Thesis-MultiAgents/src)

- Always be simple and concise, do not give me a lot of bullshit!
- Use functional React components only.
- Keep React Compiler friendly: do not add manual React.memo, useMemo, useCallback unless explicitly required.
- Use shadcn/ui as the default component library, use **npx shadcn@latest add** to add components.
- Use ECharts as the default chart library.
- Use GSAP as the default motion library and prefer a reusable useGsap hook/pattern.
- Keep UI industrial and professional (SolidWorks / PlantSimulation style): clean, stable, minimal.
- Do not make UI flashy; keep pages suitable for thesis screenshots.
- Keep component boundaries clear and small; follow decoupling and single responsibility.
- Keep frontend API contracts typed and compatible with current src/App.tsx routing.
- Keep comments in English only, and add comments only when necessary.
