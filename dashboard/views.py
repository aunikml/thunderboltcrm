from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Count, Avg
from django.db.models.functions import TruncDate

# Import models from your other apps
from leads.models import Lead
from campaigns.models import Campaign, CampaignLead
from brain.models import LeadIntelligence

class SalesAnalyticsView(APIView):
    """
    View to aggregate sales data, conversion rates, and 
    professional demographics for the main dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # 1. HIGH-LEVEL STATS
        total_leads = Lead.objects.count()
        total_campaigns = Campaign.objects.count()
        total_converted = CampaignLead.objects.filter(status='CONVERTED').count()
        
        # Calculate Average Propensity Score from the Brain
        avg_score = LeadIntelligence.objects.aggregate(Avg('score'))['score__avg'] or 0
        
        # 2. CONVERSION FUNNEL DATA
        # Group leads by their status in campaigns
        funnel_data = CampaignLead.objects.values('status').annotate(count=Count('id'))
        status_map = dict(CampaignLead.STATUS_CHOICES)
        funnel_chart = [
            {"step": status_map.get(item['status'], item['status']), "count": item['count']} 
            for item in funnel_data
        ]

        # 3. PROFESSION DISTRIBUTION (From Lead additional_data JSON)
        professions = {}
        all_leads = Lead.objects.all()
        for lead in all_leads:
            data = lead.additional_data or {}
            # Look for common keys in the uploaded CSV data
            p = data.get('profession') or data.get('Profession') or data.get('job title') or 'Other'
            p = p.title().strip()
            professions[p] = professions.get(p, 0) + 1
        
        # Sort and take top 5 professions
        sorted_professions = sorted(professions.items(), key=lambda x: x[1], reverse=True)[:5]
        profession_chart = [{"name": k, "value": v} for k, v in sorted_professions]

        # 4. COURSE POPULARITY
        course_data = Lead.objects.values('program__name').annotate(count=Count('id')).order_by('-count')[:5]
        course_chart = [
            {"course": item['program__name'] or "General", "leads": item['count']} 
            for item in course_data
        ]

        # 5. AI PERSONA DISTRIBUTION
        persona_data = LeadIntelligence.objects.values('persona_tag').annotate(count=Count('id'))
        persona_chart = [
            {"persona": item['persona_tag'], "count": item['count']} 
            for item in persona_data
        ]

        return Response({
            "stats": {
                "total_leads": total_leads,
                "active_campaigns": Campaign.objects.filter(is_active=True).count(),
                "total_converted": total_converted,
                "avg_propensity": f"{round(avg_score, 1)}%"
            },
            "funnel": funnel_chart,
            "professions": profession_chart,
            "courses": course_chart,
            "personas": persona_chart
        })