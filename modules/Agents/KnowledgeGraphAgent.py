"""Knowledge-graph agent: build and query a Neo4j graph through natural language."""

import json
import os
from dataclasses import dataclass
from typing import Any, Optional

from dotenv import load_dotenv
from langchain.agents import create_agent
from langchain.tools import tool, ToolRuntime
from langchain_neo4j import Neo4jGraph
from langchain_openrouter import ChatOpenRouter

@dataclass
class GraphContext:
    """Runtime context injected into tools by ``create_agent``.

    The graph connection is kept outside tool arguments and passed through
    ``runtime.context`` so tools remain focused on operation inputs.
    """

    graph: Neo4jGraph


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------

@tool
def get_graph_schema(runtime: ToolRuntime[GraphContext]) -> str:
    """Return the current Neo4j graph schema: node labels, properties, and
    relationship types.  Always call this first if you are unsure of the
    graph structure before writing a Cypher query."""
    g = runtime.context.graph
    g.refresh_schema()
    return g.schema


@tool
def run_cypher(cypher: str, runtime: ToolRuntime[GraphContext]) -> str:
    """Execute any Cypher statement (read or write) against the Neo4j graph
    and return the results as a string.

    Args:
        cypher: A valid Cypher statement, e.g.
                'MATCH (n:Person) RETURN n.name LIMIT 5'
    """
    result = runtime.context.graph.query(cypher)
    return json.dumps(result, ensure_ascii=False)


@tool
def upsert_node(
    label: str, properties_json: str, runtime: ToolRuntime[GraphContext]
) -> str:
    """Create or update a node using MERGE on the first property key.

    Args:
        label: Node label, e.g. 'Person' or 'Concept'.
        properties_json: JSON object of properties, e.g.
                         '{"name": "Alice", "age": 30}'.
                         The first key is used as the MERGE identity key.
    """
    props: dict = json.loads(properties_json)
    merge_key = next(iter(props))
    set_clause = ", ".join(f"n.{k} = ${k}" for k in props)
    cypher = (
        f"MERGE (n:{label} {{{merge_key}: ${merge_key}}})"
        f" SET {set_clause}"
        f" RETURN n"
    )
    result = runtime.context.graph.query(cypher, params=props)
    return f"✓ upserted: {result}"


@tool
def upsert_relation(
    from_label: str,
    from_key: str,
    from_value: str,
    rel_type: str,
    to_label: str,
    to_key: str,
    to_value: str,
    runtime: ToolRuntime[GraphContext],
    rel_properties_json: str = "{}",
) -> str:
    """Create or update a directed relationship between two nodes.

    Args:
        from_label:          Label of the source node (e.g. 'Person').
        from_key:            Property name used to identify the source node (e.g. 'name').
        from_value:          Property value of the source node (e.g. 'Alice').
        rel_type:            Relationship type in UPPER_SNAKE_CASE (e.g. 'KNOWS').
        to_label:            Label of the target node.
        to_key:              Property name used to identify the target node.
        to_value:            Property value of the target node.
        rel_properties_json: Optional JSON object of properties to set on the
                             relationship, e.g. '{"since": 2020}'.
    """
    rel_props: dict = json.loads(rel_properties_json)
    set_clause = ("SET " + ", ".join(f"r.{k} = $rel_{k}" for k in rel_props)) if rel_props else ""
    params = {"from_val": from_value, "to_val": to_value}
    params.update({f"rel_{k}": v for k, v in rel_props.items()})
    cypher = (
        f"MERGE (a:{from_label} {{{from_key}: $from_val}})"
        f" MERGE (b:{to_label} {{{to_key}: $to_val}})"
        f" MERGE (a)-[r:{rel_type}]->(b)"
        f" {set_clause}"
        f" RETURN r"
    )
    result = runtime.context.graph.query(cypher, params=params)
    return f"✓ relation upserted: {result}"


@tool
def search_nodes(
    label: str, prop: str, value: str, runtime: ToolRuntime[GraphContext]
) -> str:
    """Search nodes by label and a property value (case-insensitive substring).

    Args:
        label: Node label to search within (e.g. 'Person').
        prop:  Property name to match against (e.g. 'name').
        value: Substring to look for (case-insensitive).
    """
    cypher = (
        f"MATCH (n:{label})"
        f" WHERE toLower(toString(n.{prop})) CONTAINS toLower($value)"
        f" RETURN n LIMIT 20"
    )
    result = runtime.context.graph.query(cypher, params={"value": value})
    return json.dumps(result, ensure_ascii=False)


# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are a knowledge-graph assistant with direct access to a Neo4j database.

