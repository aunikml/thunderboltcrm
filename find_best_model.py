import os
import time
import json
import django
import google.generativeai as genai
from dotenv import load_dotenv

# 1. Setup Django Context (to use real lead data)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from langchain_google_genai import ChatGoogleGenerativeAI
from leads.models import Lead
from courses.models import Program

load_dotenv()

def discover_and_benchmark():
    print("\n--- 🔍 Thunderbolt CRM: Dynamic Model Discovery ---")
    
    api_key = os.getenv("GEMINI_API_KEY")
    genai.configure(api_key=api_key)

    # 2. Fetch all models your API key has access to
    print("Fetching available models from Google...")
    available_models = []
    try:
        for m in genai.list_models():
            # We only want models that support "generateContent" 
            # and aren't specialized for embedding or vision only
            if 'generateContent' in m.supported_generation_methods:
                if 'gemini' in m.name:
                    available_models.append(m.name.replace('models/', ''))
    except Exception as e:
        print(f"❌ Error listing models: {e}")
        return

    print(f"✅ Found {len(available_models)} compatible models: {', '.join(available_models)}")

    # 3. Prepare Test Data
    lead = Lead.objects.first()
    program = Program.objects.first()
    if not lead or not program:
        print("❌ Error: Add a lead and a program to DB first.")
        return

    test_prompt = f"""
    Analyze Lead: {lead.first_name} (Profession: {lead.additional_data.get('profession', 'N/A')})
    For Program: {program.name}
    Return JSON ONLY: {{"score": 85, "reasoning": "text"}}
    """

    results = []

    # 4. Benchmark Loop
    for model_id in available_models:
        # Avoid experimental or legacy models if you want stability
        if "vision" in model_id or "legacy" in model_id:
            continue

        print(f"\n🚀 Testing: {model_id}")
        
        llm = ChatGoogleGenerativeAI(model=model_id, google_api_key=api_key)
        
        start = time.time()
        try:
            # We use a timeout to prevent the script from hanging on a slow model
            response = llm.invoke(test_prompt)
            duration = time.time() - start
            
            # JSON Integrity Check
            content = response.content.replace('```json', '').replace('```', '').strip()
            try:
                json.loads(content)
                format_score = "PASS"
            except:
                format_score = "FAIL"

            results.append({
                "model": model_id,
                "latency": duration,
                "json": format_score,
                "snippet": content[:50]
            })
            print(f"   ⏱️  {round(duration, 2)}s | JSON: {format_score}")
        
        except Exception as e:
            print(f"   ❌ Error: {str(e)[:50]}")

    # 5. The "Best Model" Selection Logic
    # We rank by Speed first, then ensure JSON passed
    sorted_results = sorted(results, key=lambda x: (x['json'] == 'FAIL', x['latency']))

    print("\n" + "="*60)
    print(f"{'DYNAMIC RANKING':<30} | {'LATENCY':<10} | {'JSON'}")
    print("-" * 60)
    for r in sorted_results:
        color = "✅" if r['json'] == "PASS" else "⚠️"
        print(f"{r['model']:<30} | {r['latency']:<9.2f}s | {color} {r['json']}")

    if sorted_results:
        best = sorted_results[0]
        print("\n🏆 THE WINNER FOR YOUR CRM:")
        print(f"Model ID: {best['model']}")
        print(f"Reason: Fastest response ({round(best['latency'], 2)}s) with valid JSON formatting.")
        print(f"\n👉 Update your brain/llm_config.py to use: '{best['model']}'")

if __name__ == "__main__":
    discover_and_benchmark()