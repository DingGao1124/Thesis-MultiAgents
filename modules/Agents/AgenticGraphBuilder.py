from langchain.agents import create_agent
from langchain_openrouter import ChatOpenRouter
from langchain_core.tools import tool
from langchain_neo4j import Neo4jGraph
from neo4j import GraphDatabase


# Define tools
@tool
def multiply(a: int, b: int) -> int:
    """Multiply `a` and `b`.

    Args:
        a: First int
        b: Second int
    """
    return a * b


class AgenticGraphBuilder:
    def __int__(self):
        self.llm = ChatOpenRouter(
            model="openai/gpt-5-nano",  # 400K context | $0.05/M input tokens | $0.40/M output tokens
            # base_url="https://openrouter.ai/api/v1",
        )
        self.agent = create_agent(
            model=self.llm,
            tools=[multiply],
            system_prompt="You are a helpful AI Assistant.",
        )


if __name__ == "__main__":
    from dotenv import load_dotenv
    from neo4j import GraphDatabase
    import os

    load_dotenv(override=True)

    URL = os.getenv("NEO4J_URI")
    USERNAME = os.getenv("NEO4J_USERNAME")
    PASSWORD = os.getenv("NEO4J_PASSWORD")

    print("=== Clearing existing data & indexes ===")
    driver = GraphDatabase.driver(URL, auth=(USERNAME, PASSWORD))
    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")
        session.run("DROP INDEX vector   IF EXISTS")
        session.run("DROP INDEX keyword  IF EXISTS")
    driver.close()
    print("✓ Cleared all nodes, relationships and indexes")
