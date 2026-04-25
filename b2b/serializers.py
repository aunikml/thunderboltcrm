from rest_framework import serializers
from .models import Organization, B2BMatch

class B2BMatchSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source='program.name', read_only=True)
    
    class Meta:
        model = B2BMatch
        fields = '__all__'

class OrganizationSerializer(serializers.ModelSerializer):
    matches = B2BMatchSerializer(many=True, read_only=True)
    
    class Meta:
        model = Organization
        fields = '__all__'
