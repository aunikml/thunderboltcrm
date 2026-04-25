from rest_framework import serializers
from .models import Lead, LeadImportBatch

class LeadImportBatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeadImportBatch
        fields = '__all__'

class LeadSerializer(serializers.ModelSerializer):
    """
    Serializer for the Lead Bank.
    Provides detailed lead information including the linked program name,
    the latest campaign status, and the flexible additional_data JSON field.
    """
    
    # Traverse the ForeignKey to 'Program' to get the display name for the UI Table
    program_name = serializers.CharField(source='program.name', read_only=True)
    
    # Human-readable labels for the category and platform choices
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)

    # NEW: Show the status of the lead in its latest campaign (if any)
    campaign_status = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            'id',
            'first_name',
            'last_name',
            'email',
            'phone',
            'category',
            'category_display',
            'platform',
            'platform_display',
            'program',       
            'program_name',  
            'campaign_status', 
            'import_batch',
            'batch',
            'start_date',
            'additional_data', 
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_campaign_status(self, obj):
        """Retrieves the status from the most recent campaign assignment."""
        latest_assignment = obj.campaign_assignments.order_by('-created_at').first()
        if latest_assignment:
            return latest_assignment.get_status_display()
        return "N/A"

    def validate_email(self, value):
        return value.lower()