# AGENTS.md

Repository-level instructions for AI coding agents working on this project.

## Core Rule
- Be simple and concise. Do not add unnecessary complexity.

## Project Overview
- Stack: Python backend + React/TypeScript frontend + Docker services.
- Backend entry: `main.py` (FastAPI on `127.0.0.1:8000`).
- Frontend app: `Thesis-MultiAgents/`.
- Frontend API base: `/api` via Vite proxy to `http://localhost:8000`.
- Infra source of truth: `docker-compose.yaml` (MinIO, pgvector/Postgres, Neo4j).

## Setup Commands
- Start infra: `docker-compose up -d`
- Start backend: `python main.py`
- Start frontend:
	- `cd Thesis-MultiAgents`
	- `pnpm install`
	- `pnpm dev`

## Frontend Rules
- Scope: `Thesis-MultiAgents/src/**/*.{ts,tsx,css}`
- Use functional React components only.
- Keep React Compiler friendly: do not add `React.memo`, `useMemo`, `useCallback` unless explicitly required.
- Use `shadcn/ui` as default UI component library.
- Use `ECharts` as default chart library.
- Use `GSAP` as default motion library; prefer reusable `useGsap` pattern.
- Keep UI industrial and professional (clean, stable, minimal; suitable for thesis screenshots).
- Keep component boundaries small and decoupled (single responsibility).
- Keep frontend API contracts typed and compatible with `src/App.tsx` routing.

## Backend Rules
- Scope: `*.py`, `api/**/*.py`, `config/**/*.py`, `lib/**/*.py`, `modules/**/*.py`, `services/**/*.py`, `utils/**/*.py`
- Use service-oriented structure; keep business logic in service modules.
- Keep functions/classes straightforward and readable.
- Avoid redundant defensive code and excessive `try/except`.
- Add `try/except` only at external I/O boundaries or clear failure boundaries.
- Keep explicit Python type hints.
- Keep modules decoupled and follow single responsibility.
- Use `.env` for secrets; never hardcode credentials.

## AI Provider Rules
- Chat model calls must go through OpenRouter (`OPENROUTER_API_KEY`).
- Embedding/reranking must go through DashScope (`DASHSCOPE_API_KEY`).
- Do not mix providers for the wrong task.

## Code Style
- Prioritize readability and maintainability.
- Prefer practical implementation over over-engineering.
- Comments/docstrings must be English only and only when necessary.

## Validation
- No stable full test suite yet.
- Always run targeted manual checks related to changed features.
- If frontend changes affect typing/lint behavior, run relevant checks before finishing.

## Optional Nested AGENTS.md
- For subprojects, you may add nested `AGENTS.md` files.
- The nearest `AGENTS.md` to edited files should take precedence.
