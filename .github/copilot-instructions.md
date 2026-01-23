# Multi-Agent Thesis Project - AI Coding Instructions

## Project Overview

**LLM-Based Multi-Agent System for Dynamic Production Line Construction** - A research project combining digital twin technology with LLM-driven multi-agent collaboration for flexible manufacturing systems.

## Architecture

This is a **hybrid multi-agent system** with three layers:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4 (in `Thesis-MultiAgents/`)
- **Backend**: Python-based agent orchestration (root `main.py` - pending implementation)
- **Infrastructure**: Docker Compose with MinIO (object storage), pgvector (vector DB), Neo4j (knowledge graph), Redis (semantic cache - currently disabled)

**Data flows**: User input → React UI → Python agents (via Vite proxy `/api` → `localhost:8000`) → Services (MinIO/pgvector/Neo4j) → Frontend visualization

## Key Technologies & Patterns

### Frontend Stack (React 19 + Vite)
- **React Compiler**: `babel-plugin-react-compiler` enabled - no manual memoization needed (React.memo/useMemo/useCallback auto-optimized)
- **Tailwind CSS 4**: Uses `@tailwindcss/vite` plugin (NOT PostCSS) - check [tailwind.config.ts] for v4 syntax changes
- **TypeScript strict mode**: Enforced across all `.tsx`/`.ts` files
- **3D/Animation libraries**:
  - `@react-three/fiber` + `@react-three/drei`: Three.js integration (see [MainPage.tsx](Thesis-MultiAgents/src/pages/MainPage.tsx))
  - `gsap` + `@gsap/react`: Animation timelines (registered with `gsap.registerPlugin(useGSAP)`)
  - `urdf-loader`: Robot arm URDF model loading (public models in `Thesis-MultiAgents/public/models/ur5/`)
- **Knowledge graph**: `react-force-graph-2d` for Neo4j visualizations (see [KnowledgeGraph.tsx](Thesis-MultiAgents/src/pages/KnowledgeGraph.tsx))
- **State management**: Zustand (stores/ currently empty - add stores as needed)
- **Routing**: React Router 7 with `createBrowserRouter` + JSX route syntax

### Backend Infrastructure (Docker Compose)
Critical credentials (UPDATE IN PRODUCTION):
- **MinIO**: 9000 (API), 9001 (console) - `admin:12345678` (NOT `minioadmin`)
- **pgvector**: 5432 - `postgres:12345678` DB: `vectordb`
- **Neo4j**: 7474 (HTTP), 7687 (Bolt) - `neo4j:12345678` with persistent volumes at `./neo4j/data`
- **Redis**: DISABLED in docker-compose (commented out) - re-enable if needed for semantic caching

### Python Patterns (`libs/`)
- **Class-based service clients**: Pattern from `MinIOClient` (425 lines) - full CRUD with type hints
- **Status symbols**: `✓` success, `✗` error, `!` warnings in print statements
- **Error handling**: Try/except with `S3Error` or service-specific exceptions
- **Type safety**: Use `typing.Optional`, `List`, `BinaryIO` etc.
- **English-only**: ALL comments/docstrings must be in English (research thesis requirement)

## Development Workflows

### Starting the Full Stack
```bash
# 1. Start infrastructure (from root)
docker-compose up -d

# 2. Verify services healthy
docker-compose ps  # All should show "Up (healthy)"

# 3. Start frontend (from Thesis-MultiAgents/)
cd Thesis-MultiAgents
pnpm install  # First time only
pnpm dev      # Vite dev server on http://localhost:5173
```

### Python Service Development
- **Utilities location**: `libs/` for reusable clients (e.g., `minio_client.py`)
- **Main service**: `main.py` (root) - currently empty, needs agent orchestration logic
- **MinIO operations**: Import `MinIOClient` class - methods: `upload_file()`, `download_file()`, `list_objects()`, `get_presigned_url()`, etc.
- **Vector DB**: pgvector for embeddings - use psycopg2/SQLAlchemy with `vector` extension
- **Neo4j**: Knowledge graph queries via py2neo or neo4j-driver (ports 7474/7687)

### Frontend Development
- **Pages**: `Thesis-MultiAgents/src/pages/` - [MainPage.tsx](Thesis-MultiAgents/src/pages/MainPage.tsx) (3D), [KnowledgeGraph.tsx](Thesis-MultiAgents/src/pages/KnowledgeGraph.tsx) (graph viz), [RobotAnimation.tsx](Thesis-MultiAgents/src/pages/RobotAnimation.tsx) (stub)
- **API client**: [src/api/basic.ts](Thesis-MultiAgents/src/api/basic.ts) - axios instance with `/api` prefix (proxied to `localhost:8000`)
  - Interceptors: Auto-add Bearer token, log requests in DEV mode
  - Typed API methods in [src/api/index.ts](Thesis-MultiAgents/src/api/index.ts): `agentAPI`, `taskAPI`, `userAPI`
