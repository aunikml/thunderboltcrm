from crewai import Agent
from brain.llm_config import get_gemini_llm
from brain.tools.crm_tools import CRMToolbox

# This retrieves the native CrewAI LLM object configured for Gemini 3 Flash Preview
gemini_llm = get_gemini_llm()

class SalesIntelligenceAgents:
    """
    Defines the specialized AI personnel for the Thunderbolt CRM.
    Optimized for Gemini 3 and high-stability on GCP Paid Tier.
    """

    def lead_researcher_agent(self):
        """
        Agent: Lead Context Researcher
        Mission: Perform a single-pass extraction of all professional data.
        Stability: max_rpm=5 and max_iter=1 to prevent 503 High Demand errors.
        """
        return Agent(
            role='Lead Context Researcher',
            goal='Synthesize a concise professional profile from raw Lead Bank data in ONE pass.',
            backstory="""You are a direct and efficient data investigator. Your job is to 
            read the raw lead information provided by the tools and identify the 
            key facts: current job, company, education, and motivations. 
            You provide a factual summary for the admissions team. You do not over-analyze.""",
            tools=[CRMToolbox.get_lead_context],
            llm=gemini_llm,
            verbose=True,
            # --- STABILITY & BURST PROTECTION ---
            allow_delegation=False, # No agent cross-talk to keep API calls low
            memory=False,           # Disable vector memory to prevent OpenAI key requirement
            max_rpm=5,              # Pacing: 1 request every 12 seconds
            max_iter=1,             # Force a one-shot response to prevent thought-loops
            max_execution_time=60,  # Ensure the process doesn't hang
            cache=True
        )

    # Note: Ranking, Persona, and Script agents have been converted to 
    # Direct LangGraph Nodes in lead_processing_graph.py for 100% stability 
    # on Gemini 3 Burst Quotas.