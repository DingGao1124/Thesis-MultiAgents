# Multi-Agent Thesis Project - AI Coding Instructions

## Project Architecture

This is a **hybrid multi-agent system** combining:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4 (in `Thesis-MultiAgents/`)
- **Backend**: Python-based services (root level `main.py` - currently empty/placeholder)
- **Infrastructure**: Docker Compose orchestrating MinIO (object storage), pgvector (vector DB), and Redis (semantic cache)

The frontend and backend are **separate but connected** - frontend handles UI interactions while Python services manage data processing, vector operations, and agent logic.

## Key Technologies & Patterns

### Frontend (React + Vite)
- **React Compiler enabled**: Uses `babel-plugin-react-compiler` in Vite config - write standard React, compiler optimizes automatically
- **Tailwind CSS 4**: Uses new Vite plugin (`@tailwindcss/vite`), not PostCSS config
- **TypeScript strict mode**: All `.tsx`/`.ts` files use strict type checking
- **Dev workflow**: `pnpm dev` (port 5173), `pnpm build` compiles TypeScript first, then Vite build

### Backend Infrastructure
- **Docker services** (run `docker-compose up -d`):
  - MinIO: ports 9000 (API), 9001 (console) - credentials: `minioadmin/minioadmin`
  - pgvector (Postgres 17): port 5432 - credentials: `postgres/postgres`, DB: `vectordb`
  - Redis: port 6379 - AOF persistence enabled for semantic caching
- **Python utilities**: `libs/` contains service clients (e.g., `minio_client.py` for object storage CRUD)

## Development Workflows

### Starting the Environment
```bash
# Start infrastructure
docker-compose up -d

# Start frontend (in Thesis-MultiAgents/)
cd Thesis-MultiAgents
pnpm install  # First time only
pnpm dev      # Dev server with HMR
```

### Python Service Development
- Python scripts go in `libs/` for reusable utilities or root level for main services
- Use `MinIOClient` class from `libs/minio_client.py` for object storage operations
- Connect to pgvector using standard psycopg2/SQLAlchemy with vector extension
- Redis semantic cache: store embeddings/query results with TTL for LLM response optimization

### Frontend Development
- Components in `Thesis-MultiAgents/src/` - currently basic React template
- Styling: Use Tailwind utility classes (v4 syntax)
- Type safety: Always define interfaces/types for props and state
- HMR active: Changes auto-reload without full page refresh

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

### Frontend ↔ Backend
- **Not yet connected**: Frontend currently standalone, backend Python services need REST/WebSocket API layer
- **Expected pattern**: Frontend calls Python API → Python orchestrates agents → Results stored in MinIO/pgvector/Redis

### Data Flow (Multi-Agent Context)
1. User input → Frontend
2. Frontend → Python agent orchestrator (to be implemented in `main.py`)
3. Agents use:
   - **MinIO**: Store documents, artifacts, intermediate results
   - **pgvector**: Store/query embeddings for RAG/semantic search
   - **Redis**: Cache LLM responses, agent state, semantic query results
4. Results → Frontend display

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

### Testing Docker Services
```bash
# Check all services healthy
docker-compose ps

# View logs
docker-compose logs -f minio
docker-compose logs -f pgvector
docker-compose logs -f redis

# MinIO console: http://localhost:9001
# pgvector: psql -h localhost -U postgres -d vectordb
# Redis: redis-cli -h localhost
```

## Project-Specific Notes

- **Thesis context**: This is a research project on multi-agent systems - prioritize flexibility and experimentation over production patterns
- **All comments in English**: ALL code comments, docstrings, and documentation must be written in English - no Chinese characters allowed
- **Empty main.py**: Main orchestration logic not yet implemented - this is the primary development target
- **No backend API yet**: Frontend-backend integration pending - consider FastAPI/Flask for REST endpoints
- **Vector operations**: pgvector is for semantic search/RAG - expect to store embeddings from OpenAI/local models
- **Semantic cache strategy**: Redis will cache expensive LLM calls - implement cache key based on query embeddings similarity

## Questions for Developer Clarification

1. **Agent framework**: Will you use LangChain, CrewAI, AutoGen, or custom orchestration?
2. **LLM provider**: OpenAI, Azure OpenAI, local models (Ollama), or mixed?
3. **Frontend-backend communication**: REST API, WebSockets, or GraphQL?
4. **Authentication**: Needed for frontend/services, or development-only setup?
