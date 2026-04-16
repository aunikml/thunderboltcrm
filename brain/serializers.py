from rest_framework import serializers
from .models import LeadIntelligence, AgentTaskLog

class LeadIntelligenceSerializer(serializers.ModelSerializer):
    """
    Used to send the AI findings (score, persona, script) 
    to the Lead Intelligence Sidebar in React.
    """
    # Create a human-readable timestamp
    last_updated_human = serializers.SerializerMethodField()

    class Meta:
        model = LeadIntelligence
        fields = [
            'id', 
            'lead', 
            'score', 
            'persona_tag', 
            'conversion_probability', 
            'suggested_approach', 
            'generated_script', 
            'last_processed',
            'last_updated_human'
        ]

    def get_last_updated_human(self, obj):
        return obj.last_processed.strftime("%b %d, %Y at %I:%M %p")


class AgentTaskLogSerializer(serializers.ModelSerializer):
    """
    Used for auditing. Allows developers/managers to see the 
    'Internal Monologue' of the agents to understand their reasoning.
    """
    agent_display = serializers.CharField(source='get_agent_name_display', read_only=True)

    class Meta:
        model = AgentTaskLog
        fields = [
            'id', 
            'lead', 
            'agent_name', 
            'agent_display', 
            'status', 
            'internal_monologue', 
            'output_data', 
            'total_cost', 
            'created_at'
        ]