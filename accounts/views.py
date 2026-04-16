from rest_framework import viewsets, status, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import Group

from .models import User
from .serializers import (
    UserEnrollmentSerializer, 
    ChangePasswordSerializer, 
    CustomTokenObtainPairSerializer
)

# 1. AUTHENTICATION: Custom Login View
class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Returns JWT tokens with custom claims (roles, is_first_login)
    defined in the CustomTokenObtainPairSerializer.
    """
    serializer_class = CustomTokenObtainPairSerializer


# 2. AUTHENTICATION: Forced Password Change
class ChangePasswordView(APIView):
    """
    Allows users to change their password on first login.
    Updates 'is_first_login' to False upon success.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.is_first_login = False
            user.save()
            return Response(
                {"message": "Password updated successfully. Please login again."}, 
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 3. STAFF MANAGEMENT: User CRUD (Create, Read, Update, Delete)
class UserViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing user instances.
    Accessible only by Admins/Superusers.
    """
    serializer_class = UserEnrollmentSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        """
        Returns the list of all users.
        Optional: Exclude the current logged-in admin from the list 
        to prevent accidental self-deletion.
        """
        return User.objects.all().order_by('-id').exclude(id=self.request.user.id)

    def perform_create(self, serializer):
        """
        Custom logic during user creation via the ViewSet.
        The serializer's create method handles role assignment.
        """
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        """
        Custom delete logic to prevent deleting the last admin if necessary.
        """
        user_to_delete = self.get_object()
        if user_to_delete.is_superuser:
            return Response(
                {"error": "Superusers cannot be deleted via this console."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        return super().destroy(request, *args, **kwargs)


# 4. LEGACY/DIRECT ENROLLMENT (Optional)
class AdminEnrollUserView(APIView):
    """
    Original endpoint for enrollment. 
    Note: The UserViewSet now handles this via POST to /api/accounts/manage/,
    but this is kept for backward compatibility with existing frontend calls.
    """
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        serializer = UserEnrollmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User enrolled successfully"}, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)