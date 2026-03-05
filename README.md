# Multi-Agent System(LLM-Based) for Dynamic Production Line Construction

**A Dynamic Modeling Method for Digital Twin of Flexible Production Lines Based on Large Language Model-driven Multi-Agent Systems.**

## Overview

Dynamic Multi-Agent System(LLM-Based) for Production Line Construction is an intelligent manufacturing system that leverages LLM-driven multi-agent collaboration to enable dynamic modeling and real-time optimization of flexible production lines through digital twin technology.

### Key Features

- 🤖 **Multi-Agent Orchestration**: LLM-powered agents for production line modeling, monitoring, and optimization
- 🏭 **Flexible Production Line Modeling**: Dynamic digital twin representation of complex manufacturing processes
- 🧠 **Large Language Model Integration**: Natural language-driven system configuration and decision-making
- 📊 **Real-time Monitoring**: Live synchronization between physical and digital production environments
- 🔧 **Adaptive Reconfiguration**: Intelligent response to production changes and disturbances

## Project Structure

```
Multi-Agent System(LLM-Based) for Dynamic Production Line Construction/
├── main.py                      # Python backend entry point
├── libs/                        # Python utility modules
│   └── minio_client.py         # Object storage client
├── docker-compose.yaml          # Infrastructure orchestration
└── Thesis-MultiAgents/          # React frontend application
    └── src/                     # UI components and assets
```

## Technology Stack

### Frontend
- **React 19** + TypeScript
- **Vite** build tooling with HMR
- **Tailwind CSS 4** for styling
- React Compiler for automatic optimization

### Backend
- **Python** for agent orchestration and data processing
- **MinIO** for object storage (documents, artifacts)
- **pgvector** (PostgreSQL) for vector embeddings and semantic search
- **Redis** for semantic caching and agent state management

### Multi-Agent Framework
- LLM-driven agent communication
- Dynamic task allocation and coordination
- Knowledge sharing through vector database

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Python 3.10+
- Docker and Docker Compose

### Installation

1. **Start infrastructure services**:
   ```bash
   docker-compose up -d
   ```

2. **Start frontend development server**:
   ```bash
   cd Thesis-MultiAgents
   pnpm install
   pnpm dev
   ```

3. **Access services**:
   - Frontend: http://localhost:5173
   - MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
   - pgvector: localhost:5432 (postgres/postgres)
   - Redis: localhost:6379

## Research Context

This project supports the research paper:

**"A Dynamic Modeling Method for Digital Twin of Flexible Production Lines Based on Large Language Model-driven Multi-Agent Systems"**

The system explores how LLM-driven multi-agent architectures can enhance the flexibility, intelligence, and adaptability of digital twin systems in modern manufacturing environments.

## Development Status

🚧 **Active Development** - This is a research prototype under active development.

### Frontend
- [x] React 19 + Vite + Tailwind framework setup
- [ ] UR5 robot visualization page polish
   - [ ] Replace current static grasper with dynamic one
   - [ ] Add Physics for Robot Grasp
   - [ ] Add animation for Robot Grasp
- [ ] Knowledge graph UI enhancements

### Backend
- [x] Infrastructure setup (MinIO, pgvector, Redis)
- [ ] Agent orchestration core (main.py)
- [ ] REST API service layer (FastAPI/Flask)
- [ ] Multi-agent coordination logic
- [ ] Vector DB + knowledge graph integration

## ModelRAGAgent Database Setup

`modules/Agents/ModelRAGAgent.py` does not create or migrate schema in code.
Please run the SQL below manually in PostgreSQL.

### Upsert behavior (`upsert_model_metadata`)

- Insert when `model_name` does not exist.
- Update when `model_name` already exists.
- Conflict key is `model_name` (must be `UNIQUE`).
- On update, `description`, `minio_bucket`, `minio_object_key`, and `embedding` are refreshed.
- For new rows, `model_id` uses provided UUID if passed, otherwise auto-generated.

### SQL Steps

```sql
-- 1) Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2) Create table
CREATE TABLE IF NOT EXISTS model_assets (
   model_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
   model_name TEXT NOT NULL UNIQUE,
   description TEXT NOT NULL,
   minio_bucket TEXT NOT NULL,
   minio_object_key TEXT NOT NULL,
   embedding VECTOR(1024) NOT NULL,
   created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
   updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE model_assets
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE model_assets
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 3) Create HNSW index (cosine distance)
CREATE INDEX IF NOT EXISTS idx_model_assets_embedding_hnsw
ON model_assets
USING hnsw (embedding vector_cosine_ops);

-- 4) Create similarity function called by Python
CREATE OR REPLACE FUNCTION similarity_search_models(
   query_embedding vector(1024),
   match_count INT DEFAULT 10
)
RETURNS TABLE (
   model_id UUID,
   model_name TEXT,
   description TEXT,
   minio_bucket TEXT,
   minio_object_key TEXT,
   cosine_distance DOUBLE PRECISION,
   similarity_score DOUBLE PRECISION
)
LANGUAGE SQL
AS $$
   SELECT
      ma.model_id,
      ma.model_name,
      ma.description,
      ma.minio_bucket,
      ma.minio_object_key,
      (ma.embedding <=> query_embedding) AS cosine_distance,
      GREATEST(0, 1 - (ma.embedding <=> query_embedding)) AS similarity_score
   FROM model_assets AS ma
   ORDER BY ma.embedding <=> query_embedding
   LIMIT LEAST(match_count, 100);
$$;

-- 5) Quick verification
SELECT *
FROM similarity_search_models('[0.1,0.2,0.3]'::vector(1024), 5);
```

### Python integration contract

- `search_candidates` calls `similarity_search_models`.
- Keep function name, parameter order, and return column names consistent with the SQL above.

## License

This project is developed for academic research purposes.
