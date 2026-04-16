import threading
import time
import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.shortcuts import get_object_or_404

# Core Model & Serializer
from .models import Lead
from .serializers import LeadSerializer

# Import the Workflow for Auto-Triggering Intelligence
from brain.workflows.lead_processing_graph import lead_brain_workflow

logger = logging.getLogger(__name__)

class LeadViewSet(viewsets.ModelViewSet):
    """
    Main ViewSet for the Lead Bank.
    Handles CRUD, High-Performance Bulk Imports, and Auto-AI triggering.
    """
    queryset = Lead.objects.all().order_by('-created_at')
    serializer_class = LeadSerializer

    def get_permissions(self):
        """
        Enforce RBAC: Only Lead Manager, Manager, and Admin can access.
        """
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
        """
        1. Normalizes CSV headers.
        2. Bulk inserts into Lead Bank.
        3. Links leads to Campaign Workspace (if provided).
        4. AUTO-TRIGGER: Starts AI analysis immediately in the background.
        """
        leads_data = request.data.get('leads', [])
        meta = request.data.get('meta', {})
        campaign_id = meta.get('campaign_id')
        program_id = meta.get('program_id')
        
        if not leads_data:
            return Response({"error": "No data provided"}, status=400)
        if not program_id:
            return Response({"error": "Program ID is required for context mapping."}, status=400)

        new_leads_list = []
        
        try:
            with transaction.atomic():
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
                        category=meta.get('category', 'PARTICIPANT'),
                        platform=meta.get('platform', 'NA'),
                        program_id=program_id,
                        batch=meta.get('batch'),
                        start_date=meta.get('start_date'),
                        additional_data=item
                    ))

                # --- 2. EXECUTE BULK CREATE ---
                created_leads = Lead.objects.bulk_create(new_leads_list)

                # --- 3. CAMPAIGN LINKING ---
                if campaign_id:
                    from campaigns.models import Campaign, CampaignLead
                    target_campaign = get_object_or_404(Campaign, id=campaign_id)
                    campaign_links = [
                        CampaignLead(campaign=target_campaign, lead=lead, status='INITIATE')
                        for lead in created_leads
                    ]
                    CampaignLead.objects.bulk_create(campaign_links)

            # --- 4. AUTO-TRIGGER AI (BACKGROUND THREAD) ---
            def background_intelligence_queue(leads, prog_id, camp_id):
                print(f"🌀 [AUTO-AI] Background queue started for {len(leads)} leads...")
                for lead in leads:
                    try:
                        state = {
                            "lead_id": lead.id,
                            "program_id": int(prog_id),
                            "campaign_id": int(camp_id) if camp_id else None,
                            "status": "auto-process"
                        }
                        # Invoke the high-speed Lightning workflow
                        lead_brain_workflow.invoke(state)
                        # Minimal pace (2 seconds) to keep GCP burst limits safe
                        time.sleep(2) 
                    except Exception as e:
                        print(f"⚠️ [AUTO-AI] Skip lead {lead.id} due to error: {e}")

            # Fire and forget
            threading.Thread(
                target=background_intelligence_queue, 
                args=(created_leads, program_id, campaign_id),
                daemon=True
            ).start()

            return Response({
                "message": f"Successfully imported {len(created_leads)} leads. AI analysis has started in the background.",
                "count": len(created_leads)
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"Internal Error: {str(e)}"}, status=500)