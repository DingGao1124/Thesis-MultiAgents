# Multi-Agent Thesis Project - AI Coding Instructions

## Big Picture
- Hybrid stack: Python backend + React frontend + Dockerized data services.
- Backend entry is `main.py` (FastAPI with CORS + `/health`, uvicorn on `127.0.0.1:8000`).
- Frontend lives in `Thesis-MultiAgents/` and calls backend via Vite proxy `/api -> http://localhost:8000` (`vite.config.ts`).
- Core services from `docker-compose.yaml`: MinIO (object storage), pgvector/Postgres (vector search), Neo4j (graph); Redis is currently commented out.
- Agent/RAG experiments are under `modules/Agents/` and `modules/RAG/` (e.g., `GraphRAGAgent.py` uses `Neo4jVector` + `OpenAIEmbeddings`).

## Critical Workflows
- Infra: run `docker-compose up -d` from repo root, then `docker-compose ps` and `docker-compose logs -f <service>`.
- Backend dev: run `python main.py` (or `uvicorn main:app --reload --host 127.0.0.1 --port 8000`).
- Frontend dev: `cd Thesis-MultiAgents && pnpm install && pnpm dev`.
- Frontend build/lint: `pnpm build`, `pnpm lint` (see `Thesis-MultiAgents/package.json`).
- There is no discoverable automated test suite yet; validate changes via targeted manual runs.

## Project-Specific Coding Patterns
- Python service clients are class-based in `lib/` (example: `lib/storage_service.py` / `MinIOClient`).
- Keep Python type hints explicit (`Optional`, `List`, etc.) and use try/except around external service calls.
- Existing backend utilities use status print markers: `✓` success, `✗` error, `!` warning.
- English-only rule is strict: comments/docstrings/docs must be in English.
- Frontend uses functional React components only; root render is wrapped in `<StrictMode>` (`src/main.tsx`).
- React Compiler is enabled (`babel-plugin-react-compiler`), so avoid adding manual memoization by default.

## Integration Points to Respect
- Frontend API wrapper is `Thesis-MultiAgents/src/api/config/client.ts` (Axios `baseURL: '/api'`).
- Current API surface in `Thesis-MultiAgents/src/api/index.ts` is minimal; extend typed contracts there when adding endpoints.
- Router structure is in `Thesis-MultiAgents/src/App.tsx` (`/`, `/robotics`, `/kgraph`, `/test`).
- 3D stack patterns are shown in `src/pages/RobotAnimation.tsx` (`@react-three/fiber`, drei, Leva, UR5 model component).
- Knowledge graph UI pattern is shown in `src/pages/KnowledgeGraph.tsx` (`react-force-graph-2d` + custom canvas renderers).

## LLM / Embedding Gateway
- **Chat model calls route through OpenRouter**: `base_url="https://openrouter.ai/api/v1"` with `OPENROUTER_API_KEY`.
- **Embedding and reranking calls route through Alibaba DashScope**: `base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"` with `DASHSCOPE_API_KEY`.
- Use `langchain_openrouter.ChatOpenRouter` for chat models.
- Use `langchain_openai.OpenAIEmbeddings` configured with the DashScope compatible endpoint for embeddings.
- Keep provider separation strict: do not route embeddings/rerank requests through OpenRouter in new code.

## Environment Variables
All secrets come from `.env` loaded via `load_dotenv(override=True)`. Required variables:
- `OPENROUTER_API_KEY` — chat model calls
- `DASHSCOPE_API_KEY` — embedding + reranking calls
- `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD` — graph DB (default bolt: `bolt://localhost:7687`)
- `MINERU_API_KEY` — document parsing via `lib/parser_service.py` (MinerU cloud API)
- `FRONTEND_ORIGIN` — CORS allowed origin in `main.py` (default `http://localhost:5173`)

## Agent / Module Dev & Testing
- Each file under `modules/Agents/` is runnable standalone: `python modules/Agents/GraphRAGAgent.py` (all have `if __name__ == "__main__":` + `load_dotenv(override=True)`).
- Document parsing (`lib/parser_service.py`) calls the MinerU cloud API; URDF/3D assets live in `Thesis-MultiAgents/public/models/ur5/`.
- `lib/ocr_service.py` is a stub; `modules/Agents/RAGAgent.py` is empty — these are active development targets.

## Security and Secrets
- Plaintext passwords are forbidden everywhere (code, docs, configs, logs, examples, commits).
- Use environment variables or secret managers; if touching legacy local-dev defaults, migrate toward `.env`-based config instead of adding new hardcoded secrets.
