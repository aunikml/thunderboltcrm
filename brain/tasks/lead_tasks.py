from crewai import Task

class LeadIntelligenceTasks:
    """
    Defines concise, actionable tasks for the AI agents.
    Optimized for high-stability by enforcing one-shot processing.
    """

    def research_task(self, agent, lead_id):
        """
        Task: Synthesize a professional profile from Lead Bank data.
        """
        return Task(
            description=f"""
            1. Use the 'get_lead_context' tool once to retrieve data for Lead ID: {lead_id}.
            2. Based ONLY on that tool output, identify the prospect's:
               - Profession/Current Role
               - Organization
               - Educational Background
               - Stated motivations for joining (found in 'additional_data').
            3. Synthesize this into a professional summary (max 2 paragraphs).
            
            IMPORTANT: Do not perform follow-up searches. Provide the answer immediately.
            """,
            expected_output="""A concise professional profile summary identifying 
            who the lead is and what their likely educational goal is.""",
            agent=agent
        )

    def ranking_task(self, agent, lead_id, program_id):
        """
        Task: Score the lead fit for a specific program.
        """
        return Task(
            description=f"""
            1. Use 'fetch_course_details' once for Program ID: {program_id}.
            2. Compare the Lead's profile (from the previous task) against the 
               curriculum, objectives, and skills of this program.
            3. Calculate a Conversion Score (0-100).
            4. MANDATORY: Use the 'update_lead_intelligence' tool immediately 
               to save the score and reasoning for Lead ID: {lead_id}.
            
            IMPORTANT: Complete this in one step. Do not perform multiple research loops.
            """,
            expected_output="""A final match score and reasoning paragraph saved 
            to the database via the tool call.""",
            agent=agent
        )

    def persona_task(self, agent, research_report):
        """
        Task: Categorize the lead into a marketing persona using the research report.
        """
        return Task(
            description=f"""
            Based ONLY on the following Research Report:
            {research_report}
            
            Identify the primary student archetype. Select exactly ONE from this list:
            - 'Career Switcher'
            - 'Promotion Hunter'
            - 'Skill Optimizer'
            - 'Academic Aspirant'
            - 'Entrepreneurial Catalyst'

            Return ONLY the name of the Persona. Do not include any explanation.
            """,
            expected_output="A single string representing the persona tag.",
            agent=agent
        )