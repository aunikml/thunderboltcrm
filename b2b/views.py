from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Organization, B2BMatch
from .serializers import OrganizationSerializer, B2BMatchSerializer

# AI Integration
from brain.workflows.b2b_matchmaker_graph import b2b_matchmaker_workflow

import threading

class OrganizationViewSet(viewsets.ModelViewSet):
    queryset = Organization.objects.all().order_by('-created_at')
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='analyze')
    def analyze_org(self, request, pk=None):
        """
        Triggers the AI B2B Matchmaker for this organization.
        """
        org = self.get_object()
        
        def run_ai():
            try:
                b2b_matchmaker_workflow.invoke({"org_id": org.id, "status": "started", "errors": []})
            except Exception as e:
                print(f"B2B AI Error: {e}")

        threading.Thread(target=run_ai, daemon=True).start()
        
        return Response({
            "message": f"AI Strategy Engine started for {org.name}. Insights will appear shortly.",
            "status": "processing"
        })

class B2BMatchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = B2BMatch.objects.all()
    serializer_class = B2BMatchSerializer
    permission_classes = [permissions.IsAuthenticated]
