# Multi-Agent Thesis Project - Copilot Instructions

## Core Rule
- Always be simple and concise, do not give me a lot of bullshit!

## Project Scope
- Stack: Python backend + React/TypeScript frontend + Docker services.
- Backend entry: `main.py` (FastAPI on `127.0.0.1:8000`).
- Frontend: `Thesis-MultiAgents/`, API via Vite proxy `/api -> http://localhost:8000`.
- Infra source of truth: `docker-compose.yaml` (MinIO, pgvector/Postgres, Neo4j).

## Frontend Rules (Default)
- Use functional React components only.
- Keep React Compiler friendly: do not add manual `React.memo`, `useMemo`, `useCallback` unless explicitly required.
- Component library: use **shadcn/ui** by default.
- Chart library: use **ECharts** by default.
- Motion library: use **GSAP** by default, and prefer a reusable `useGsap` pattern/hook.
- Keep UI style industrial and professional (similar to SolidWorks / PlantSimulation): clean, minimal, stable layout.
- Do not make UI flashy; pages must be suitable for thesis screenshots.
- Keep components small and focused; follow decoupling and single responsibility.

## Backend Rules (Default)
- Use service-oriented structure and keep business logic in dedicated service modules.
- Keep functions/classes simple and readable; prioritize feature delivery.
- Avoid redundant defensive code and excessive `try/except`.
- Add `try/except` only where external I/O or clear failure boundaries require it.
- Keep explicit Python type hints.
- Use `.env` for secrets; never hardcode credentials.

## Code Style Rules
- Write code that is easy to read and easy to maintain.
- Control complexity: prefer straightforward flow over clever abstractions.
- Comments must be English only and added only when truly necessary.
- Prefer practical implementation over over-engineering.

## AI/Model Gateway Rules
- Chat model calls must go through OpenRouter (`OPENROUTER_API_KEY`).
- Embedding/reranking must go through DashScope (`DASHSCOPE_API_KEY`).
- Do not mix these providers for the wrong task.

## Integration Constraints
- Frontend Axios base URL remains `/api`.
- Keep routing structure compatible with current `src/App.tsx` pages.
- Keep new APIs typed in frontend API modules.
- Keep frontend component split and backend service split consistent with SRP.

## Development Workflow
- Infra: `docker-compose up -d` from repo root.
- Backend: `python main.py`.
- Frontend: `cd Thesis-MultiAgents && pnpm install && pnpm dev`.
- Validate with targeted manual checks (no stable full test suite yet).
