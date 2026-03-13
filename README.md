# Multi-Agent System for Dynamic Production Line Construction

Large Language Model-driven Multi-Agent System for dynamic modeling of flexible production line digital twins.

## Overview

This project supports the thesis **"A Dynamic Modeling Method for Digital Twin of Flexible Production Lines Based on Large Language Model-driven Multi-Agent Systems"**.

To address the weak real-time responsiveness and poor autonomous evolution of conventional digital twins in highly dynamic production lines, the project builds an LLM-MAS framework around three linked dimensions:

- **Knowledge**: construct and evolve a production-line knowledge graph from heterogeneous data.
- **Behavior**: generate and reconstruct task-oriented behavior logic through agent collaboration.
- **Geometry**: drive spatial and parametric reconfiguration of the twin model from high-level decisions.

In the thesis experiments, the framework is used for defect monitoring and sorting scenarios, with the goal of reducing changeover time, recovery time, and false positives under dynamic disturbances.

## Thesis Mapping

- **Chapter 2**: production-line knowledge graph construction, dynamic knowledge extraction, and semantic retrieval.
- **Chapter 3**: embodied production agents, multimodal perception, task inference, execution, and state mapping.
- **Chapter 4**: hierarchical multi-agent coordination and decision-driven digital twin reconstruction.
- **Chapter 5**: interactive twin platform, single-task and multi-task experiments, and system evaluation.

## Repository Structure

```text
main.py                    # FastAPI backend entry
docker-compose.yaml        # MinIO, pgvector/PostgreSQL, Neo4j
modules/Agents/            # LLM agent prototypes and task logic
modules/RAG/               # Retrieval and graph-RAG experiments
services/                  # Parser, OCR, and storage service wrappers
config/seed.sql            # Manual PostgreSQL initialization script
Thesis-MultiAgents/        # React + TypeScript frontend
```

## Tech Stack

- **Backend**: Python, FastAPI, LangChain ecosystem
- **Frontend**: React 19, TypeScript, Vite
- **Data layer**: PostgreSQL with pgvector, Neo4j, MinIO
- **LLM workflow**: LLM-based multi-agent coordination, knowledge retrieval, and twin reconstruction

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js and `pnpm`
- Docker and Docker Compose

### Run Infrastructure

```bash
docker-compose up -d
```

Default local services:

- Frontend: `http://localhost:5173`
- Backend health: `http://127.0.0.1:8000/health`
- MinIO Console: `http://localhost:9001`
- PostgreSQL (pgvector): `localhost:5433`
- Neo4j: `http://localhost:7474`

### Run Backend

```bash
python main.py
```

### Run Frontend

```bash
cd Thesis-MultiAgents
pnpm install
pnpm dev
```

## Database Initialization

If you need to initialize the PostgreSQL objects used by `modules/Agents/ModelRAGAgent.py`, run `config/seed.sql` manually in the target database.

The script creates the `model_assets` table, the HNSW vector index, and the `similarity_search_models` function used by `search_candidates`.

## Status

This repository is an academic research prototype under active development, focused on knowledge graph evolution, embodied agents, and dynamic reconstruction of flexible production-line digital twins.

## License

This project is intended for academic research use.
