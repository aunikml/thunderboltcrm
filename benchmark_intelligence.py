import os
import time
import json
import django
from dotenv import load_dotenv

# 1. Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from langchain_google_genai import ChatGoogleGenerativeAI
from courses.models import Program
from leads.models import Lead

load_dotenv()

# --- CONFIGURATION ---
MODELS_TO_TEST = [
    "gemini-3-flash-preview",  # Your current high-speed choice
    "gemini-3-pro-preview",    # The high-reasoning alternative
    "gemini-1.5-flash-002"     # The stable legacy version
]

def run_benchmark():
    print("\n--- 🏎️ Thunderbolt CRM: Model Benchmark Engine ---")
    
    # Pick a sample lead and program for the test
    lead = Lead.objects.first()
    program = Program.objects.first()

    if not lead or not program:
        print("❌ Error: You need at least one Lead and one Program in the DB to test.")
        return

    test_context = f"""
    LEAD: {lead.first_name} {lead.last_name}, Profession: {lead.additional_data.get('profession', 'N/A')}
    TARGET: {program.name}
    """
    
    results = []

    for model_name in MODELS_TO_TEST:
        print(f"\nEvaluating: {model_name}...")
        
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.2
        )

        start_time = time.time()
        
        prompt = f"""
        Analyze fit for: {test_context}
        Return JSON ONLY: {{"score": 0-100, "reasoning": "string", "persona": "string"}}
        """

        try:
            response = llm.invoke(prompt)
            duration = time.time() - start_time
            
            # Check JSON compliance (Crucial for your Turbo node)
            content = response.content.replace('```json', '').replace('```', '').strip()
            is_valid_json = False
            try:
                json.loads(content)
                is_valid_json = True
            except:
                is_valid_json = False

            results.append({
                "model": model_name,
                "latency": round(duration, 2),
                "json_valid": is_valid_json,
                "output": content[:100] + "..."
            })
            print(f"✅ Finished in {round(duration, 2)}s | JSON Valid: {is_valid_json}")

        except Exception as e:
            print(f"❌ Failed: {str(e)}")

    # --- FINAL REPORT ---
    print("\n" + "="*50)
    print("      FINAL BENCHMARK REPORT")
    print("="*50)
    print(f"{'Model Name':<25} | {'Speed':<8} | {'JSON':<6}")
    print("-" * 50)
    for r in results:
        print(f"{r['model']:<25} | {r['latency']:<7}s | {r['json_valid']}")
    
    print("\n💡 SUGGESTION:")
    fastest = min(results, key=lambda x: x['latency'])
    print(f"- For real-time UX: Use {fastest['model']}")
    print(f"- For complex ranking: Use gemini-3-pro-preview (if latency < 15s)")

if __name__ == "__main__":
    run_benchmark()