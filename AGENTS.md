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

## Coding Pattern Guidelines
Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

Tradeoff: these guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding
- Do not assume. Do not hide confusion. Surface tradeoffs.
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them and do not choose silently.
- If a simpler approach exists, say so and push back when warranted.
- If something is unclear, stop, name the ambiguity, and ask.

### 2. Simplicity First
- Write the minimum code that solves the problem. Nothing speculative.
- Do not add features beyond the request.
- Do not introduce abstractions for single-use code.
- Do not add flexibility/configurability that was not requested.
- Do not add error handling for impossible scenarios.
- If 200 lines can be 50, rewrite it simpler.
- Self-check: would a senior engineer call this overcomplicated? If yes, simplify.

### 3. Surgical Changes
- Touch only what is necessary. Clean up only what your change causes.
- Do not improve adjacent code/comments/formatting unless required by the task.
- Do not refactor code that is not broken.
- Match existing style even if you prefer another style.
- If you notice unrelated dead code, mention it; do not delete it.
- Remove imports/variables/functions made unused by your own changes.
- Do not remove pre-existing dead code unless explicitly asked.
- Test for scope: every changed line should map directly to the user request.

### 4. Goal-Driven Execution
- Define success criteria and iterate until verified.
- Turn vague asks into verifiable goals.
- Add validation: write tests for invalid inputs, then make them pass.
- Fix a bug: write a reproducing test, then make it pass.
- Refactor X: ensure tests pass before and after.
- For multi-step tasks, state a brief plan:
  1. [Step] -> verify: [check]
  2. [Step] -> verify: [check]
  3. [Step] -> verify: [check]
- Health signal: fewer unnecessary diffs, fewer overcomplication rewrites, and more clarifying questions before implementation.

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
   - Use LLM-Multi-Agents to construct the production line and display the conversation flow.
   - Receive device pose and process state updates through WebSocket.
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
  - `pnpm lint`
  - `pnpm exec tsc --noEmit`

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
- Keep TypeScript strict-friendly code; avoid `any` unless there is a clear reason.
- Use `shadcn/ui` as default UI component library.
- Use `ECharts` as default chart library.
- Use `GSAP` as default motion library; prefer reusable `useGsap` pattern.
- Use `Three.js` as the baseline renderer for 3D scene features.
- Prefer WebSocket for real-time scene/device status sync when backend events are available.
- Keep UI industrial and professional for thesis screenshots.
- Keep component boundaries small and decoupled.
- Keep frontend API contracts typed and compatible with `src/App.tsx` routing.
- Keep frontend API access through `/api` proxy; do not hardcode backend host in page/component code.

## Frontend src Folder Responsibilities
- `src/pages`: route-level orchestration only. Avoid putting heavy reusable logic directly in page files.
- `src/pages/*/components`: page-scoped feature components. Keep domain boundaries clear per feature.
- `src/components/ui`: reusable primitive UI components (foundation layer).
- `src/components/layout`: cross-page layout and navigation shells.
- `src/components/3D`: reusable 3D rendering/viewer helpers and overlays.
- `src/components/assets`: reusable asset-related display components shared by pages.
- `src/stores`: shared state and domain actions (Zustand). Split stores by domain responsibility.
- `src/api`: typed request/response contracts and transport calls only.
- `src/api/config`: API client configuration, interceptors, and request wrappers.
- `src/hooks`: reusable behavior hooks; avoid burying domain business logic in generic hooks.
- `src/utils`: pure utility functions, parsing, and data transforms.
- `src/types`: shared domain and API-related type definitions.
- `src/lib`: low-level shared helpers (framework/library adapters).
- `src/assets`: static assets only.

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
  - run `cd Thesis-MultiAgents && pnpm lint`
  - run `cd Thesis-MultiAgents && pnpm exec tsc --noEmit`
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
