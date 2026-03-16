import os
from dotenv import load_dotenv
from src.utils.llm import get_llm

# Explicitly load .env from the current directory
load_dotenv(os.path.join(os.getcwd(), '.env'))

def test_deepseek():
    try:
        api_key = os.getenv("DEEPSEEK_API_KEY")
        print(f"DEEPSEEK_API_KEY present: {bool(api_key)}")
        llm = get_llm()
        print(f"Testing LLM with model: {llm.model_name}")
        response = llm.invoke("What is a health signal?")
        print(f"Response: {response.content}")
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    test_deepseek()
