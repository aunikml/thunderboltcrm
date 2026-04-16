import os
import sys
from dotenv import load_dotenv

# 1. Load environment variables
load_dotenv()

def test_gemini_connection():
    print("\n--- 🛡️ Thunderbolt CRM: Gemini Connectivity Test ---")
    
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ ERROR: GEMINI_API_KEY not found in .env file.")
        return

    print(f"✅ Found API Key: {api_key[:5]}...{api_key[-5:]}")

    # --- TEST 1: LangChain Connection (Used for LangGraph/Scripts) ---
    print("\n[Test 1] Testing LangChain (ChatGoogleGenerativeAI)...")
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key
        )
        response = llm.invoke("Say 'LangChain is connected!'")
        print(f"🤖 Response: {response.content}")
        print("✅ LangChain Connection: SUCCESS")
    except Exception as e:
        print(f"❌ LangChain Connection: FAILED")
        print(f"Details: {str(e)}")

    # --- TEST 2: LiteLLM Connection (Used by CrewAI Agents) ---
    print("\n[Test 2] Testing LiteLLM/CrewAI Bridge...")
    try:
        import litellm
        # LiteLLM specifically looks for GOOGLE_API_KEY
        os.environ["GOOGLE_API_KEY"] = api_key
        
        response = litellm.completion(
            model="gemini/gemini-2.5-flash",
            messages=[{"role": "user", "content": "Say 'LiteLLM is connected!'"}]
        )
        answer = response.choices[0].message.content
        print(f"🤖 Response: {answer}")
        print("✅ LiteLLM Connection: SUCCESS")
    except ImportError:
        print("❌ LiteLLM not installed. Run: pip install litellm")
    except Exception as e:
        print(f"❌ LiteLLM Connection: FAILED")
        print(f"Details: {str(e)}")

    print("\n--- 🏁 Test Finished ---")

if __name__ == "__main__":
    test_gemini_connection()