import os
from langchain_openai import ChatOpenAI

def get_llm(model_name: str = "deepseek-reasoner", temperature: float = 0.2) -> ChatOpenAI:
    """Returns an instance of ChatOpenAI configured for DeepSeek."""
    return ChatOpenAI(
        model=model_name,
        temperature=temperature,
        base_url="https://api.deepseek.com",
        api_key=os.getenv("DEEPSEEK_API_KEY"),
    )