Capabilities:
- Answer questions about the data by querying the graph.
- Build or extend the graph: add nodes, add relationships, update entities.
- Inspect the schema to understand the existing structure.

Workflow for questions:
1. Call get_graph_schema if needed to understand labels and relationships.
2. Write and run a Cypher query with run_cypher.
3. Summarise the results clearly and concisely.

Workflow for graph building:
1. Use upsert_node to create or update nodes.
2. Use upsert_relation to connect nodes.
3. Confirm what was added.

Prefer upsert_node / upsert_relation for simple CRUD. Use run_cypher for
complex queries or bulk operations. Always respond in the same language the
user writes in.\
"""

# ---------------------------------------------------------------------------
# Agent class
# ---------------------------------------------------------------------------

_TOOLS = [get_graph_schema, run_cypher, upsert_node, upsert_relation, search_nodes]


class KnowledgeGraphAgent:
    """Conversational agent for building and querying a Neo4j knowledge graph.

    Wraps LangChain's ``create_agent`` with a ``ChatOpenRouter`` LLM and a set
    of Neo4j-backed tools. The Neo4j connection is injected via
    ``context_schema=GraphContext`` so each tool accesses it through
    ``runtime.context.graph``.

    Parameters
    ----------
    model:
        OpenRouter model identifier (default ``openai/gpt-4o-mini``).
    enhanced_schema:
        When True, the Neo4j schema includes example values and distribution
        statistics (slightly slower to retrieve).
    system_prompt:
        Override the built-in system prompt.
    checkpointer:
        Optional LangGraph checkpointer for multi-turn conversation memory.
    verbose:
        Enable LangGraph debug output.

    Notes
    -----
    Neo4j credentials are read from environment variables:
    ``NEO4J_URI``, ``NEO4J_USERNAME``, ``NEO4J_PASSWORD``.
    LLM calls are routed through ``OPENROUTER_API_KEY``.
    """

    def __init__(
        self,
        model: str = "openai/gpt-4o-mini",
        enhanced_schema: bool = False,
        system_prompt: Optional[str] = None,
        checkpointer=None,
        verbose: bool = False,
    ):
        self._graph = Neo4jGraph(
            url=os.getenv("NEO4J_URI", "bolt://localhost:7687"),
            username=os.getenv("NEO4J_USERNAME", "neo4j"),
            password=os.getenv("NEO4J_PASSWORD", "password"),
            enhanced_schema=enhanced_schema,
        )
        self._context = GraphContext(graph=self._graph)
        print("✓ Neo4j connected")

        self._agent = create_agent(
            model=ChatOpenRouter(model=model),
            tools=_TOOLS,
            context_schema=GraphContext,
            system_prompt=system_prompt or _SYSTEM_PROMPT,
            checkpointer=checkpointer,
            debug=verbose,
        )
        print(f"✓ KnowledgeGraphAgent ready  (model={model})")

    # ------------------------------------------------------------------ #
    #  Public API                                                          #
    # ------------------------------------------------------------------ #

    def chat(self, message: str, thread_id: str = "thread-1") -> str:
        """Send a natural-language message and return the agent's reply.

        When a ``checkpointer`` was supplied at construction time, conversation
        history is maintained per ``thread_id``.
        """
        config = {"configurable": {"thread_id": thread_id}}
        result = self._agent.invoke(
            {"messages": [{"role": "user", "content": message}]},
            config=config,
            context=self._context,
        )
        return result["messages"][-1].content

    def stream(self, message: str, thread_id: str = "thread-1"):
        """Stream the agent's reply token-by-token.  Yields string chunks."""
        config = {"configurable": {"thread_id": thread_id}}
        for chunk in self._agent.stream(
            {"messages": [{"role": "user", "content": message}]},
            config=config,
            context=self._context,
            stream_mode="values",
        ):
            last = chunk["messages"][-1]
            if hasattr(last, "content") and last.content:
                yield last.content


# ---------------------------------------------------------------------------
# Standalone REPL
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    load_dotenv(override=True)

    agent = KnowledgeGraphAgent(
        model="openai/gpt-4o-mini",
        enhanced_schema=True,
        verbose=False,
    )

    print("\n=== Graph schema ===")
    print(agent._graph.schema)

    print("\n=== Chat (type 'exit' to quit) ===")
    while True:
        try:
            q = input("You: ").strip()
        except (KeyboardInterrupt, EOFError):
            break
        if q.lower() in ("exit", "quit", "q"):
            break
        if not q:
            continue
        reply = agent.chat(q)
        print(f"Agent: {reply}\n")
