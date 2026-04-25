import json
import logging
from typing import TypedDict, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END

# Direct imports
from brain.llm_config import get_langchain_llm
from brain.tools.crm_tools import CRMToolbox
from brain.tools.catalog_tools import CatalogToolbox
from brain.utils import get_agent_instructions

logger = logging.getLogger(__name__)

# --- 1. STATE SCHEMA ---
class B2BState(TypedDict):
    org_id: int
    org_data: Optional[Dict[Any, Any]]
    catalog_data: Optional[List[Dict[Any, Any]]]
    
    matches: Optional[List[Dict[Any, Any]]] # List of {program_id, score, strategy, pointers, reasoning}
    
    status: str
    errors: List[str]

# --- 2. NODES ---

def org_analyzer_node(state: B2BState):
    """Fetches organization strategic profile and catalog."""
    print(f"[B2B-AI] Analyzing Organization ID: {state['org_id']}")
    try:
        org_json = CRMToolbox.get_organization_context.invoke({"org_id": state['org_id']})
        catalog_json = CatalogToolbox.fetch_program_catalog.invoke({})
        
        return {
            "org_data": json.loads(org_json),
            "catalog_data": json.loads(catalog_json),
            "status": "data_loaded"
        }
    except Exception as e:
        return {"status": "failed", "errors": [f"Analyzer Error: {str(e)}"]}

def b2b_strategy_architect_node(state: B2BState):
    """Matches org needs to courses and generates strategic output."""
    print(f"[B2B-AI] Architecting Strategy for {state['org_data']['name']}")
    try:
        llm = get_langchain_llm()
        base_instructions = get_agent_instructions('b2b-architect')
        
        prompt = f"""
        {base_instructions}
        
        ORGANIZATION PROFILE:
        {state['org_data']}
        
        ACADEMIC CATALOG:
        {state['catalog_data']}
        
        IMPORTANT: Your output MUST be in JSON format as specified in your instructions.
        """
        
        response = llm.invoke(prompt)
        raw_output = response.content.replace('```json', '').replace('```', '').strip()
        results = json.loads(raw_output)
        
        return {
            "matches": results['matches'],
            "status": "matches_generated"
        }
    except Exception as e:
        return {"status": "failed", "errors": [f"Architect Error: {str(e)}"]}

def b2b_onboarder_node(state: B2BState):
    """Saves findings to the database."""
    print(f"[B2B-AI] Saving {len(state['matches'])} matches for Org: {state['org_id']}")
    try:
        for match in state['matches']:
            CRMToolbox.save_b2b_match.invoke({
                "org_id": state['org_id'],
                "program_id": match['program_id'],
                "score": match['propensity_score'],
                "strategy": match['campaign_strategy'],
                "pointers": match['pitching_pointers'],
                "reasoning": match['reasoning']
            })
        return {"status": "completed"}
    except Exception as e:
        return {"status": "failed", "errors": [f"Onboarder Error: {str(e)}"]}

# --- 3. ASSEMBLE ---

def create_b2b_workflow():
    workflow = StateGraph(B2BState)

    workflow.add_node("analyze", org_analyzer_node)
    workflow.add_node("architect", b2b_strategy_architect_node)
    workflow.add_node("onboard", b2b_onboarder_node)

    workflow.set_entry_point("analyze")
    workflow.add_edge("analyze", "architect")
    workflow.add_edge("architect", "onboard")
    workflow.add_edge("onboard", END)

    return workflow.compile()

b2b_matchmaker_workflow = create_b2b_workflow()
