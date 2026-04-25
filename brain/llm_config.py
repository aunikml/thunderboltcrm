import os
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

def sync_api_keys():
    """
    Standardizes API keys to silence warnings and ensure compatibility 
    with the 2026 Google AI SDK.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    google_key = os.getenv("GOOGLE_API_KEY")

    # If both are set, or if only GEMINI is set, standardize on GOOGLE_API_KEY
    target_key = gemini_key or google_key

    if target_key:
        os.environ["GOOGLE_API_KEY"] = target_key
        
        # Clean up the environment to prevent SDK conflicts
        if "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]
            
    return target_key

def get_langchain_llm():
    """
    Returns a standard LangChain instance for Gemini 3 Flash.
    Optimized for high-speed, accurate reasoning in 2026.
    """
    from langchain_google_genai import ChatGoogleGenerativeAI
    
    api_key = sync_api_keys()
    
    return ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview", # Valid 2026 model from discovery
        google_api_key=api_key,
        temperature=0.2,
    )