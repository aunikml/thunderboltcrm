from rest_framework import serializers
from .models import Campaign, CampaignLead

class CampaignSerializer(serializers.ModelSerializer):
    """
    Serializer for the Campaign metadata.
    Provides the target program name and the current lead count.
    """
    program_name = serializers.CharField(source='program.name', read_only=True)
    lead_count = serializers.IntegerField(source='campaign_leads.count', read_only=True)

    class Meta:
        model = Campaign
        fields = [
            'id', 'name', 'program', 'program_name', 
            'batch', 'start_date', 'is_active', 
            'lead_count', 'created_at'
        ]


class CampaignLeadSerializer(serializers.ModelSerializer):
    """
    Serializer for leads within a specific Campaign.
    Flattens Lead data and extracts professional info from the JSON metadata.
    """
    # Identifiers from the linked Lead model
    name = serializers.SerializerMethodField()
    email = serializers.CharField(source='lead.email', read_only=True)
    phone = serializers.CharField(source='lead.phone', read_only=True)
    
    # CRITICAL: Category is needed for the Tabbed View (Social Media vs Webinar)
    category = serializers.CharField(source='lead.category', read_only=True)
    
    # Professional Info (Extracted from the flexible JSON field in the Lead model)
    profession = serializers.SerializerMethodField()
    organization = serializers.SerializerMethodField()

    class Meta:
        model = CampaignLead
        fields = [
            'id', 
            'campaign', 
            'lead',             # The Lead ID (used for AI sidebar)
            'name', 
            'email', 
            'phone', 
            'category', 
            'profession', 
            'organization', 
            'status',           # Campaign-specific status
            'user_rating',      # Staff assigned rating
            'ai_score',         # Cached propensity score
            'ai_persona',       # Cached AI persona
            'updated_at'
        ]

    def get_name(self, obj):
        """Concatenates first and last name from the Lead model."""
        return f"{obj.lead.first_name} {obj.lead.last_name or ''}".strip()

    def get_profession(self, obj):
        """
        Retrieves the profession from the Lead's additional_data JSON.
        Handles multiple possible CSV header variations.
        """
        data = obj.lead.additional_data or {}
        return (
            data.get('profession') or 
            data.get('Profession') or 
            data.get('job title') or 
            data.get('Job Title') or 
            "N/A"
        )

    def get_organization(self, obj):
        """
        Retrieves the organization from the Lead's additional_data JSON.
        """
        data = obj.lead.additional_data or {}
        return (
            data.get('organization') or 
            data.get('Organization') or 
            data.get('company name') or 
            data.get('Company') or 
            "N/A"
        )