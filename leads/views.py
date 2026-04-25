import threading
import time
import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404

# Core Model & Serializer
from .models import Lead, LeadImportBatch
from .serializers import LeadSerializer, LeadImportBatchSerializer

# Import Workflows
from brain.workflows.lead_processing_graph import lead_brain_workflow
from brain.workflows.matchmaker_graph import lead_matchmaker_workflow

logger = logging.getLogger(__name__)

class LeadImportBatchViewSet(viewsets.ModelViewSet):
    queryset = LeadImportBatch.objects.all().order_by('-created_at')
    serializer_class = LeadImportBatchSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Allow filtering by discovery status
        is_discovery = self.request.query_params.get('is_discovery')
        if is_discovery is not None:
            return self.queryset.filter(is_discovery=is_discovery.lower() == 'true')
        return self.queryset

class LeadViewSet(viewsets.ModelViewSet):
    """
    Main ViewSet for the Lead Bank.
    Supports Dual-Mode Import: 
    1. Legacy (Course-wise) 
    2. Discovery (AI Matchmaker)
    """
    queryset = Lead.objects.all().order_by('-created_at')
    serializer_class = LeadSerializer

    def get_permissions(self):
        user = self.request.user
        if not user.is_authenticated:
            return [permissions.IsAuthenticated()]
        allowed_roles = ['Lead manager', 'Manager', 'Admin']
        has_access = user.is_superuser or any(role in user.roles for role in allowed_roles)
        if has_access:
            return [permissions.IsAuthenticated()]
        return [permissions.DenyAll()]

    @action(detail=False, methods=['post'], url_path='bulk-import')
    def bulk_import(self, request):
        leads_data = request.data.get('leads', [])
        meta = request.data.get('meta', {})
        campaign_id = meta.get('campaign_id')
        program_id = meta.get('program_id') # Optional in Discovery mode
        
        if not leads_data:
            return Response({"error": "No data provided"}, status=400)

        # Discovery Mode check
        is_discovery_mode = not program_id

        new_leads_list = []
        try:
            with transaction.atomic():
                # --- 0. CREATE BATCH RECORD ---
                batch_record = LeadImportBatch.objects.create(
                    name=f"Upload {time.strftime('%Y-%m-%d %H:%M')}",
                    source_platform=meta.get('platform', 'NA'),
                    total_count=len(leads_data),
                    is_discovery=is_discovery_mode
                )

                # --- 1. SMART HEADER MAPPING ---
                for item in leads_data:
                    email = item.get('email') or item.get('Email') or item.get('email_address')
                    if not email: continue

                    full_name = item.get('name') or item.get('Name') or item.get('full_name')
                    first_name = item.get('first_name') or item.get('First Name')
                    last_name = item.get('last_name') or item.get('Last Name') or ""

                    if not first_name and full_name:
                        parts = full_name.split(' ', 1)
                        first_name = parts[0]
                        last_name = parts[1] if len(parts) > 1 else ""

                    new_leads_list.append(Lead(
                        first_name=first_name or "Unknown",
                        last_name=last_name,
                        email=email,
                        phone=item.get('phone') or item.get('Phone') or item.get('mobile') or "",
                        category=meta.get('category', 'CAMPAIGN' if is_discovery_mode else 'PARTICIPANT'),
                        platform=meta.get('platform', 'NA'),
                        program_id=program_id if program_id else None,
                        import_batch=batch_record, # LINK TO BATCH
                        batch=meta.get('batch'),
                        start_date=meta.get('start_date'),
                        additional_data=item
                    ))

                created_leads = Lead.objects.bulk_create(new_leads_list)

                # Campaign Linking
                if campaign_id:
                    from campaigns.models import Campaign, CampaignLead
                    target_campaign = get_object_or_404(Campaign, id=campaign_id)
                    campaign_links = [
                        CampaignLead(campaign=target_campaign, lead=lead, status='INITIATE')
                        for lead in created_leads
                    ]
                    CampaignLead.objects.bulk_create(campaign_links)

            # --- AUTO-TRIGGER AI (BACKGROUND THREAD) ---
            def background_intelligence_queue(leads, prog_id, camp_id, discovery):
                print(f"🌀 [AUTO-AI] Background queue started for {len(leads)} leads (Discovery: {discovery})")
                for lead in leads:
                    try:
                        if discovery:
                            # Use Matchmaker Graph
                            state = {"lead_id": lead.id, "status": "discovery-onboarding", "errors": []}
                            lead_matchmaker_workflow.invoke(state)
                        else:
                            # Use Standard Analysis Graph
                            state = {
                                "lead_id": lead.id,
                                "program_id": int(prog_id),
                                "campaign_id": int(camp_id) if camp_id else None,
                                "lead_data": None, "program_data": None, "web_enrichment": None,
                                "analysis_results": None, "creative_results": None,
                                "status": "auto-process", "errors": []
                            }
                            lead_brain_workflow.invoke(state)
                        time.sleep(3) # Safe pacing for 2026 quotas
                    except Exception as e:
                        print(f"⚠️ [AUTO-AI] Skip lead {lead.id} due to error: {e}")

            threading.Thread(
                target=background_intelligence_queue, 
                args=(created_leads, program_id, campaign_id, is_discovery_mode),
                daemon=True
            ).start()

            msg = f"Successfully imported {len(created_leads)} leads."
            if is_discovery_mode:
                msg += " AI Matchmaker is now finding the best courses for them."
            else:
                msg += " AI analysis has started for the selected course."

            return Response({"message": msg, "count": len(created_leads)}, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Import Error: {str(e)}")
            return Response({"error": f"Internal Error: {str(e)}"}, status=500)