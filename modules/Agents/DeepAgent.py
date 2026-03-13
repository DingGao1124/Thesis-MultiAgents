from deepagents import create_deep_agent
from langchain_openrouter import ChatOpenRouter
from langchain.agents.middleware import TodoListMiddleware
from langchain.tools import tool
from langchain.agents import create_agent


@tool
def get_weather(city: str) -> str:
    """Get weather for a given city.

    Args:
        city: The name of the city.
    """
    return f"It's always sunny in {city}!"


agent = create_deep_agent(
    model=ChatOpenRouter(
        model="openai/gpt-5-nano",  # 400K context | $0.05/M input tokens | $0.40/M output tokens
    ),
    tools=[get_weather],
    system_prompt="You are a helpful assistant",
)

if __name__ == "__main__":
    # Run the agent
    agent.invoke(
        {"messages": [{"role": "user", "content": "what is the weather in sf"}]}
    )
