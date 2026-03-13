import os
from langchain_anthropic import ChatAnthropic

def get_llm(model_name: str = "claude-3-haiku-20240307", temperature: float = 0.2) -> ChatAnthropic:
    """Returns an instance of ChatAnthropic."""
    return ChatAnthropic(
        model_name=model_name,
        temperature=temperature,
        max_tokens=2048,
    )
