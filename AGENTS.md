# AGENTS.md

Repository-level instructions for AI coding agents working on this project.

## Core Rule
- Be simple and concise.
- Do not add unnecessary complexity.
- Prefer practical implementation over over-engineering.
- This project is thesis-oriented: prioritize features that support screenshots, experiments, and stable end-to-end interaction.
- Do not add explanatory copy in the product UI, such as usage instructions, feature introductions, or tutorial-style helper text, unless explicitly requested.
- Do not use words like `demo`, `prototype`, `mock`, `example`, or other labels that make the platform look unfinished.
- Always treat the product as a formal production-ready industrial platform, not as a temporary showcase system.

## Project Overview
This repository implements an interactive digital twin modeling platform for flexible production lines based on LLM-driven multi-agent collaboration.

The platform is centered around four core modules:

1. **Production Task and Twin Asset Management**
   - Import dynamic work orders containing batch size, process requirements, and product type.
   - Upload and version-manage 3D assets and process documents.
   - Store structured task data in PostgreSQL.
   - Store model files and document resources in MinIO.

2. **Production Line Knowledge Graph Evolution and Visualization**
   - Extract entities, attributes, and relations from process manuals and equipment parameters.
   - Build and update a three-layer knowledge graph: **Line -> Module -> Unit**.
   - Persist graph data in Neo4j.
   - Provide frontend graph visualization with node inspection, drag interaction, and filtering.

3. **Multi-Agent Collaborative Decision and Interaction Monitoring**
   - Support hierarchical agents at line level, module level, and unit level.
   - Display task decomposition, agent dialogue, execution logs, and status transitions.
   - Make agent collaboration visible and debuggable.

4. **3D Digital Twin Dynamic Reconstruction and Rendering**
   - Render the virtual workshop with WebGL and Three.js.
   - Receive device pose and process state updates through WebSocket.
   - Update virtual device motion in real time.
   - Adjust scene nodes and spatial structure when layout changes are triggered by hierarchical task trees.

## Project Architecture
- Stack: Python backend + React/TypeScript frontend + Docker services.
- Backend entry: `main.py` (FastAPI on `127.0.0.1:8000`).
- Frontend app: `Thesis-MultiAgents/`.
- Frontend API base: `/api` via Vite proxy to `http://localhost:8000`.
- Infra source of truth: `docker-compose.yaml` (MinIO, pgvector/Postgres, Neo4j).

## Engineering Goal
Agents should treat this repository as a full-stack industrial platform, not as a generic chat app.

The main product goal is to support:
- work order import and task dispatch
- twin asset upload and management
- knowledge graph construction, update, query, and visualization
- multi-agent task decomposition and monitoring
- real-time 3D scene synchronization and dynamic reconstruction
- experiment-oriented interfaces suitable for thesis validation and screenshots

## Setup Commands
- Start infra: `docker-compose up -d`
- Start backend: `python main.py`
- Start frontend:
  - `cd Thesis-MultiAgents`
  - `pnpm install`
  - `pnpm dev`

## Recommended Working Order
When implementing new features, follow this priority:

1. Keep the end-to-end flow working:
   - create/import task
   - process backend state
   - update graph or agent status
   - push scene state
   - render result in frontend

2. Prefer features that directly support the four core modules.

3. For UI work, prioritize pages and components that are useful for:
   - thesis screenshots
   - experiment replay
   - debugging agent workflows
   - graph and scene visualization

## Frontend Rules
- Scope: `Thesis-MultiAgents/src/**/*.{ts,tsx,css}`
- Use functional React components only.
- Keep React Compiler friendly: do not add `React.memo`, `useMemo`, `useCallback` unless explicitly required.
- Use `shadcn/ui` as default UI component library.
- Use `ECharts` as default chart library.
- Use `GSAP` as default motion library; prefer reusable `useGsap` pattern.
- Use `Three.js` for 3D scene rendering and dynamic asset updates.
- Use WebSocket for real-time scene status updates when possible.
- Keep UI industrial and professional: clean, stable, minimal, suitable for thesis screenshots.
- Keep component boundaries small and decoupled.
- Keep frontend API contracts typed and compatible with `src/App.tsx` routing.
- Favor dashboard-style layouts with clear panels, status cards, graph views, logs, and scene views.
- Avoid overly flashy visual effects that reduce clarity.

## Recommended Frontend Pages
Agents should prefer building or extending the following pages:

- **Dashboard**
  - high-level system status
  - task progress
  - agent overview
  - scene summary

- **Task and Asset Management**
  - work order import
  - task list
  - asset upload
  - document upload
  - version management

- **Knowledge Graph View**
  - graph visualization
  - node detail panel
  - relation filtering
  - three-layer hierarchy display

- **Multi-Agent Monitoring**
  - agent panels by hierarchy
  - task decomposition view
  - dialogue stream
  - execution logs
  - status transitions

- **3D Twin Scene**
  - scene tree
  - device status panel
  - real-time updates
  - layout reconstruction result

- **Experiment / Validation View**
  - experiment selection
  - result metrics
  - comparison charts
  - replay-oriented logs

