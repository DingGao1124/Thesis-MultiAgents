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

## License

This project is developed for academic research purposes.
