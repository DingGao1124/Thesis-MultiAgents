"""Traditional document RAG over PostgreSQL (pgvector + full-text search).

This module intentionally does NOT create schema/functions in code.
Please apply SQL manually in PostgreSQL before using this module.
"""

import json
import os
import re
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openrouter import ChatOpenRouter
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError

from utils.Embedding import EmbeddingAndReranking


@dataclass
class ChunkSearchResult:
    """Retrieved document chunk from Postgres search functions."""

    chunk_id: str
    document_id: str
    title: str
    source: str
    chunk_index: int
    content: str
    metadata: Dict[str, Any]
    vector_distance: Optional[float] = None
    similarity_score: Optional[float] = None
    bm25_score: Optional[float] = None
    hybrid_score: Optional[float] = None


class TraditionalDocumentRAG:
    """Traditional document RAG: ingest, retrieve, and answer from documents.

    Required DB objects (manual SQL):
    - table: rag_document_chunks
    - function: similarity_search_doc_chunks
    - function: hybrid_search_doc_chunks
    """

    _IDENTIFIER_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

    @staticmethod
    def _require_env(name: str) -> str:
        value = os.getenv(name)
        if not value:
            raise ValueError(f"Environment variable is required: {name}")
        return value

    @staticmethod
    def _validate_identifier(identifier: str) -> str:
        if not TraditionalDocumentRAG._IDENTIFIER_PATTERN.match(identifier):
            raise ValueError(f"Invalid SQL identifier: {identifier}")
        return identifier

    @staticmethod
    def _vector_literal(values: List[float]) -> str:
        return "[" + ",".join(str(v) for v in values) + "]"

    def __init__(
        self,
        table_name: str = "rag_document_chunks",
        similarity_function_name: str = "similarity_search_doc_chunks",
        hybrid_function_name: str = "hybrid_search_doc_chunks",
        chat_model: str = "openai/gpt-5-nano",
    ) -> None:
        load_dotenv(override=True)

        self.table_name = self._validate_identifier(table_name)
        self.similarity_function_name = self._validate_identifier(
            similarity_function_name
        )
        self.hybrid_function_name = self._validate_identifier(hybrid_function_name)

        self.engine = self._create_postgres_engine()
        self.embedding = EmbeddingAndReranking()
        self.llm = ChatOpenRouter(
            model=chat_model,
            api_key=self._require_env("OPENROUTER_API_KEY"),
            temperature=0,
        )

    def _create_postgres_engine(self) -> Engine:
        database_url = os.getenv("POSTGRES_DATABASE_URL")
        if not database_url:
            user = os.getenv("POSTGRES_USER", "postgres")
            password = self._require_env("POSTGRES_PASSWORD")
            host = os.getenv("POSTGRES_HOST", "localhost")
            port = os.getenv("POSTGRES_PORT", "5433")
            database = os.getenv("POSTGRES_DB", "vectordb")
            database_url = (
                f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{database}"
            )
        return create_engine(database_url, pool_pre_ping=True)

    def split_document(
        self,
        text_content: str,
        chunk_size: int = 800,
        chunk_overlap: int = 150,
    ) -> List[str]:
        """Split raw text into chunks for embedding."""
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", "。", ".", " ", ""],
            length_function=len,
        )
        chunks = [item.strip() for item in splitter.split_text(text_content)]
        return [item for item in chunks if item]

    def _read_text_file(self, file_path: str) -> str:
        """Read local text-like file with UTF-8 fallback behavior."""
        path = Path(file_path)
        if not path.exists() or not path.is_file():
            raise FileNotFoundError(f"File not found: {file_path}")

        try:
            return path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            return path.read_text(encoding="utf-8", errors="ignore")

    def add_document_from_text(
        self,
        title: str,
        content: str,
        source: str = "manual",
        metadata: Optional[Dict[str, Any]] = None,
        document_id: Optional[str] = None,
        chunk_size: int = 800,
        chunk_overlap: int = 150,
    ) -> Dict[str, Any]:
        """Split + embed + upsert one document into Postgres chunk table."""
        if not content.strip():
            raise ValueError("Document content must not be empty")

        doc_id = document_id or str(uuid.uuid4())
        doc_metadata = metadata or {}
        chunks = self.split_document(
            text_content=content,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )
        if not chunks:
            raise ValueError("No chunk produced from input content")

        embeddings = self.embedding.embed_for_texts(chunks)

        upsert_sql = text(
            f"""
			INSERT INTO {self.table_name}
			(
				chunk_id,
				document_id,
				title,
				source,
				chunk_index,
				content,
				metadata,
				embedding
			)
			VALUES
			(
				CAST(:chunk_id AS uuid),
				CAST(:document_id AS uuid),
				:title,
				:source,
				:chunk_index,
				:content,
				CAST(:metadata AS jsonb),
				CAST(:embedding AS vector)
			)
			ON CONFLICT (document_id, chunk_index)
			DO UPDATE SET
				title = EXCLUDED.title,
				source = EXCLUDED.source,
				content = EXCLUDED.content,
				metadata = EXCLUDED.metadata,
				embedding = EXCLUDED.embedding,
				updated_at = NOW();
			"""
        )

        rows: List[Dict[str, Any]] = []
        for idx, (chunk_text, chunk_vector) in enumerate(zip(chunks, embeddings)):
            merged_metadata = {
                **doc_metadata,
                "document_id": doc_id,
                "title": title,
                "source": source,
                "chunk_index": idx,
            }
            rows.append(
                {
                    "chunk_id": str(uuid.uuid4()),
                    "document_id": doc_id,
                    "title": title,
                    "source": source,
                    "chunk_index": idx,
                    "content": chunk_text,
                    "metadata": json.dumps(merged_metadata, ensure_ascii=True),
                    "embedding": self._vector_literal(chunk_vector),
                }
            )

        try:
            with self.engine.begin() as conn:
                conn.execute(upsert_sql, rows)
            print(f"✓ Document saved: doc_id={doc_id}, chunks={len(rows)}")
            return {
                "document_id": doc_id,
                "title": title,
                "source": source,
                "chunk_count": len(rows),
            }
        except SQLAlchemyError as exc:
            print(f"✗ Failed to save document chunks: {exc}")
            raise

    def add_document_from_file(
        self,
        file_path: str,
        title: Optional[str] = None,
        source: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        document_id: Optional[str] = None,
        chunk_size: int = 800,
        chunk_overlap: int = 150,
    ) -> Dict[str, Any]:
        """Load local file content, then split + embed + save into Postgres."""
        path = Path(file_path)
        file_text = self._read_text_file(file_path)
        doc_title = title or path.stem
        doc_source = source or str(path)
        payload_metadata = {
            **(metadata or {}),
            "file_name": path.name,
            "file_path": str(path),
        }
        return self.add_document_from_text(
            title=doc_title,
            content=file_text,
            source=doc_source,
            metadata=payload_metadata,
            document_id=document_id,
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )

    @staticmethod
    def _normalize_search_rows(
        records: List[Any], columns: List[str]
    ) -> List[ChunkSearchResult]:
        items: List[ChunkSearchResult] = []
        for record in records:
            row = dict(zip(columns, record))
            raw_metadata = row.get("metadata")
            parsed_metadata: Dict[str, Any]
            if isinstance(raw_metadata, dict):
                parsed_metadata = raw_metadata
            elif isinstance(raw_metadata, str) and raw_metadata:
                try:
                    parsed_metadata = json.loads(raw_metadata)
                except json.JSONDecodeError:
                    parsed_metadata = {"raw": raw_metadata}
            else:
                parsed_metadata = {}

            items.append(
                ChunkSearchResult(
                    chunk_id=str(row.get("chunk_id", "")),
                    document_id=str(row.get("document_id", "")),
                    title=str(row.get("title", "")),
                    source=str(row.get("source", "")),
                    chunk_index=int(row.get("chunk_index", 0)),
                    content=str(row.get("content", "")),
                    metadata=parsed_metadata,
                    vector_distance=(
                        float(row["cosine_distance"])
                        if row.get("cosine_distance") is not None
                        else None
                    ),
                    similarity_score=(
                        float(row["similarity_score"])
                        if row.get("similarity_score") is not None
                        else None
                    ),
                    bm25_score=(
                        float(row["bm25_score"])
                        if row.get("bm25_score") is not None
                        else None
                    ),
                    hybrid_score=(
                        float(row["hybrid_score"])
                        if row.get("hybrid_score") is not None
                        else None
                    ),
                )
            )
        return items

    def similarity_search(self, query: str, top_k: int = 5) -> List[ChunkSearchResult]:
        """Vector similarity retrieval based on pgvector distance."""
        if not query.strip():
            return []

        query_embedding = self.embedding.embed_for_text(query)
        query_vector = self._vector_literal(query_embedding)

        try:
            raw_conn = self.engine.raw_connection()
            try:
                cursor = raw_conn.cursor()
                try:
                    cursor.callproc(
                        self.similarity_function_name, [query_vector, top_k]
                    )
                    records = cursor.fetchall()
                    columns = (
                        [desc[0] for desc in cursor.description]
                        if cursor.description
                        else []
                    )
                finally:
                    cursor.close()
            finally:
                raw_conn.close()
            return self._normalize_search_rows(records, columns)
        except SQLAlchemyError as exc:
            print(f"✗ Similarity search failed: {exc}")
            raise

    def hybrid_search(
        self,
        query: str,
        top_k: int = 5,
        vector_weight: float = 0.6,
        bm25_weight: float = 0.4,
    ) -> List[ChunkSearchResult]:
        """Hybrid retrieval combining vector similarity and BM25 full-text score.

        hybrid_score = vector_weight * (1 - cosine_distance) + bm25_weight * (bm25_score / max_bm25)
        """
        if not query.strip():
            return []

        query_embedding = self.embedding.embed_for_text(query)
        query_vector = self._vector_literal(query_embedding)

        try:
            raw_conn = self.engine.raw_connection()
            try:
                cursor = raw_conn.cursor()
                try:
                    cursor.callproc(
                        self.hybrid_function_name,
                        [query, query_vector, top_k, vector_weight, bm25_weight],
                    )
                    records = cursor.fetchall()
                    columns = (
                        [desc[0] for desc in cursor.description]
                        if cursor.description
                        else []
                    )
                finally:
                    cursor.close()
            finally:
                raw_conn.close()
            return self._normalize_search_rows(records, columns)
        except SQLAlchemyError as exc:
            print(f"✗ Hybrid search failed: {exc}")
            raise

    @staticmethod
    def _build_context(chunks: List[ChunkSearchResult]) -> str:
        lines: List[str] = []
        for idx, chunk in enumerate(chunks, start=1):
            lines.append(
                f"[{idx}] title={chunk.title} | doc_id={chunk.document_id} | chunk={chunk.chunk_index}\n"
                f"{chunk.content}"
            )
        return "\n\n".join(lines)

    def ask(
        self,
        question: str,
        mode: Literal["similarity", "hybrid"] = "hybrid",
        top_k: int = 6,
        vector_weight: float = 0.6,
        bm25_weight: float = 0.4,
    ) -> Dict[str, Any]:
        """Ask question against indexed documents with selected retrieval mode."""
        if mode == "similarity":
            chunks = self.similarity_search(query=question, top_k=top_k)
        else:
            chunks = self.hybrid_search(
                query=question,
                top_k=top_k,
                vector_weight=vector_weight,
                bm25_weight=bm25_weight,
            )

        if not chunks:
            return {
                "question": question,
                "mode": mode,
                "answer": "I cannot find relevant context in the knowledge base.",
                "sources": [],
            }

        context_text = self._build_context(chunks)
        system_prompt = (
            "You are a document QA assistant. "
            "Answer ONLY using the provided context. "
            "If context is insufficient, say you do not know. "
            "When possible, cite chunk numbers like [1], [2]."
        )
        user_prompt = (
            f"Question:\n{question}\n\n"
            f"Context:\n{context_text}\n\n"
            "Please provide a concise and accurate answer in Chinese."
        )
        response = self.llm.invoke(
            [
                SystemMessage(content=system_prompt),
                HumanMessage(content=user_prompt),
            ]
        )

        return {
            "question": question,
            "mode": mode,
            "answer": str(response.content),
            "sources": [
                {
                    "chunk_id": chunk.chunk_id,
                    "document_id": chunk.document_id,
                    "title": chunk.title,
                    "source": chunk.source,
                    "chunk_index": chunk.chunk_index,
                    "similarity_score": chunk.similarity_score,
                    "bm25_score": chunk.bm25_score,
                    "hybrid_score": chunk.hybrid_score,
                }
                for chunk in chunks
            ],
        }


if __name__ == "__main__":
    load_dotenv(override=True)

    rag = TraditionalDocumentRAG()

    # Example 1: add a local file
    # rag.add_document_from_file(file_path="./1661-0.txt")

    # Example 2: add raw text
    # rag.add_document_from_text(
    #     title="RAG Introduction",
    #     content="RAG combines retrieval and generation for grounded QA.",
    #     source="manual-note",
    # )

    # Example 3: Similarity Search
    result = rag.similarity_search("The Adventures of Sherlock Holmes")
    print(len(result), result[0].similarity_score)

    # Example 4: ask a question
    # result = rag.ask("RAG 是什么？", mode="hybrid", top_k=5)
    # print(result["answer"])
