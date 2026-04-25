import json
import logging
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END

# Direct imports
from brain.llm_config import get_langchain_llm
from brain.tools.crm_tools import CRMToolbox
from brain.tools.catalog_tools import CatalogToolbox
from brain.workflows.lead_processing_graph import lead_brain_workflow
from brain.utils import get_agent_instructions

logger = logging.getLogger(__name__)

# --- 1. STATE SCHEMA ---
class MatchmakerState(TypedDict):
    lead_id: int
    lead_data: Optional[Dict[Any, Any]]
    catalog_data: Optional[List[Dict[Any, Any]]]
    
    # Matching Results
    top_matches: Optional[List[Dict[Any, Any]]]
    selected_program_id: Optional[int]
    reasoning: Optional[str]
    
    status: str
    errors: List[str]

# --- 2. NODES ---

def catalog_scanner_node(state: MatchmakerState):
    """Fetches lead data and the full program catalog."""
    print(f"[MATCHMAKER] Scanning Catalog for Lead ID: {state['lead_id']}")
    try:
        lead_json = CRMToolbox.get_lead_context.invoke({"lead_id": state['lead_id']})
        catalog_json = CatalogToolbox.fetch_program_catalog.invoke({})
        
        return {
            "lead_data": json.loads(lead_json),
            "catalog_data": json.loads(catalog_json),
            "status": "data_ready"
        }
    except Exception as e:
        return {"status": "failed", "errors": [f"Scanner Error: {str(e)}"]}

def matchmaking_engine_node(state: MatchmakerState):
    """AI logic to pair the lead with the best course."""
    print(f"[MATCHMAKER] Matching {state['lead_data']['email']} to best programs")
    try:
        llm = get_langchain_llm()
        
        base_instructions = get_agent_instructions('matchmaker')
        
        prompt = f"""
        {base_instructions}
        
        PROSPECT DATA:
        {state['lead_data']}
        
        COURSE CATALOG:
        {state['catalog_data']}
        
        IMPORTANT: Your output MUST be in JSON format as specified in your instructions.
        """
        
        response = llm.invoke(prompt)
        raw_output = response.content.replace('```json', '').replace('```', '').strip()
        results = json.loads(raw_output)
        
        return {
            "top_matches": results['top_matches'],
            "selected_program_id": results['selected_id'],
            "reasoning": results['reasoning'],
            "status": "matched"
        }
    except Exception as e:
        return {"status": "failed", "errors": [f"Matchmaking Error: {str(e)}"]}

def onboarder_node(state: MatchmakerState):
    """Updates the Lead record and kicks off the main analysis graph."""
    print(f"[MATCHMAKER] Onboarding Lead to Program ID: {state['selected_program_id']}")
    try:
        from leads.models import Lead
        from courses.models import Program
        
        lead = Lead.objects.get(id=state['lead_id'])
        program = Program.objects.get(id=state['selected_program_id'])
        
        # 1. Update Lead with the discovered program
        lead.program = program
        lead.save()
        
        # 2. Log the matchmaking activity
        CRMToolbox.log_activity.invoke({
            "lead_id": state['lead_id'],
            "stage_name": "AI_MATCHMAKER",
            "monologue": f"AI selected '{program.name}' based on career profile.",
            "output": state['reasoning']
        })
        
        # 3. TRIGGER THE PRIMARY ANALYSIS (Lightning Workflow)
        # We pass the newly discovered program ID
        analysis_state = {
            "lead_id": lead.id,
            "program_id": program.id,
            "campaign_id": None,
            "lead_data": None, "program_data": None, "web_enrichment": None,
            "analysis_results": None, "creative_results": None,
            "status": "started", "errors": []
        }
        lead_brain_workflow.invoke(analysis_state)
        
        return {"status": "completed"}
    except Exception as e:
        return {"status": "failed", "errors": [f"Onboarder Error: {str(e)}"]}

# --- 3. ASSEMBLE THE GRAPH ---

def create_matchmaker_workflow():
    workflow = StateGraph(MatchmakerState)

    workflow.add_node("scan", catalog_scanner_node)
    workflow.add_node("match", matchmaking_engine_node)
    workflow.add_node("onboard", onboarder_node)

    workflow.set_entry_point("scan")
    workflow.add_edge("scan", "match")
    workflow.add_edge("match", "onboard")
    workflow.add_edge("onboard", END)

    return workflow.compile()

lead_matchmaker_workflow = create_matchmaker_workflow()
