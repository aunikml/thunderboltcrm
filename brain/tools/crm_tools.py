from langchain_core.tools import tool
import json
import random

class CRMToolbox:
    
    @tool("fetch_course_details")
    def fetch_course_details(program_id: int):
        """
        Retrieves full details of an academic program or short course.
        Provides curriculum, learning outcomes, and requirements to help match a lead.
        """
        from courses.models import Program # Local import to prevent circularity
        try:
            program = Program.objects.get(id=program_id)
            details = {
                "name": program.name,
                "category": program.get_program_type_display(),
                "language": program.language,
                "overview": program.overview,
                "duration": program.duration_tuition_fee,
            }

            # Map fields based on whether it is a Short Course or Postgrad
            if program.program_type == 'SHORT':
                details.update({
                    "objectives": program.objectives,
                    "knowledge_covered": program.knowledge,
                    "skills_gained": program.skills_competencies,
                    "target_audience": program.target_audience,
                    "topics": program.topics,
                    "sessions": program.number_of_sessions
                })
            else:
                details.update({
                    "degree_type": program.get_degree_type_display(),
                    "about": program.about_programme,
                    "objectives": program.objectives,
                    "structure": program.program_structure,
                    "assessment": program.assessment_details,
                    "admission_requirements": program.admission_requirements,
                    "career_prospects": program.career_prospects,
                    "modules": list(program.modules.values('name', 'description'))
                })
            
            return json.dumps(details)
        except Exception as e:
            return f"Error fetching course details: {str(e)}"

    @tool("get_lead_context")
    def get_lead_context(lead_id: int):
        """
        Retrieves the professional profile and background for a specific lead.
        The 'additional_data' field contains custom CSV columns like Profession and Organization.
        """
        from leads.models import Lead
        try:
            lead = Lead.objects.get(id=lead_id)
            return json.dumps({
                "first_name": lead.first_name,
                "last_name": lead.last_name,
                "email": lead.email,
                "category": lead.get_category_display(),
                "batch": lead.batch,
                "platform": lead.get_platform_display(),
                "additional_data": lead.additional_data
            })
        except Exception as e:
            return f"Error fetching lead context: {str(e)}"

    @tool("fetch_web_enrichment")
    def fetch_web_enrichment(organization_name: str):
        """
        Simulates 2026-level web intelligence to find recent company news 
        or professional signals for a lead's organization.
        """
        # In a real 2026 system, this would call a real-time search API.
        # For now, we simulate high-value insights.
        insights = [
            f"{organization_name} recently announced a major expansion into AI-driven services.",
            f"Recent financial reports for {organization_name} show a 15% increase in R&D budget.",
            f"{organization_name} is currently hiring for multiple leadership roles in digital transformation.",
            f"Industry news suggests {organization_name} is pivoting towards sustainable energy solutions."
        ]
        return random.choice(insights)

    @tool("update_lead_intelligence")
    def update_lead_intelligence(lead_id: int, score: int = None, persona: str = None, reasoning: str = None, script: str = None):
        """
        Saves findings to the central Brain (LeadIntelligence table).
        This tool only updates provided fields, keeping existing data safe.
        """
        from brain.models import LeadIntelligence
        from leads.models import Lead
        try:
            lead = Lead.objects.get(id=lead_id)
            intel, _ = LeadIntelligence.objects.get_or_create(lead=lead)
            
            if score is not None: intel.score = score
            if persona is not None: intel.persona_tag = persona
            if reasoning is not None: intel.suggested_approach = reasoning
            if script is not None: intel.generated_script = script
            
            intel.save()
            return f"Successfully updated central intelligence for {lead.email}."
        except Exception as e:
            return f"Central DB update failed: {str(e)}"

    @tool("update_campaign_workspace")
    def update_campaign_workspace(campaign_id: int, lead_id: int, score: int, persona: str):
        """
        Updates the specific campaign workspace table (Propensity and Persona).
        MANDATORY: Use this in campaign-mode so the manager sees scores in the table.
        """
        from campaigns.models import CampaignLead
        try:
            # Update the specific junction record for this campaign and lead
            entry = CampaignLead.objects.get(campaign_id=campaign_id, lead_id=lead_id)
            entry.ai_score = score
            entry.ai_persona = persona
            entry.save()
            return f"Workspace updated: Lead {lead_id} now has {score}% propensity."
        except Exception as e:
            return f"Workspace update failed: {str(e)}"

    @tool("get_organization_context")
    def get_organization_context(org_id: int):
        """
        Retrieves the strategic profile of an organization.
        Includes identity, thematic areas, challenges, and funding status.
        """
        from b2b.models import Organization
        try:
            org = Organization.objects.get(id=org_id)
            return json.dumps({
                "id": org.id,
                "name": org.name,
                "type": org.get_org_type_display(),
                "academic_levels": org.academic_levels,
                "country": org.country,
                "hq": org.hq_location,
                "size": org.size_range,
                "beneficiaries": org.beneficiary_reach,
                "thematic_areas": org.thematic_areas,
                "strategic_priorities": org.strategic_priorities,
                "challenges": org.challenges,
                "capacity_gaps": org.capacity_gaps,
                "funding": org.get_funding_status_display()
            })
        except Exception as e:
            return f"Error fetching org context: {str(e)}"

    @tool("save_b2b_match")
    def save_b2b_match(org_id: int, program_id: int, score: int, strategy: str, pointers: list, reasoning: str):
        """
        Saves the AI-generated matchmaking results for an organization.
        """
        from b2b.models import B2BMatch
        try:
            match, _ = B2BMatch.objects.get_or_create(organization_id=org_id, program_id=program_id)
            match.propensity_score = score
            match.campaign_strategy = strategy
            match.pitching_pointers = pointers
            match.match_reasoning = reasoning
            match.save()
            return f"Match saved for {org_id} -> {program_id}"
        except Exception as e:
            return f"Error saving B2B match: {str(e)}"

    @tool("log_activity")
    def log_activity(lead_id: int, stage_name: str, monologue: str, output: str):
        """Logs the internal thought process for staff auditing (2026 Optimized)."""
        from brain.models import AgentTaskLog
        from leads.models import Lead
        try:
            lead = Lead.objects.get(id=lead_id)
            AgentTaskLog.objects.create(
                lead=lead,
                agent_name=stage_name,
                internal_monologue=monologue,
                output_data={"raw_output": output},
                status='completed'
            )
            return "Stage activity logged."
        except:
            return "Logging failed."