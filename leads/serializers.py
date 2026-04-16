from rest_framework import serializers
from .models import Lead

class LeadSerializer(serializers.ModelSerializer):
    """
    Serializer for the Lead Bank.
    Provides detailed lead information including the linked program name
    and the flexible additional_data JSON field for AI agents.
    """
    
    # Traverse the ForeignKey to 'Program' to get the display name for the UI Table
    program_name = serializers.CharField(source='program.name', read_only=True)
    
    # Human-readable labels for the category and platform choices
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    platform_display = serializers.CharField(source='get_platform_display', read_only=True)

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
            'program',       # Use this ID when editing/creating
            'program_name',  # Use this name for the MUI table column
            'batch',
            'start_date',
            'additional_data', # Captured CSV columns for AI agent research
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_email(self, value):
        """
        Optional: Add custom email validation if needed.
        Currently allows duplicate emails as a person might apply for different courses.
        """
        return value.lower()