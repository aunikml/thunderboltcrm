from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, B2BMatchViewSet

router = DefaultRouter()
router.register(r'organizations', OrganizationViewSet, basename='org-manage')
router.register(r'matches', B2BMatchViewSet, basename='org-matches')

urlpatterns = [
    path('', include(router.urls)),
]
