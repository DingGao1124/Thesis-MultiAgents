import asyncio
import os
import re
from typing import Any, Callable, List, Optional, Union

import nest_asyncio
import networkx as nx
import pandas as pd
from graspologic.partition import hierarchical_leiden
from llama_index.core import Document, PropertyGraphIndex
from llama_index.core.async_utils import run_jobs
from llama_index.core.bridge.pydantic import Field
from llama_index.core.graph_stores import SimplePropertyGraphStore
from llama_index.core.graph_stores.types import (
    EntityNode,
    KG_NODES_KEY,
    KG_RELATIONS_KEY,
    Relation,
)
from llama_index.core.indices.property_graph.utils import default_parse_triplets_fn
from llama_index.core.llms import ChatMessage
from llama_index.core.llms.llm import LLM
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.prompts import PromptTemplate
from llama_index.core.prompts.default_prompts import DEFAULT_KG_TRIPLET_EXTRACT_PROMPT
from llama_index.core.query_engine import CustomQueryEngine
from llama_index.core.schema import BaseNode, TransformComponent
from llama_index.llms.openai import OpenAI

nest_asyncio.apply()

# Step1: Install Dependencies
# pip install llama-index graspologic numpy==1.24.4 scipy==1.12.0


# Step2: Load and Preprocess Data
def load_documents(limit: int = 50) -> List[Document]:
    """Load sample news dataset and convert to LlamaIndex Document objects."""
    news = pd.read_csv(
        "https://raw.githubusercontent.com/tomasonjo/blog-datasets/main/news_articles.csv"
    )[:limit]
    return [
        Document(text=f"{row['title']}: {row['text']}") for _, row in news.iterrows()
    ]


# Step3: Split Text into Nodes
def split_into_nodes(documents: List[Document]) -> List[BaseNode]:
    """Split documents into manageable chunks for extraction."""
    splitter = SentenceSplitter(chunk_size=1024, chunk_overlap=20)
    return splitter.get_nodes_from_documents(documents)


# Step4: Configure the LLM, Prompt, and GraphRAG Extractor
entity_pattern = (
    r"entity_name:\s*(.+?)\s*entity_type:\s*(.+?)\s*entity_description:\s*(.+?)\s*"
)
relationship_pattern = (
    r"source_entity:\s*(.+?)\s*target_entity:\s*(.+?)\s*relation:\s*(.+?)\s*"
    r"relationship_description:\s*(.+?)\s*"
)


def parse_fn(response_str: str) -> Any:
    """Parse entity and relationship tuples from LLM output."""
    entities = re.findall(entity_pattern, response_str)
    relationships = re.findall(relationship_pattern, response_str)
    return entities, relationships


class GraphRAGExtractor(TransformComponent):
    """Extract triples and descriptions from text chunks using an LLM."""

    llm: LLM
    extract_prompt: PromptTemplate
    parse_fn: Callable
    num_workers: int
    max_paths_per_chunk: int

    def __init__(
        self,
        llm: Optional[LLM] = None,
        extract_prompt: Optional[Union[str, PromptTemplate]] = None,
        parse_fn: Callable = default_parse_triplets_fn,
        max_paths_per_chunk: int = 10,
        num_workers: int = 4,
    ) -> None:
        from llama_index.core import Settings

        if isinstance(extract_prompt, str):
            extract_prompt = PromptTemplate(extract_prompt)

        super().__init__(
            llm=llm or Settings.llm,
            extract_prompt=extract_prompt or DEFAULT_KG_TRIPLET_EXTRACT_PROMPT,
            parse_fn=parse_fn,
            num_workers=num_workers,
            max_paths_per_chunk=max_paths_per_chunk,
        )

    @classmethod
    def class_name(cls) -> str:
        return "GraphExtractor"

    def __call__(
        self, nodes: List[BaseNode], show_progress: bool = False, **kwargs: Any
    ) -> List[BaseNode]:
        return asyncio.run(self.acall(nodes, show_progress=show_progress, **kwargs))

    async def _aextract(self, node: BaseNode) -> BaseNode:
        assert hasattr(node, "text")

        text = node.get_content(metadata_mode="llm")
        try:
            llm_response = await self.llm.apredict(
                self.extract_prompt,
                text=text,
                max_knowledge_triplets=self.max_paths_per_chunk,
            )
            entities, entities_relationship = self.parse_fn(
                llm_response
            )  # parse llm result to graph data
        except ValueError:
            entities = []
            entities_relationship = []

        existing_nodes = node.metadata.pop(KG_NODES_KEY, [])
        existing_relations = node.metadata.pop(KG_RELATIONS_KEY, [])

        metadata = node.metadata.copy()
        for entity, entity_type, description in entities:
            metadata["entity_description"] = description
            entity_node = EntityNode(
                name=entity, label=entity_type, properties=metadata
            )
            existing_nodes.append(entity_node)

        metadata = node.metadata.copy()
        for triple in entities_relationship:
            subj, rel, obj, description = triple
            subj_node = EntityNode(name=subj, properties=metadata)
            obj_node = EntityNode(name=obj, properties=metadata)
            metadata["relationship_description"] = description
            rel_node = Relation(
                label=rel,
                source_id=subj_node.id,
                target_id=obj_node.id,
                properties=metadata,
            )
            existing_nodes.extend([subj_node, obj_node])
            existing_relations.append(rel_node)

        node.metadata[KG_NODES_KEY] = existing_nodes
        node.metadata[KG_RELATIONS_KEY] = existing_relations
        return node

    async def acall(
        self, nodes: List[BaseNode], show_progress: bool = False, **kwargs: Any
    ) -> List[BaseNode]:
        jobs = [self._aextract(node) for node in nodes]
        return await run_jobs(
            jobs,
            workers=self.num_workers,
            show_progress=show_progress,
            desc="Extracting paths from text",
        )