## Backend Rules
- Scope: `*.py`, `api/**/*.py`, `config/**/*.py`, `lib/**/*.py`, `modules/**/*.py`, `services/**/*.py`, `utils/**/*.py`
- Use service-oriented structure; keep business logic in service modules.
- Keep functions and classes straightforward and readable.
- Avoid redundant defensive code and excessive `try/except`.
- Add `try/except` only at external I/O boundaries or clear failure boundaries.
- Keep explicit Python type hints.
- Keep modules decoupled and follow single responsibility.
- Use `.env` for secrets; never hardcode credentials.
- Prefer clear domain separation across task management, asset management, graph services, agent services, and scene synchronization.

## Backend Domain Guidance
When adding backend features, keep responsibilities separated:

- **Task services**
  - work order ingestion
  - task state transitions
  - experiment-related task records

- **Asset services**
  - file upload
  - version metadata
  - asset lookup
  - MinIO integration

- **Knowledge graph services**
  - extraction pipeline
  - graph write/update
  - graph query
  - graph visualization payloads

- **Agent services**
  - line-level, module-level, and unit-level coordination
  - task decomposition
  - message passing
  - execution trace logging

- **Scene services**
  - device state synchronization
  - WebSocket broadcasting
  - 3D node updates
  - reconstruction events

## Data Ownership Rules
- PostgreSQL:
  - structured task data
  - metadata
  - logs
  - experiment records
  - UI-facing business data
- MinIO:
  - 3D model files
  - uploaded process documents
  - large binary resources
- Neo4j:
  - line/module/unit knowledge graph
  - relations, attributes, hierarchy
- pgvector:
  - embeddings for retrieval, document chunks, and semantic support if needed

## Multi-Agent System Rules
This project is hierarchical by design.

- Keep agent hierarchy explicit:
  - line-level agents
  - module-level agents
  - unit-level agents

- Multi-agent features should support:
  - task decomposition
  - status feedback
  - dialogue visibility
  - execution logs
  - monitoring of collaboration flow

- Do not collapse the architecture into a single generic assistant unless explicitly requested.
- Preserve visibility of agent coordination whenever building monitoring pages or APIs.
- Prefer structured messages and event logs over opaque free-form outputs.

## Knowledge Graph Rules
- The knowledge graph is not optional decoration; it is a core system capability.
- Preserve the three-layer structure: **Line -> Module -> Unit**.
- Graph-related features should support:
  - entity and relation extraction
  - graph update
  - visualization
  - node filtering
  - relation inspection
- Graph payloads returned to the frontend should be simple and visualization-friendly.
- Favor stable schemas over over-flexible ad hoc graph outputs.

## 3D Scene Rules
- The 3D scene is a core product surface.
- Prefer real-time synchronization through WebSocket where applicable.
- Scene updates should be driven by structured backend state, not by frontend-only guesses.
- When layout reconstruction is involved, keep scene node updates explicit and traceable.
- Use clear mappings between device identifiers, graph nodes, and scene objects.
- Prioritize stable rendering, understandable state transitions, and screenshot-friendly composition.

## AI Provider Rules
- Chat model calls must go through OpenRouter (`OPENROUTER_API_KEY`).
- Embedding and reranking must go through DashScope (`DASHSCOPE_API_KEY`).
- Do not mix providers for the wrong task.

## Code Style
- Prioritize readability and maintainability.
- Prefer practical implementation over over-engineering.
- Comments and docstrings must be English only and only when necessary.
- Favor small modules, typed interfaces, and explicit naming.
- Keep code easy for future thesis maintenance and demo preparation.

## UX / Visual Style
- Industrial, professional, stable.
- Minimize visual noise.
- Prefer dark or neutral layouts suitable for digital twin interfaces.
- Charts should emphasize comparison, monitoring, and state trends.
- Panels should clearly expose:
  - current task
  - graph state
  - agent state
  - scene state
  - logs
- Do not design the platform like a consumer chat product.

## Validation
- No stable full test suite yet.
- Always run targeted manual checks related to changed features.
- If frontend changes affect typing or lint behavior, run relevant checks before finishing.
- For real-time features, manually verify:
  - REST request success
  - WebSocket event delivery
  - frontend state updates
  - scene synchronization
- For graph features, manually verify:
  - Neo4j write success
  - payload correctness
  - frontend graph rendering
- For upload features, manually verify:
  - PostgreSQL metadata
  - MinIO object storage
  - retrieval in UI

## Testing Instructions
- Backend:
  - run the changed API path manually
  - verify logs and returned payloads
- Frontend:
  - verify routing, panel rendering, and typed API usage
  - verify no obvious console errors
- Infra:
  - confirm Docker services are up before debugging feature failures
- If adding a reusable utility or service, add lightweight validation where practical.
- Do not invent a fake comprehensive test suite if one does not exist.

## Implementation Priorities for Agents
When unsure what to build first, prefer:
1. work order and asset flow
2. graph construction and graph view
3. agent monitoring and logs
4. 3D scene synchronization
5. experiment visualization and comparison panels

## Non-Goals
Unless explicitly requested, do not:
- introduce heavy abstractions
- redesign the whole architecture
- replace the current stack
- add unnecessary AI orchestration frameworks
- overbuild permissions/auth systems
- overcomplicate the rendering engine

## Optional Nested AGENTS.md
- For subprojects, you may add nested `AGENTS.md` files.
- The nearest `AGENTS.md` to edited files should take precedence.
