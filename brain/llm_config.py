import os
from dotenv import load_dotenv
from crewai import LLM

# Load variables from .env
load_dotenv()

def sync_api_keys():
    """
    Standardizes API keys to silence the 'Both keys are set' warning.
    We prioritize GEMINI_API_KEY from .env and map it to GOOGLE_API_KEY,
    then remove the extra GEMINI_API_KEY from the active environment.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    google_key = os.getenv("GOOGLE_API_KEY")

    # If both are set, or if only GEMINI is set, standardize on GOOGLE_API_KEY
    target_key = gemini_key or google_key

    if target_key:
        os.environ["GOOGLE_API_KEY"] = target_key
        
        # This is the "Magic Trick": 
        # By deleting GEMINI_API_KEY from the active OS environment (not the file),
        # the Google SDK only sees one key and stops issuing the warning.
        if "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]
            
    return target_key

def get_gemini_llm():
    """
    Returns a native CrewAI LLM instance.
    """
    api_key = sync_api_keys()
    
    return LLM(
        model="gemini/gemini-2.5-pro", # Or the winner from your benchmark
        api_key=api_key,
        temperature=0.2,
    )

def get_langchain_llm():
    """
    Returns a standard LangChain instance.
    """
    from langchain_google_genai import ChatGoogleGenerativeAI
    
    # We call sync again to ensure the environment is clean
    api_key = sync_api_keys()
    
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-pro",
        google_api_key=api_key,
        temperature=0.7,
    )