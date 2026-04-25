from django.urls import path
from .views import (
    TriggerLeadAnalysisView, 
    LeadIntelligenceDetailView, 
    BulkAnalyzeCampaignLeadsView,
    AgentListView,
    AgentTuneView
)

urlpatterns = [
    # Single lead analysis
    path('analyze/<int:lead_id>/', TriggerLeadAnalysisView.as_view(), name='trigger_analysis'),
    
    # Bulk campaign analysis
    path('analyze-campaign/<int:campaign_id>/', BulkAnalyzeCampaignLeadsView.as_view(), name='bulk_analyze_campaign'),
    
    # Fetch results
    path('intelligence/<int:lead_id>/', LeadIntelligenceDetailView.as_view(), name='get_intelligence'),
    
    # Agent Tuning
    path('agents/', AgentListView.as_view(), name='agent_list'),
    path('agents/<slug:slug>/tune/', AgentTuneView.as_view(), name='agent_tune'),
]