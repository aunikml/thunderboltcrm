from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeadViewSet, LeadImportBatchViewSet

router = DefaultRouter()
router.register(r'manage', LeadViewSet, basename='lead-manage')
router.register(r'batches', LeadImportBatchViewSet, basename='lead-batches')

urlpatterns = [
    path('', include(router.urls)),
]