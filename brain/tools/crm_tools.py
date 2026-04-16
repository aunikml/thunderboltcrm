from crewai.tools import tool
import json

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
                "additional_data": lead.additional_data # Crucial for Researcher agent
            })
        except Exception as e:
            return f"Error fetching lead context: {str(e)}"

    @tool("fetch_campaign_context")
    def fetch_campaign_context(campaign_id: int):
        """
        Retrieves details about a specific marketing campaign.
        Use this to understand the specific promotion context and target goals.
        """
        from campaigns.models import Campaign
        try:
            camp = Campaign.objects.get(id=campaign_id)
            return json.dumps({
                "campaign_name": camp.name,
                "target_program": camp.program.name,
                "batch": camp.batch,
                "start_date": camp.start_date
            })
        except Exception as e:
            return f"Error fetching campaign context: {str(e)}"

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

    @tool("log_agent_activity")
    def log_agent_activity(lead_id: int, agent_name: str, monologue: str, output: str):
        """Logs the agent's internal thought process for staff auditing."""
        from brain.models import AgentTaskLog
        from leads.models import Lead
        try:
            lead = Lead.objects.get(id=lead_id)
            AgentTaskLog.objects.create(
                lead=lead,
                agent_name=agent_name,
                internal_monologue=monologue,
                output_data={"raw_output": output},
                status='completed'
            )
            return "Activity logged."
        except:
            return "Logging failed."