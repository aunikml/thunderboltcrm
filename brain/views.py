import threading
import traceback
import logging
import time
from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

# Model and Serializer imports
from leads.models import Lead
from brain.models import LeadIntelligence, AgentTaskLog
from brain.serializers import LeadIntelligenceSerializer
from brain.workflows.lead_processing_graph import lead_brain_workflow

logger = logging.getLogger(__name__)

# Helper to prevent circular imports between Brain and Campaigns apps
def get_campaign_models():
    from campaigns.models import Campaign, CampaignLead
    return Campaign, CampaignLead

class TriggerLeadAnalysisView(views.APIView):
    """
    POST /api/brain/analyze/<lead_id>/
    Manually triggers the Agentic Workflow for a specific lead.
    Supports an optional ?campaign_id=N query parameter for context.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, lead_id):
        lead = get_object_or_404(Lead, id=lead_id)
        
        # Check if we are in a campaign context
        campaign_id = request.query_params.get('campaign_id') or request.data.get('campaign_id')
        target_program = None

        if campaign_id:
            Campaign, _ = get_campaign_models()
            campaign = get_object_or_404(Campaign, id=campaign_id)
            target_program = campaign.program
        else:
            target_program = lead.program

        if not target_program:
            return Response(
                {"error": "Analysis requires an associated program. Link this lead first."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Worker for single execution
        def run_single():
            try:
                initial_state = {
                    "lead_id": lead.id,
                    "program_id": target_program.id,
                    "campaign_id": campaign_id,
                    "score": 0, "persona": "", "research_report": "",
                    "generated_script": "", "status": "started"
                }
                lead_brain_workflow.invoke(initial_state)
            except Exception as e:
                logger.error(f"Single workflow error: {str(e)}")

        threading.Thread(target=run_single, daemon=True).start()
        return Response({"status": "processing", "message": "Lead analysis started."}, status=202)


class BulkAnalyzeCampaignLeadsView(views.APIView):
    """
    POST /api/brain/analyze-campaign/<campaign_id>/
    The 'Hands-Free' Auto-Trigger:
    Finds all leads in a campaign with a 0 score and processes them
    one-by-one in a sequential background thread.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, campaign_id):
        Campaign, CampaignLead = get_campaign_models()
        campaign = get_object_or_404(Campaign, id=campaign_id)

        # Identify only the leads that haven't been processed yet
        unranked_entries = CampaignLead.objects.filter(campaign=campaign, ai_score=0)

        if not unranked_entries.exists():
            return Response({"status": "complete", "message": "All leads in this campaign are already ranked."})

        # --- SEQUENTIAL PACED WORKER ---
        def sequential_paced_worker(entries_list):
            print(f"\n🚀 [BULK QUEUE] Starting sequential analysis for {len(entries_list)} leads in '{campaign.name}'")
            
            for entry in entries_list:
                try:
                    # Refresh the object to ensure another thread hasn't finished it
                    entry.refresh_from_db()
                    if entry.ai_score > 0:
                        continue

                    print(f"--- [QUEUE] Processing: {entry.lead.email} ---")
                    
                    # Prepare state for the target program of the campaign
                    initial_state = {
                        "lead_id": entry.lead.id,
                        "program_id": campaign.program.id,
                        "campaign_id": campaign.id,
                        "score": 0, "persona": "", "research_report": "",
                        "generated_script": "", "status": "started"
                    }
                    
                    # Execute LangGraph (this calls CrewAI + Gemini)
                    lead_brain_workflow.invoke(initial_state)
                    
                    # MANDATORY PACE: Wait between leads.
                    # Even on Paid GCP, rapid requests can trigger temporary 503 blocks.
                    print(f"✅ Lead complete. Pacing 7 seconds for stability...")
                    time.sleep(7) 
                    
                except Exception as e:
                    print(f"❌ [QUEUE ERROR] Lead {entry.lead.id} failed: {str(e)}")
                    # Log the failure for the admin console
                    AgentTaskLog.objects.create(
                        lead=entry.lead,
                        agent_name="RESEARCH",
                        status="failed",
                        internal_monologue=f"Bulk Chain Error: {str(e)}"
                    )
                    time.sleep(3) # Short cooldown before next attempt

            print(f"🏁 [BULK QUEUE] Sequential processing finished for campaign: {campaign.name}\n")

        # Launch the single-thread loop
        # list() is used to evaluate the queryset immediately
        thread = threading.Thread(target=sequential_paced_worker, args=(list(unranked_entries),), daemon=True)
        thread.start()

        return Response({
            "status": "processing",
            "message": f"Sequential AI ranking initiated for {unranked_entries.count()} leads.",
            "mode": "one-by-one"
        }, status=status.HTTP_202_ACCEPTED)


class LeadIntelligenceDetailView(views.APIView):
    """
    GET /api/brain/intelligence/<lead_id>/
    Retrieves the latest AI results. Used by React Sidebar for polling.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, lead_id):
        intelligence = LeadIntelligence.objects.filter(lead_id=lead_id).first()
        latest_log = AgentTaskLog.objects.filter(lead_id=lead_id, agent_name="RESEARCH").order_by('-created_at').first()

        # Case 1: No data exists yet
        if not intelligence:
            if latest_log and latest_log.status == 'failed':
                return Response({"status": "failed", "message": "The AI agents encountered an error."}, status=200)
            return Response({"status": "processing", "message": "Agents are researching..."}, status=200)

        # Case 2: Data exists
        serializer = LeadIntelligenceSerializer(intelligence)
        data = serializer.data
        
        # Determine status: completed once a script or score is fully finalized
        if intelligence.generated_script:
            data['status'] = 'completed'
        elif latest_log and latest_log.status == 'failed':
            data['status'] = 'failed'
        else:
            data['status'] = 'processing'

        return Response(data, status=status.HTTP_200_OK)