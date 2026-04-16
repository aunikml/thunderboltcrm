import json
import time
import logging
from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END

# Direct high-speed imports
from brain.llm_config import get_langchain_llm
from brain.tools.crm_tools import CRMToolbox

logger = logging.getLogger(__name__)

# --- 1. STATE SCHEMA ---
class AgentState(TypedDict):
    """
    State for the ultra-fast lightning workflow.
    """
    lead_id: int
    program_id: int
    campaign_id: Optional[int]
    status: str

# --- 2. HELPER: ROBUST TEXT EXTRACTION ---
def extract_text(response_content):
    """Ensures Gemini output is a clean string, even if returned as a list of blocks."""
    if isinstance(response_content, list):
        return " ".join([part.get('text', '') if isinstance(part, dict) else str(part) for part in response_content])
    return str(response_content)

# --- 3. THE LIGHTNING ENGINE NODE ---

def lightning_engine_node(state: AgentState):
    """
    ONE-SHOT INFERENCE ENGINE:
    Bypasses CrewAI overhead and multi-node delays.
    1. Fetches all context (Lead + Program) in parallel.
    2. Executes one 'Chain of Thought' prompt to Gemini 3.
    3. Saves all results to DB in one transaction.
    """
    print(f"⚡ [LIGHTNING-BRAIN] Analyzing Lead ID: {state['lead_id']}")
    start_time = time.time()

    try:
        # --- STEP A: PARALLEL DATA FETCH ---
        # Fetching context directly from DB using tools
        lead_json = CRMToolbox.get_lead_context.run(lead_id=state['lead_id'])
        course_json = CRMToolbox.fetch_course_details.run(program_id=state['program_id'])

        # --- STEP B: SINGLE-CALL ADMISSIONS LOGIC ---
        llm = get_langchain_llm()
        
        # We combine Research, Ranking, Persona, and Scripting into one "Admissions Officer" prompt
        mega_prompt = f"""
        ACT AS: A Senior University Admissions Strategist.
        
        CONTEXT:
        PROSPECT: {lead_json}
        PROGRAM: {course_json}

        TASK: 
        Perform a deep match analysis between the prospect and the program.
        1. Calculate Conversion Score (0-100).
        2. Assign ONE Persona: 'Career Switcher', 'Promotion Hunter', 'Skill Optimizer', 'Academic Aspirant'.
        3. Write 2 sentences of strategic reasoning.
        4. Draft a 3-minute high-conversion sales call script (Hook, Discovery, Value, CTA).

        OUTPUT FORMAT: You MUST return a raw JSON object ONLY. No markdown, no filler text.
        {{
            "score": int,
            "persona": "string",
            "reasoning": "string",
            "script": "string"
        }}
        """
        
        # Immediate direct inference (Gemini 3 Flash Preview)
        response = llm.invoke(mega_prompt)
        raw_output = extract_text(response.content).strip()
        
        # Clean potential markdown wrapping
        clean_json = raw_output.replace('```json', '').replace('```', '').strip()
        intel = json.loads(clean_json)

        # --- STEP C: UNIFIED DATABASE SYNC ---
        # Save to central Lead Intelligence
        CRMToolbox.update_lead_intelligence.run(
            lead_id=state['lead_id'],
            score=intel['score'],
            persona=intel['persona'],
            reasoning=intel['reasoning'],
            script=intel['script']
        )
        
        # If campaign context exists, update the specific workspace table
        if state.get('campaign_id'):
            CRMToolbox.update_campaign_workspace.run(
                campaign_id=int(state['campaign_id']),
                lead_id=state['lead_id'],
                score=intel['score'],
                persona=intel['persona']
            )

        print(f"✅ [SUCCESS] AI Analysis ready in {round(time.time() - start_time, 2)}s")
        return {"status": "completed"}

    except Exception as e:
        logger.error(f"❌ [LIGHTNING-BRAIN FAILED] {str(e)}")
        return {"status": "failed"}

# --- 4. ASSEMBLE THE WORKFLOW ---

def create_lightning_workflow():
    """
    Compiles a single-node graph. 
    This eliminates the 1-2 seconds of 'node-switching' overhead in LangGraph.
    """
    workflow = StateGraph(AgentState)

    # All intelligence happens in one powerful step
    workflow.add_node("engine", lightning_engine_node)

    workflow.set_entry_point("engine")
    workflow.add_edge("engine", END)

    return workflow.compile()

# Access point for Django Views
lead_brain_workflow = create_lightning_workflow()