KG_TRIPLET_EXTRACT_TMPL = """
-Goal-
Given a text document, identify all entities and their entity types from the text and all relationships among the identified entities.
Given the text, extract up to {max_knowledge_triplets} entity-relation triplets.

-Steps-
1. Identify all entities. For each identified entity, extract the following information:
- entity_name: Name of the entity, capitalized
- entity_type: Type of the entity
- entity_description: Comprehensive description of the entity's attributes and activities
Format each entity as ("entity")

2. From the entities identified in step 1, identify all pairs of (source_entity, target_entity) that are *clearly related* to each other.
For each pair of related entities, extract the following information:
- source_entity: name of the source entity, as identified in step 1
- target_entity: name of the target entity, as identified in step 1
- relation: relationship between source_entity and target_entity
- relationship_description: explanation as to why you think the source entity and the target entity are related to each other

Format each relationship as ("relationship")

3. When finished, output.

-Real Data-
######################
text: {text}
######################
output:
"""


# Step5: Build the Graph Index
class GraphRAGStore(SimplePropertyGraphStore):
    """Graph store with community detection and summary generation."""

    community_summary: dict = Field(default_factory=dict)
    max_cluster_size: int = 5
    llm: Optional[LLM] = None

    def __init__(self, llm: Optional[LLM] = None, **kwargs: Any) -> None:
        super().__init__(**kwargs)
        self.llm = llm
        self.community_summary = {}

    def generate_community_summary(self, text: str) -> str:
        """Generate summary for a given text using an LLM."""
        model = self.llm or OpenAI(model=os.getenv("OPENAI_MODEL", "gpt-4o"))
        messages = [
            ChatMessage(
                role="system",
                content=(
                    "You are provided with a set of relationships from a knowledge graph, each represented as "
                    "entity1->entity2->relation->relationship_description. Your task is to create a summary of these "
                    "relationships. The summary should include the names of the entities involved and a concise synthesis "
                    "of the relationship descriptions. The goal is to capture the most critical and relevant details that "
                    "highlight the nature and significance of each relationship. Ensure that the summary is coherent and "
                    "integrates the information in a way that emphasizes the key aspects of the relationships."
                ),
            ),
            ChatMessage(role="user", content=text),
        ]
        response = model.chat(messages)
        return re.sub(r"^assistant:\s*", "", str(response)).strip()

    def build_communities(self) -> None:
        """Build communities from the graph and summarize them."""
        nx_graph = self._create_nx_graph()
        if nx_graph.number_of_nodes() == 0 or nx_graph.number_of_edges() == 0:
            self.community_summary = {}
            return

        community_hierarchical_clusters = hierarchical_leiden(
            nx_graph, max_cluster_size=self.max_cluster_size
        )
        community_info = self._collect_community_info(
            nx_graph, community_hierarchical_clusters
        )
        self._summarize_communities(community_info)

    def _create_nx_graph(self) -> nx.Graph:
        """Convert internal graph representation to a NetworkX graph."""
        nx_graph = nx.Graph()

        for node in self.graph.nodes.values():
            node_id = str(node.id)
            nx_graph.add_node(node_id)

        for relation in self.graph.relations.values():
            source = str(relation.source_id)
            target = str(relation.target_id)
            description = relation.properties.get("relationship_description", "")
            nx_graph.add_edge(
                source,
                target,
                relationship=relation.label,
                description=description,
            )
        return nx_graph

    def _collect_community_info(self, nx_graph: nx.Graph, clusters: Any) -> dict:
        """Collect relation details grouped by community id."""
        community_mapping = {item.node: item.cluster for item in clusters}
        community_info: dict = {}

        for item in clusters:
            cluster_id = item.cluster
            node = item.node
            if cluster_id not in community_info:
                community_info[cluster_id] = []

            for neighbor in nx_graph.neighbors(node):
                if community_mapping.get(neighbor) == cluster_id:
                    edge_data = nx_graph.get_edge_data(node, neighbor)
                    if edge_data:
                        detail = (
                            f"{node} -> {neighbor} -> {edge_data['relationship']} -> "
                            f"{edge_data['description']}"
                        )
                        community_info[cluster_id].append(detail)
        return community_info

    def _summarize_communities(self, community_info: dict) -> None:
        """Generate and store summaries for each community."""
        for community_id, details in community_info.items():
            if not details:
                continue
            details_text = "\n".join(details) + "."
            self.community_summary[community_id] = self.generate_community_summary(
                details_text
            )

    def get_community_summaries(self) -> dict:
        """Return community summaries, build them if missing."""
        if not self.community_summary:
            self.build_communities()
        return self.community_summary


