from django.urls import path
# ADD 'BulkAnalyzeCampaignLeadsView' to this import list
from .views import (
    TriggerLeadAnalysisView, 
    LeadIntelligenceDetailView, 
    BulkAnalyzeCampaignLeadsView
)

urlpatterns = [
    # Single lead analysis
    path('analyze/<int:lead_id>/', TriggerLeadAnalysisView.as_view(), name='trigger_analysis'),
    
    # Bulk campaign analysis (The line that caused the error)
    path('analyze-campaign/<int:campaign_id>/', BulkAnalyzeCampaignLeadsView.as_view(), name='bulk_analyze_campaign'),
    
    # Fetch results
    path('intelligence/<int:lead_id>/', LeadIntelligenceDetailView.as_view(), name='get_intelligence'),
]