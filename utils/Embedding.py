from langchain_openai import OpenAIEmbeddings
import os
from typing import Any, Optional

import requests
from tqdm import tqdm


class DashScopeReranker:
    def __init__(
        self,
        api_key: Optional[str],
        model: str = "qwen3-rerank",
    ):
        self.api_key = api_key
        self.model = model
        self.endpoint = "https://dashscope.aliyuncs.com/compatible-api/v1/reranks"
        self.timeout = 30

    def rerank(
        self,
        query: str,
        documents: list[str],
        top_n: Optional[int] = None,
        instruct: Optional[
            str
        ] = "Given a web search query, retrieve relevant passages that answer the query.",
        return_documents: Optional[bool] = True,
    ) -> dict[str, Any]:
        """Rerank candidate documents for a query.

        `instruct` controls ranking behavior:
        - QA retrieval (default):
            "Given a web search query, retrieve relevant passages that answer the query."
            Focuses on whether a document directly answers the query.
        - Semantic similarity:
            "Retrieve semantically similar text."
            Focuses on intent/meaning equivalence even with different wording.
        """
        if not self.api_key:
            raise ValueError("DASHSCOPE_API_KEY is not set")
        if not documents:
            return {"results": [], "raw": None}

        payload: dict[str, Any] = {
            "model": self.model,
            "query": query,
            "documents": documents,
        }
        if top_n is not None:
            payload["top_n"] = top_n
        if instruct:
            payload["instruct"] = instruct
        if return_documents is not None:
            payload["return_documents"] = return_documents

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            response = requests.post(
                self.endpoint,
                headers=headers,
                json=payload,
                timeout=self.timeout,
            )
            response.raise_for_status()
            data = response.json()
        except requests.RequestException as exc:
            raise RuntimeError(f"DashScope rerank request failed: {exc}") from exc

        results = data.get("results", [])
        return {
            "results": results,
            "usage": data.get("usage", {}),
            "request_id": data.get("id"),
        }


class EmbeddingAndReranking:
    _EMBED_BATCH_SIZE = 10

    def __init__(self):
        # self.embeddings = OpenAIEmbeddings(
        #     model="openai/text-embedding-3-small",  # 8,192 context | $0.02/M input tokens | $0/M output tokens
        #     base_url="https://openrouter.ai/api/v1",
        #     api_key=getenv("OPENROUTER_API_KEY"),
        #     check_embedding_ctx_length=False,
        #     dimensions=1024,
        # )
        self.embeddings = OpenAIEmbeddings(
            model="text-embedding-v4", # Ali Embedding
            base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
            api_key=os.getenv("DASHSCOPE_API_KEY"),
            check_embedding_ctx_length=False,
            dimensions=1024,
        )
        self.reranker = DashScopeReranker(
            api_key=os.getenv("DASHSCOPE_API_KEY"),
            model="qwen3-rerank",
        )

    def embed_for_text(self, text: str) -> list[float]:
        return self.embeddings.embed_query(text)

    def embed_for_texts(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        # DashScope embedding endpoint enforces batch size <= 10.
        vectors: list[list[float]] = []
        total_batches = (len(texts) + self._EMBED_BATCH_SIZE - 1) // self._EMBED_BATCH_SIZE
        for start in tqdm(
            range(0, len(texts), self._EMBED_BATCH_SIZE),
            total=total_batches,
            desc="Embedding batches",
            unit="batch",
        ):
            batch = texts[start : start + self._EMBED_BATCH_SIZE]
            vectors.extend(self.embeddings.embed_documents(batch))

        return vectors

    def rerank_documents(
        self,
        query: str,
        documents: list[str],
        top_n: Optional[int] = None,
        instruct: Optional[str] = "Retrieve semantically similar text.",
        return_documents: Optional[bool] = True,
    ) -> dict[str, Any]:
        """Rerank candidate documents for a query.

        `instruct` controls ranking behavior:
        - QA retrieval (default):
            "Given a web search query, retrieve relevant passages that answer the query."
            Focuses on whether a document directly answers the query.
        - Semantic similarity:
            "Retrieve semantically similar text."
            Focuses on intent/meaning equivalence even with different wording.

        Output Example:
        ```python
        {
            "results": [
                {
                    "document": {"text": "Hi"},
                    "index": 0,
                    "relevance_score": 0.9416137362411887,
                },
                {
                    "document": {"text": "Hello"},
                    "index": 1,
                    "relevance_score": 0.49561082338580914,
                },
            ],
            "usage": {"total_tokens": 20},
            "request_id": "7fa9457d-3df3-919f-aaae-8423950e0e6b",
        }
        ```
        """
        return self.reranker.rerank(
            query=query,
            documents=documents,
            top_n=top_n,
            instruct=instruct,
            return_documents=return_documents,
        )


if __name__ == "__main__":
    from dotenv import load_dotenv

    load_dotenv(override=True)

    embedding = EmbeddingAndReranking()
    print(embedding.embed_for_text("Hello World"))
    # print(embedding.rerank_documents("Hello", ["Hi", "Hello"]))