# Step7: Query the Graph
class GraphRAGQueryEngine(CustomQueryEngine):
    """Query engine that answers by aggregating community-level responses."""

    graph_store: GraphRAGStore
    llm: LLM

    def custom_query(self, query_str: str) -> str:
        community_summaries = self.graph_store.get_community_summaries()
        if not community_summaries:
            return "No community summaries are available. Build the graph first."

        community_answers = [
            self.generate_answer_from_summary(summary, query_str)
            for _, summary in community_summaries.items()
        ]
        return self.aggregate_answers(community_answers)

    def generate_answer_from_summary(self, community_summary: str, query: str) -> str:
        """Generate an answer for one community summary."""
        prompt = (
            f"Given the community summary: {community_summary}, "
            f"how would you answer the following query? Query: {query}"
        )
        messages = [
            ChatMessage(role="system", content=prompt),
            ChatMessage(
                role="user",
                content="I need an answer based on the above information.",
            ),
        ]
        response = self.llm.chat(messages)
        return re.sub(r"^assistant:\s*", "", str(response)).strip()

    def aggregate_answers(self, community_answers: List[str]) -> str:
        """Aggregate individual community answers into one final response."""
        prompt = (
            "Combine the following intermediate answers into a final, concise response."
        )
        messages = [
            ChatMessage(role="system", content=prompt),
            ChatMessage(
                role="user", content=f"Intermediate answers: {community_answers}"
            ),
        ]
        final_response = self.llm.chat(messages)
        return re.sub(r"^assistant:\s*", "", str(final_response)).strip()


# Step6: Detect Communities and Summarize
def main() -> None:
    """Run an end-to-end GraphRAG demo pipeline."""
    if not os.getenv("OPENAI_API_KEY"):
        raise EnvironmentError(
            "OPENAI_API_KEY is not set. Please set it before running graph_rag.py"
        )

    model_name = os.getenv("OPENAI_MODEL", "gpt-4o")
    llm = OpenAI(model=model_name)

    documents = load_documents(limit=50)
    nodes = split_into_nodes(documents)

    kg_extractor = GraphRAGExtractor(
        llm=llm,
        extract_prompt=KG_TRIPLET_EXTRACT_TMPL,
        max_paths_per_chunk=2,
        parse_fn=parse_fn,
    )

    graph_store = GraphRAGStore(llm=llm)
    index = PropertyGraphIndex(
        nodes=nodes,
        property_graph_store=graph_store,
        kg_extractors=[kg_extractor],
        show_progress=True,
    )

    index.property_graph_store.build_communities()
    query_engine = GraphRAGQueryEngine(graph_store=index.property_graph_store, llm=llm)
    response = query_engine.query("What are news related to financial sector?")
    print(response.response)


if __name__ == "__main__":
    main()