- **Styling**: Tailwind v4 classes - NO PostCSS config, uses Vite plugin
- **3D assets**: URDF models go in `public/models/` (current: UR5 robot arm)
- **HMR**: Fast Refresh active - component edits reload instantly

### Debugging Services
```bash
# Check all services
docker-compose ps

# View real-time logs
docker-compose logs -f minio
docker-compose logs -f postgres
docker-compose logs -f neo4j

# Access services directly
# MinIO console: http://localhost:9001 (admin:12345678)
# Neo4j browser: http://localhost:7474 (neo4j:12345678)
# pgvector: psql -h localhost -U postgres -d vectordb (password: 12345678)
```

## Critical Conventions

### File Organization
- `libs/`: **Python utility modules** (clients, helpers, shared logic)
- `Thesis-MultiAgents/src/`: **React components and frontend assets**
- `docker-compose.yaml`: **Single source of truth for infrastructure**
- Root `main.py`: **Entry point for Python backend services** (currently empty - add main logic here)

### Python Code Style (from `minio_client.py`)
- **English comments/docstrings**: All code comments and docstrings must be in English
- **Class-based clients**: Encapsulate external services (MinIO, Redis, pgvector) as classes
- **Error handling**: Use try/except with appropriate error types, print status with ✓/✗/! symbols
- **Type hints**: Use `typing` module for Optional, List, etc.

### React/TypeScript Patterns
- **Functional components only**: No class components (React 19)
- **Strict mode wrapper**: All apps render in `<StrictMode>`
- **ESLint v9**: Flat config format in `eslint.config.js`

## Integration Points

### Frontend ↔ Backend Communication
- **Vite dev proxy**: `/api/*` requests → `http://localhost:8000` (configured in [vite.config.ts](Thesis-MultiAgents/vite.config.ts))
- **Authentication**: Bearer token from localStorage auto-added by axios interceptor
- **Expected backend**: FastAPI/Flask Python server on port 8000 (NOT YET IMPLEMENTED)
- **API structure**: Typed interfaces in [api/index.ts](Thesis-MultiAgents/src/api/index.ts) - `Agent`, `Task`, `User` models ready

### Data Flow (Multi-Agent Context)
1. User input → React UI (`MainPage`, `KnowledgeGraph`)
2. Frontend → Python REST API (via axios `/api` proxy)
3. Python agents orchestrate tasks using:
   - **MinIO**: Store production line documents, robot models, agent artifacts
   - **pgvector**: RAG/semantic search for production documentation
   - **Neo4j**: Knowledge graph of production line entities (machines, workflows, dependencies)
   - **Redis** (disabled): Semantic cache for LLM responses (enable if needed)
4. Results → Frontend visualization (3D scenes, force-directed graphs, ECharts)

## Common Tasks

### Adding a New Python Service Client
```python
# Create in libs/<service>_client.py
class ServiceClient:
    def __init__(self, endpoint, credentials):
        # Initialize connection
        pass
    
    def create(self, ...): 
        """Create resource"""
        try:
            # Implementation
            print("✓ Operation successful")
            return True
        except Exception as e:
            print(f"✗ Operation failed: {e}")
            return False
```

### Adding a New React Component
```tsx
// Thesis-MultiAgents/src/components/ComponentName.tsx
import React from 'react'

interface ComponentProps {
  // Define props
}

export default function ComponentName({ ...props }: ComponentProps) {
  // Implementation with Tailwind classes
  return <div className="flex items-center gap-4">...</div>
}
```

## Project-Specific Notes

- **Thesis context**: This is a research project on multi-agent systems - prioritize flexibility and experimentation over production patterns
- **All comments in English**: ALL code comments, docstrings, and documentation must be written in English - no Chinese characters allowed
- **Empty main.py**: Main orchestration logic not yet implemented - this is the primary development target
- **No backend API yet**: Frontend-backend integration pending - consider FastAPI/Flask for REST endpoints
- **Vector operations**: pgvector is for semantic search/RAG - expect to store embeddings from OpenAI/local models
- **Semantic cache strategy**: Redis will cache expensive LLM calls - implement cache key based on query embeddings similarity
- **Agent framework**: LangChain and LangGraph for agent orchestration - use LangChain chains/tools/memory with LangGraph for complex multi-agent workflows
- **LLM providers**: Mixed approach - support OpenAI, Azure OpenAI, and local models (Ollama) with configurable switching
- **Communication layer**: Mixed patterns - REST API for standard operations, WebSockets for real-time agent updates, consider GraphQL for complex queries
