import json
import time
import logging
from typing import TypedDict, Optional, Dict, Any
from langgraph.graph import StateGraph, END

# Direct high-speed imports
from brain.llm_config import get_langchain_llm
from brain.tools.crm_tools import CRMToolbox
from brain.utils import get_agent_instructions

logger = logging.getLogger(__name__)

# --- 1. STATE SCHEMA ---
class AgentState(TypedDict):
    """
    Enhanced state for the 2026 multi-node workflow.
    Ensures accuracy through structured data hand-offs.
    """
    lead_id: int
    program_id: int
    campaign_id: Optional[int]
    
    # Context Data
    lead_data: Optional[Dict[Any, Any]]
    program_data: Optional[Dict[Any, Any]]
    web_enrichment: Optional[str]
    
    # AI Analysis Results
    analysis_results: Optional[Dict[Any, Any]]
    creative_results: Optional[Dict[Any, Any]]
    
    status: str
    errors: list

# --- 2. HELPER: ROBUST TEXT EXTRACTION ---
def extract_text(response_content):
    """Ensures Gemini output is a clean string."""
    if isinstance(response_content, list):
        return " ".join([part.get('text', '') if isinstance(part, dict) else str(part) for part in response_content])
    return str(response_content)

def clean_json_response(raw_output):
    """Cleans markdown wrapping and parses JSON."""
    clean = raw_output.replace('```json', '').replace('```', '').strip()
    return json.loads(clean)

# --- 3. NODES ---

def context_assembler_node(state: AgentState):
    """
    NODE 1: CONTEXT ASSEMBLER
    """
    print(f"[STAGE 1] Gathering Context for Lead ID: {state['lead_id']}")
    try:
        lead_json = CRMToolbox.get_lead_context.invoke({"lead_id": state['lead_id']})
        course_json = CRMToolbox.fetch_course_details.invoke({"program_id": state['program_id']})
        
        lead_data = json.loads(lead_json)
        program_data = json.loads(course_json)
        
        org_name = lead_data.get('additional_data', {}).get('Organization', 'Unknown')
        web_enrichment = CRMToolbox.fetch_web_enrichment.invoke({"organization_name": org_name})
        
        return {
            "lead_data": lead_data,
            "program_data": program_data,
            "web_enrichment": web_enrichment,
            "status": "context_ready"
        }
    except Exception as e:
        logger.error(f"Context Assembler Error: {str(e)}")
        return {"status": "failed", "errors": state.get('errors', []) + [f"Context Assembler Error: {str(e)}"]}

def deep_analyzer_node(state: AgentState):
    """
    NODE 2: DEEP ANALYZER
    """
    if state.get('status') == 'failed': return state

    print(f"[STAGE 2] Analyzing Match for {state['lead_data']['email']}")
    try:
        llm = get_langchain_llm()
        base_instructions = get_agent_instructions('deep-analyzer')
        
        prompt = f"""
        {base_instructions}
        
        DATA:
        LEAD: {state['lead_data']}
        PROGRAM: {state['program_data']}
        WEB SIGNALS: {state['web_enrichment']}
        
        IMPORTANT: Your output MUST be in JSON format as specified in your instructions.
        """
        
        response = llm.invoke(prompt)
        results = clean_json_response(extract_text(response.content))
        
        CRMToolbox.log_activity.invoke({
            "lead_id": state['lead_id'],
            "stage_name": "STRATEGIC_ANALYSIS",
            "monologue": "Performing deep match analysis.",
            "output": json.dumps(results)
        })
        
        return {"analysis_results": results, "status": "analysis_ready"}
    except Exception as e:
        logger.error(f"Deep Analyzer Error: {str(e)}")
        return {"status": "failed", "errors": state.get('errors', []) + [f"Deep Analyzer Error: {str(e)}"]}

def sales_script_architect_node(state: AgentState):
    """
    NODE 3: SALES SCRIPT ARCHITECT
    """
    if state.get('status') == 'failed': return state

    print(f"[STAGE 3] Architecting Sales Script")
    try:
        llm = get_langchain_llm()
        base_instructions = get_agent_instructions('script-architect')
        
        prompt = f"""
        {base_instructions}
        
        CONTEXT:
        LEAD: {state['lead_data']}
        ANALYSIS: {state['analysis_results']}
        
        IMPORTANT: Your output MUST be in JSON format as specified in your instructions.
        """
        
        response = llm.invoke(prompt)
        results = clean_json_response(extract_text(response.content))
        
        CRMToolbox.log_activity.invoke({
            "lead_id": state['lead_id'],
            "stage_name": "SCRIPT_GENERATION",
            "monologue": "Generating personalized sales script.",
            "output": json.dumps(results)
        })
        
        return {"creative_results": results, "status": "creative_ready"}
    except Exception as e:
        logger.error(f"Script Architect Error: {str(e)}")
        return {"status": "failed", "errors": state.get('errors', []) + [f"Script Architect Error: {str(e)}"]}

def db_writer_node(state: AgentState):
    """
    NODE 4: DB WRITER
    """
    if state.get('status') == 'failed': return state

    print(f"[STAGE 4] Saving Results for {state['lead_id']}")
    try:
        # Final safety check
        if not state.get('analysis_results') or not state.get('creative_results'):
            raise ValueError("Missing analysis or creative results for DB save.")

        CRMToolbox.update_lead_intelligence.invoke({
            "lead_id": state['lead_id'],
            "score": state['analysis_results']['score'],
            "reasoning": state['analysis_results']['reasoning'],
            "persona": state['creative_results']['persona'],
            "script": state['creative_results']['script']
        })
        
        if state.get('campaign_id'):
            CRMToolbox.update_campaign_workspace.invoke({
                "campaign_id": int(state['campaign_id']),
                "lead_id": state['lead_id'],
                "score": state['analysis_results']['score'],
                "persona": state['creative_results']['persona']
            })
            
        return {"status": "completed"}
    except Exception as e:
        logger.error(f"DB Writer Error: {str(e)}")
        return {"status": "failed", "errors": state.get('errors', []) + [f"DB Writer Error: {str(e)}"]}

# --- 4. ASSEMBLE THE WORKFLOW ---

def create_lightning_workflow():
    workflow = StateGraph(AgentState)

    workflow.add_node("context", context_assembler_node)
    workflow.add_node("analyze", deep_analyzer_node)
    workflow.add_node("creative", sales_script_architect_node)
    workflow.add_node("save", db_writer_node)

    workflow.set_entry_point("context")
    workflow.add_edge("context", "analyze")
    workflow.add_edge("analyze", "creative")
    workflow.add_edge("creative", "save")
    workflow.add_edge("save", END)

    return workflow.compile()

lead_brain_workflow = create_lightning_workflow()