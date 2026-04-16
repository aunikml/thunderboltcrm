from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomTokenObtainPairView, AdminEnrollUserView, ChangePasswordView, UserViewSet

router = DefaultRouter()
router.register(r'manage', UserViewSet, basename='user-manage')

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('enroll/', AdminEnrollUserView.as_view(), name='admin_enroll'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('', include(router.urls)), # This adds /api/accounts/manage/
]