---
applyTo: "{*.py,api/**/*.py,config/**/*.py,lib/**/*.py,modules/**/*.py,services/**/*.py,utils/**/*.py}"
---

# Python Scoped Rules (Outside Thesis-MultiAgents)

- Always be simple and concise, do not give me a lot of bullshit!
- Use service-oriented structure and keep business logic in service modules.
- Keep functions and classes simple and readable; prioritize feature delivery.
- Avoid redundant defensive code and excessive try/except.
- Add try/except only at external I/O boundaries or clear failure boundaries.
- Keep explicit Python type hints.
- Keep backend modules decoupled and follow single responsibility.
- Keep comments and docstrings in English only, and only when necessary.
- Use .env for secrets; never hardcode credentials.
- Keep provider separation strict: chat via OpenRouter, embedding/reranking via DashScope.
