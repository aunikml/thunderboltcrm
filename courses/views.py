from rest_framework import viewsets, permissions
from .models import Program
from .serializers import ProgramSerializer

class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all().order_by('-created_at')
    serializer_class = ProgramSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            # You can customize this to check for 'Skills admin' role specifically
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]