from langchain_openai import OpenAIEmbeddings
from os import getenv


class Embedding:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(
            model="openai/text-embedding-3-small",  # 8,192 context | $0.02/M input tokens | $0/M output tokens
            base_url="https://openrouter.ai/api/v1",
            api_key=getenv("OPENROUTER_API_KEY"),
            check_embedding_ctx_length=False,
            # dimensions=1536,
        )

    def embed_for_text(self, text: str) -> list[float]:
        return self.embeddings.embed_query(text)

    def embed_for_texts(self, texts: list[str]) -> list[list[float]]:
        return self.embeddings.embed_documents(texts)


if __name__ == "__main__":
    from dotenv import load_dotenv

    load_dotenv(override=True)

    embedding = Embedding()
    print(len(embedding.embed_for_text("Hello World")))  # 1536 dims
