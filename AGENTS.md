# AGENTS.md

Repository-level instructions for AI coding agents working on this project.

## Core Rule
- Be simple and concise.
- Do not add unnecessary complexity.
- Prefer practical implementation over over-engineering.

## Project Overview
This project is an interactive digital twin platform for flexible production lines based on LLM-driven multi-agent collaboration.

The platform has four core modules:
1. Production task and twin asset management
2. Knowledge graph evolution and visualization
3. Multi-agent collaboration and monitoring
4. 3D digital twin reconstruction and rendering

Core business flow:
- import work orders and assets
- build or update the Line -> Module -> Unit knowledge graph
- run hierarchical agents for task decomposition and execution
- synchronize device and process state to the 3D scene

## Tech Stack
- Backend: Python + FastAPI
- Frontend: React + TypeScript
- Infra: Docker
- Graph DB: Neo4j
- Relational DB: PostgreSQL
- Object storage: MinIO
- 3D rendering: Three.js
- Real-time updates: WebSocket

## Repository Structure
- Backend entry: `main.py`
- Frontend app: `Thesis-MultiAgents/`
- Infra source of truth: `docker-compose.yaml`

## Setup Commands
- Start infra: `docker-compose up -d`
- Start backend: `python main.py`
- Start frontend:
  - `cd Thesis-MultiAgents`
  - `pnpm install`
  - `pnpm dev`

## Product Priorities
When implementing features, prioritize:
1. work order and asset flow
2. knowledge graph update and visualization
3. multi-agent task flow and logs
4. 3D scene synchronization

## Frontend Rules
- Scope: `Thesis-MultiAgents/src/**/*.{ts,tsx,css}`
- Use functional React components only.
- Keep React Compiler friendly: do not add `React.memo`, `useMemo`, `useCallback` unless clearly necessary.
- Use `shadcn/ui` as default UI library.
- Use `ECharts` as default chart library.
- Use `GSAP` as default motion library.
- Use `Three.js` for 3D scene rendering.
- Keep UI industrial, clean, stable, and suitable for thesis screenshots.
- Keep components small, typed, and decoupled.
- Keep API contracts typed and stable.

## Backend Rules
- Scope: `*.py`, `api/**/*.py`, `config/**/*.py`, `lib/**/*.py`, `modules/**/*.py`, `services/**/*.py`, `utils/**/*.py`
- Use service-oriented structure.
- Keep business logic in service modules.
- Keep functions straightforward and readable.
- Avoid excessive `try/except`.
- Add `try/except` only at external I/O boundaries.
- Use explicit Python type hints.
- Keep modules decoupled and follow single responsibility.
- Use `.env` for secrets; never hardcode credentials.

## Domain Rules
- PostgreSQL stores structured task data, metadata, and logs.
- MinIO stores 3D models and uploaded documents.
- Neo4j stores the three-layer knowledge graph.
- Do not treat the graph or 3D scene as optional features; both are core system capabilities.
- Keep the agent hierarchy explicit:
  - line-level agent
  - module-level agent
  - unit-level agent

## AI Provider Rules
- Chat model calls must go through OpenRouter (`OPENROUTER_API_KEY`).
- Embedding and reranking must go through DashScope (`DASHSCOPE_API_KEY`).
- Do not mix providers for the wrong task.

## Code Style
- Prioritize readability and maintainability.
- Prefer practical implementation over over-engineering.
- Comments and docstrings must be English only and only when necessary.
- Keep naming explicit and consistent.

## Validation
- No stable full test suite yet.
- Always run targeted manual checks for changed features.
- For frontend changes, verify routing, typing, and console output.
- For backend changes, verify API behavior and returned payloads.
- For graph features, verify Neo4j write and frontend visualization.
- For scene features, verify WebSocket events and 3D updates.

## Optional Nested AGENTS.md
- You may add nested `AGENTS.md` files for subprojects.
- The nearest `AGENTS.md` to edited files takes precedence.
