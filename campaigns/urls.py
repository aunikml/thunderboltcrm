from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CampaignViewSet, CampaignLeadViewSet

router = DefaultRouter()
router.register(r'list', CampaignViewSet)
router.register(r'leads', CampaignLeadViewSet)

urlpatterns = [
    path('', include(router.urls)),
]