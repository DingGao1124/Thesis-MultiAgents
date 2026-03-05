"""ModelRAGAgent status note.

Current: semantic similarity retrieval via `similarity_search_models`.
TODO: upgrade to hybrid retrieval (keyword + vector fusion) in a later iteration.
```python
Hybrid Retrieval Score = coalesce(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight + coalesce(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight
```
"""

import os
import re
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError

from services.storage_service import MinIOClient
from utils.Embedding import EmbeddingAndReranking


@dataclass
class ModelSearchResult:
    """Search result item for one 3D model candidate."""

    model_id: str
    model_name: str
    description: str
    minio_bucket: str
    minio_object_key: str
    vector_distance: float
    rerank_score: Optional[float] = None


class ModelRAGAgent:
    """3D model retrieval agent based on Postgres(pgvector) + MinIO.

    Workflow:
    1. Embed the query text with DashScope embedding model.
    2. Retrieve top-K candidates by calling a Postgres search function.
    3. Rerank candidates with DashScope reranker.
    4. Fetch the best-match model resource from MinIO.

    Database setup policy:
    - This class does NOT create or migrate database schema.
    - Please create table/index/function in Postgres manually.
    - Required retrieval function name (current): similarity_search_models.
    """

    _IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

    @staticmethod
    def _require_env(name: str) -> str:
        value = os.getenv(name)
        if not value:
            raise ValueError(f"Environment variable is required: {name}")
        return value

    def __init__(
        self,
        table_name: str = "model_assets",
        model_id_column: str = "model_id",
        model_name_column: str = "model_name",
        description_column: str = "description",
        embedding_column: str = "embedding",
        minio_bucket_column: str = "minio_bucket",
        minio_object_key_column: str = "minio_object_key",
    ) -> None:
        load_dotenv(override=True)

        self.table_name = self._validate_identifier(table_name)
        self.model_id_column = self._validate_identifier(model_id_column)
        self.model_name_column = self._validate_identifier(model_name_column)
        self.description_column = self._validate_identifier(description_column)
        self.embedding_column = self._validate_identifier(embedding_column)
        self.minio_bucket_column = self._validate_identifier(minio_bucket_column)
        self.minio_object_key_column = self._validate_identifier(
            minio_object_key_column
        )

        self.engine = self._create_postgres_engine()
        self.embedding_and_reranking = EmbeddingAndReranking()
        self.minio_client = MinIOClient(
            endpoint=os.getenv("MINIO_ENDPOINT", "localhost:9000"),
            access_key=self._require_env("MINIO_ROOT_USER"),
            secret_key=self._require_env("MINIO_ROOT_PASSWORD"),
            secure=os.getenv("MINIO_SECURE", "false").lower() == "true",
        )

    @staticmethod
    def _validate_identifier(identifier: str) -> str:
        if not ModelRAGAgent._IDENTIFIER_PATTERN.match(identifier):
            raise ValueError(f"Invalid SQL identifier: {identifier}")
        return identifier

    @staticmethod
    def _vector_literal(values: List[float]) -> str:
        # pgvector accepts input like: [0.1,0.2,0.3]
        return "[" + ",".join(str(v) for v in values) + "]"

    def _create_postgres_engine(self) -> Engine:
        database_url = os.getenv("POSTGRES_DATABASE_URL")
        if not database_url:
            user = os.getenv("POSTGRES_USER", "postgres")
            password = self._require_env("POSTGRES_PASSWORD")
            host = os.getenv("POSTGRES_HOST", "localhost")
            port = os.getenv("POSTGRES_PORT", "5433")
            database = os.getenv("POSTGRES_DB", "vectordb")
            database_url = (
                f"postgresql+psycopg://{user}:{password}@{host}:{port}/{database}"
            )

        return create_engine(database_url, pool_pre_ping=True)

    def init_schema(self, embedding_dimensions: int = 1024) -> None:
        """Schema creation is intentionally disabled in code.

        Build the database objects manually. Suggested SQL:

        CREATE EXTENSION IF NOT EXISTS pgcrypto;
        CREATE EXTENSION IF NOT EXISTS vector;

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

        CREATE INDEX IF NOT EXISTS idx_model_assets_embedding_hnsw
        ON model_assets
        USING hnsw (embedding vector_cosine_ops);

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
        """
        print("! init_schema is documentation-only. Please apply SQL manually in Postgres.")

    def upsert_model_metadata(
        self,
        model_name: str,
        description: str,
        minio_bucket: str,
        minio_object_key: str,
        model_id: Optional[str] = None,
    ) -> str:
        """Embed description and upsert one model metadata record into Postgres."""
        embedding = self.embedding_and_reranking.embed_for_text(description)
        vector_value = self._vector_literal(embedding)

        sql = text(
            f"""
      INSERT INTO {self.table_name}
        ({self.model_id_column}, {self.model_name_column}, {self.description_column}, {self.minio_bucket_column}, {self.minio_object_key_column}, {self.embedding_column})
      VALUES
        (COALESCE(CAST(:model_id AS uuid), gen_random_uuid()), :model_name, :description, :bucket, :object_key, CAST(:embedding AS vector))
      ON CONFLICT ({self.model_name_column}) DO UPDATE
      SET
        {self.description_column} = EXCLUDED.{self.description_column},
        {self.minio_bucket_column} = EXCLUDED.{self.minio_bucket_column},
        {self.minio_object_key_column} = EXCLUDED.{self.minio_object_key_column},
        {self.embedding_column} = EXCLUDED.{self.embedding_column},
        updated_at = NOW()
      RETURNING {self.model_id_column}::text AS model_id;
      """
        )

        try:
            with self.engine.begin() as conn:
                row = conn.execute(
                    sql,
                    {
                        "model_id": model_id,
                        "model_name": model_name,
                        "description": description,
                        "bucket": minio_bucket,
                        "object_key": minio_object_key,
                        "embedding": vector_value,
                    },
                ).mappings().first()

            saved_model_id = str(row["model_id"]) if row and row.get("model_id") else ""
            print(f"✓ Upserted model metadata: name={model_name}, id={saved_model_id}")
            return saved_model_id
        except SQLAlchemyError as exc:
            print(f"✗ Failed to upsert model metadata: {exc}")
            raise

    def search_candidates(self, query: str, top_k: int = 8) -> List[ModelSearchResult]:
        """Call DB function similarity_search_models and return top-K candidates."""
        query_embedding = self.embedding_and_reranking.embed_for_text(query)
        query_vector = self._vector_literal(query_embedding)

        try:
            with self.engine.raw_connection() as raw_conn:
                with raw_conn.cursor() as cursor:
                    cursor.callproc("similarity_search_models", [query_vector, top_k])
                    records = cursor.fetchall()
                    columns = [desc[0] for desc in cursor.description] if cursor.description else []

                rows = [dict(zip(columns, record)) for record in records]
                results = [
                    ModelSearchResult(
                        model_id=str(row["model_id"]),
                        model_name=str(row["model_name"]),
                        description=str(row["description"]),
                        minio_bucket=str(row["minio_bucket"]),
                        minio_object_key=str(row["minio_object_key"]),
                        vector_distance=float(row["cosine_distance"]),
                    )
                    for row in rows
                ]
            print(f"✓ Retrieved {len(results)} candidates from Postgres")
            return results
        except SQLAlchemyError as exc:
            print(f"✗ Failed to search candidates: {exc}")
            raise

    def rerank_candidates(
        self, query: str, candidates: List[ModelSearchResult]
    ) -> List[ModelSearchResult]:
        """Rerank candidate models using DashScope reranker."""
        if not candidates:
            return []

        documents = [candidate.description for candidate in candidates]
        rerank_data = self.embedding_and_reranking.rerank_documents(
            query=query,
            documents=documents,
            top_n=len(documents),
            instruct="Retrieve semantically similar text.",
            return_documents=True,
        )
        rerank_results = rerank_data.get("results", [])

        ranked: List[ModelSearchResult] = []
        for item in rerank_results:
            index = item.get("index")
            if index is None or not isinstance(index, int):
                continue
            if index < 0 or index >= len(candidates):
                continue

            score = item.get("relevance_score")
            candidate = candidates[index]
            candidate.rerank_score = float(score) if score is not None else None
            ranked.append(candidate)

        # Fallback to vector ranking when reranker returns unexpected format.
        if not ranked:
            print("! Reranker returned no usable result, fallback to vector ranking")
            ranked = candidates

        return ranked

    def retrieve_best_model(
        self, query: str, top_k: int = 8
    ) -> Optional[ModelSearchResult]:
        """Retrieve the best matching 3D model metadata for the query."""
        candidates = self.search_candidates(query=query, top_k=top_k)
        if not candidates:
            print("! No model candidate found in Postgres")
            return None

        reranked = self.rerank_candidates(query=query, candidates=candidates)
        best = reranked[0]
        print(
            f"✓ Best model selected: {best.model_id} "
            f"(distance={best.vector_distance:.6f}, rerank_score={best.rerank_score})"
        )
        return best

    def fetch_model_resource(
        self,
        result: ModelSearchResult,
        download_dir: Optional[str] = None,
        use_presigned_url: bool = True,
        presigned_hours: int = 1,
    ) -> Dict[str, Any]:
        """Fetch model resource from MinIO.

        If download_dir is provided, the model will be downloaded to local disk.
        If use_presigned_url is True, a temporary GET URL is generated.
        """
        payload: Dict[str, Any] = {
            "model_id": result.model_id,
            "model_name": result.model_name,
            "bucket": result.minio_bucket,
            "object_key": result.minio_object_key,
            "description": result.description,
            "vector_distance": result.vector_distance,
            "rerank_score": result.rerank_score,
            "local_path": None,
            "presigned_url": None,
            "bytes": None,
        }

        if download_dir:
            output_dir = Path(download_dir)
            output_dir.mkdir(parents=True, exist_ok=True)
            target_path = output_dir / Path(result.minio_object_key).name
            success = self.minio_client.download_file(
                result.minio_bucket,
                result.minio_object_key,
                str(target_path),
            )
            if success:
                payload["local_path"] = str(target_path)

        model_bytes = self.minio_client.download_data(
            result.minio_bucket,
            result.minio_object_key,
        )
        if model_bytes is not None:
            payload["bytes"] = model_bytes

        if use_presigned_url:
            payload["presigned_url"] = self.minio_client.get_presigned_url(
                result.minio_bucket,
                result.minio_object_key,
                expires=timedelta(hours=presigned_hours),
            )

        return payload

    def query_and_fetch(
        self,
        query: str,
        top_k: int = 8,
        download_dir: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """End-to-end pipeline: search + rerank + fetch from MinIO."""
        best = self.retrieve_best_model(query=query, top_k=top_k)
        if not best:
            return None
        return self.fetch_model_resource(result=best, download_dir=download_dir)


if __name__ == "__main__":
    load_dotenv(override=True)

    agent = ModelRAGAgent(
        table_name=os.getenv("MODEL_TABLE_NAME", "model_assets"),
    )

    # Database schema/function should be created manually by SQL migration.

    query_text = "查找一个适用于装配工位、支持机械臂抓取的三维模型"
    result = agent.query_and_fetch(
        query=query_text,
        top_k=10,
        download_dir=os.getenv("MODEL_DOWNLOAD_DIR"),
    )

    if result is None:
        print("! No model found")
    else:
        print("\n=== Query Result ===")
        print(f"Model ID: {result['model_id']}")
        print(f"Bucket/Object: {result['bucket']}/{result['object_key']}")
        print(f"Distance: {result['vector_distance']}")
        print(f"Rerank Score: {result['rerank_score']}")
        print(f"Local Path: {result['local_path']}")
        print(f"Presigned URL: {result['presigned_url']}")
        print(f"Downloaded Bytes: {len(result['bytes']) if result['bytes'] else 0}")
