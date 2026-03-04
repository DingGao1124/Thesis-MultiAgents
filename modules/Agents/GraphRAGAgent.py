import os
from typing import Any, Dict, List, Optional

from langchain_core.documents import Document
from langchain_neo4j import Neo4jVector
from langchain_openai import OpenAIEmbeddings


class GraphRAGAgent:
    """Graph RAG agent powered by Neo4j vector index.

    Supports three search modes (all targeting **node** vector indexes):
    - similarity_search:            vector cosine similarity (default)
    - similarity_search_with_score: same, but returns (Document, score) tuples
    - hybired_search:               combined vector + keyword (BM25) search

    NOTE: Relationship vector index search (from_existing_relationship_index) is
    NOT yet implemented in this agent. Neo4j supports storing embeddings on
    relationship properties and querying them via a separate relationship vector
    index, but that integration path is left as a future TODO.
    IMPORTANT: Neo4j index names are globally unique across the entire database,
    so the relationship vector index CANNOT share the name "vector" with the node
    vector index. A distinct name must be used, e.g. "relationship_vector".

    retrieval_query (optional):
        Custom Cypher snippet appended after vector index lookup.
        Must return three columns:
          text  (str | dict) → Document.page_content
          score (float)      → similarity score
          metadata (dict)    → Document.metadata
        Example:
            RETURN "Name:" + node.name AS text, score, {foo:"bar"} AS metadata
    """

    def __init__(
        self,
        url: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        index_name: str = "vector",
        keyword_index_name: str = "keyword",
        retrieval_query: Optional[str] = None,
        embedding: Optional[Any] = None,
    ):
        self.url = url or os.getenv("NEO4J_URI")
        self.username = username or os.getenv("NEO4J_USERNAME")
        self.password = password or os.getenv("NEO4J_PASSWORD")
        self.index_name = index_name
        self.keyword_index_name = keyword_index_name
        self.retrieval_query = retrieval_query
        self.embedding = embedding or OpenAIEmbeddings()

        # Vector store (cosine similarity)
        kwargs: Dict[str, Any] = dict(
            embedding=self.embedding,
            url=self.url,
            username=self.username,
            password=self.password,
            index_name=self.index_name,
        )
        if self.retrieval_query:
            kwargs["retrieval_query"] = self.retrieval_query
        self.store = Neo4jVector.from_existing_index(**kwargs)

        # Hybrid store (vector + keyword)
        self.hybrid_store = Neo4jVector.from_existing_index(
            embedding=self.embedding,
            url=self.url,
            username=self.username,
            password=self.password,
            index_name=self.index_name,
            keyword_index_name=self.keyword_index_name,
            search_type="hybrid",
        )

    # ------------------------------------------------------------------ #
    #  Three core search methods                                           #
    # ------------------------------------------------------------------ #

    def similarity_search(
        self,
        query: str,
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        """Vector cosine similarity search."""
        return self.store.similarity_search(
            query, k=k, filter=filter, params=params or {}
        )

    def similarity_search_with_score(
        self,
        query: str,
        k: int = 4,
    ) -> List[tuple]:
        """Vector cosine similarity search, returns (Document, score) tuples."""
        return self.store.similarity_search_with_score(query, k=k)

    def hybired_search(
        self,
        query: str,
        k: int = 4,
        filter: Optional[Dict[str, Any]] = None,
        params: Optional[Dict[str, Any]] = None,
    ) -> List[Document]:
        """Hybrid search combining vector similarity and keyword (BM25)."""
        return self.hybrid_store.similarity_search(
            query, k=k, filter=filter, params=params or {}
        )

    # ------------------------------------------------------------------ #
    #  Helpers                                                             #
    # ------------------------------------------------------------------ #

    def add_documents(self, docs: List[Document]) -> List[str]:
        """Add documents to the vector index."""
        return self.store.add_documents(docs)

    def as_retriever(self, **kwargs: Any) -> Any:
        """Return a LangChain retriever for use in chains."""
        return self.store.as_retriever(**kwargs)

    def query(
        self, cypher: str, params: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Execute a raw Cypher query against Neo4j."""
        return self.store.query(cypher, params=params)


if __name__ == "__main__":
    from dotenv import load_dotenv
    from neo4j import GraphDatabase

    load_dotenv(override=True)

    URL = os.getenv("NEO4J_URI")
    USERNAME = os.getenv("NEO4J_USERNAME")
    PASSWORD = os.getenv("NEO4J_PASSWORD")

    # ------------------------------------------------------------------ #
    # Step 1: Clear all existing data and indexes                          #
    # ------------------------------------------------------------------ #
    print("=== Step 1: Clear existing data & indexes ===")
    driver = GraphDatabase.driver(URL, auth=(USERNAME, PASSWORD))
    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")
        session.run("DROP INDEX vector   IF EXISTS")
        session.run("DROP INDEX keyword  IF EXISTS")
    driver.close()
    print("✓ Cleared all nodes, relationships and indexes")

    # ------------------------------------------------------------------ #
    # Step 2: Create indexes and ingest sample documents                   #
    # ------------------------------------------------------------------ #
    print("\n=== Step 2: Ingest sample documents ===")
    embedding = OpenAIEmbeddings()

    sample_docs = [
        Document(
            page_content="The robotic arm station handles welding tasks on the production line.",
            metadata={"station": "welding", "robot": "UR5", "cycle_time": 30},
        ),
        Document(
            page_content="The conveyor belt transfers parts between assembly stations automatically.",
            metadata={"station": "conveyor", "speed_mpm": 0.5, "cycle_time": 10},
        ),
        Document(
            page_content="Quality inspection uses computer vision to detect surface defects.",
            metadata={"station": "inspection", "method": "vision", "cycle_time": 15},
        ),
        Document(
            page_content="The painting booth applies anti-corrosion coating to metal components.",
            metadata={"station": "painting", "method": "spray", "cycle_time": 45},
        ),
        Document(
            page_content="Final assembly station integrates all sub-components into the finished product.",
            metadata={"station": "assembly", "workers": 2, "cycle_time": 60},
        ),
    ]

    # from_documents creates the vector index and ingests docs in one call
    store = Neo4jVector.from_documents(
        sample_docs,
        embedding,
        url=URL,
        username=USERNAME,
        password=PASSWORD,
        index_name="vector",
    )
    # from_documents with search_type="hybrid" also creates a keyword index
    Neo4jVector.from_documents(
        sample_docs,
        embedding,
        url=URL,
        username=USERNAME,
        password=PASSWORD,
        index_name="vector",
        keyword_index_name="keyword",
        search_type="hybrid",
    )
    print(f"✓ Ingested {len(sample_docs)} documents into vector + keyword indexes")

    # ------------------------------------------------------------------ #
    # Step 3: Run experiments via GraphRAGAgent                            #
    # ------------------------------------------------------------------ #
    print("\n=== Step 3: Experiments ===")
    agent = GraphRAGAgent(url=URL, username=USERNAME, password=PASSWORD)

    print("\n--- similarity_search ---")
    results = agent.similarity_search("robot arm welding", k=2)
    for doc in results:
        print(f"  {doc.page_content}")
        print(f"  metadata: {doc.metadata}")

    print("\n--- similarity_search_with_score ---")
    scored = agent.similarity_search_with_score("quality control defect detection", k=2)
    for doc, score in scored:
        print(f"  Score: {score:.4f} | {doc.page_content[:80]}")

    print("\n--- hybired_search ---")
    hybrid_results = agent.hybired_search("assembly conveyor station", k=2)
    for doc in hybrid_results:
        print(f"  {doc.page_content}")

    print("\n--- metadata filter (cycle_time > 20) ---")
    filtered = agent.similarity_search(
        "production station",
        k=5,
        filter={"cycle_time": {"$gt": 20}},
    )
    for doc in filtered:
        print(
            f"  cycle_time={doc.metadata.get('cycle_time')} | {doc.page_content[:70]}"
        )
