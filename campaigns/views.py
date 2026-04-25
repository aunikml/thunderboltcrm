from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Campaign, CampaignLead
from .serializers import CampaignSerializer, CampaignLeadSerializer
from leads.models import Lead
from leads.serializers import LeadSerializer

class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all().order_by('-created_at')
    serializer_class = CampaignSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['get'], url_path='potential-matches')
    def get_potential_matches(self, request, pk=None):
        """
        Identifies leads in the Lead Bank that match this campaign's course
        but are NOT yet in this campaign.
        """
        campaign = self.get_object()
        
        # 1. Get IDs of leads already in this campaign
        existing_lead_ids = CampaignLead.objects.filter(campaign=campaign).values_list('lead_id', flat=True)
        
        # 2. Filter Lead Bank for leads matching the program, excluding existing ones
        potential_leads = Lead.objects.filter(
            program=campaign.program
        ).exclude(id__in=existing_lead_ids)
        
        serializer = LeadSerializer(potential_leads, many=True)
        return Response(serializer.data)

class CampaignLeadViewSet(viewsets.ModelViewSet):
    queryset = CampaignLead.objects.all()
    serializer_class = CampaignLeadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filter leads based on the campaign ID passed in the URL
        campaign_id = self.request.query_params.get('campaign_id')
        if campaign_id:
            return self.queryset.filter(campaign_id=campaign_id)
        return self.queryset

    @action(detail=False, methods=['post'], url_path='import-from-leads')
    def import_from_leads(self, request):
        """
        Allows importing existing leads from the Lead Bank into a Campaign.
        """
        campaign_id = request.data.get('campaign_id')
        lead_ids = request.data.get('lead_ids', [])
        
        campaign = Campaign.objects.get(id=campaign_id)
        
        created_count = 0
        for lid in lead_ids:
            lead = Lead.objects.get(id=lid)
            _, created = CampaignLead.objects.get_or_create(campaign=campaign, lead=lead)
            if created:
                created_count += 1
        
        return Response({"message": f"Successfully added {created_count} leads to campaign."})