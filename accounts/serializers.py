from rest_framework import serializers
from django.contrib.auth.models import Group
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# 1. JWT SERIALIZER: Customizes the data inside the Login Token
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Custom claims for the Frontend logic
        token['email'] = user.email
        token['is_first_login'] = user.is_first_login
        token['is_superuser'] = user.is_superuser
        token['roles'] = list(user.groups.values_list('name', flat=True))
        
        return token


# 2. ENROLLMENT & MANAGEMENT SERIALIZER: Handles CRUD for the MUI Table
class UserEnrollmentSerializer(serializers.ModelSerializer):
    """
    Used for Listing, Enrolling, and Updating users.
    'roles' is used to send data TO the server.
    'display_roles' is used to send data FROM the server to the MUI Table.
    """
    roles = serializers.ListField(
        child=serializers.CharField(), 
        write_only=True, 
        required=False
    )
    display_roles = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 
            'email', 
            'first_name', 
            'last_name', 
            'phone_number', 
            'roles', 
            'display_roles',
            'is_first_login'
        ]

    def get_display_roles(self, obj):
        # Returns a list of strings like ['Admin', 'Manager'] for the MUI Chips
        return list(obj.groups.values_list('name', flat=True))

    def create(self, validated_data):
        """
        Handles Admin Enrollment. 
        Sets initial password to email and marks for first-login reset.
        """
        role_names = validated_data.pop('roles', [])
        email = validated_data['email']
        
        # Create user via our Custom UserManager (defined in models.py)
        user = User.objects.create_user(
            email=email,
            password=email, # Default password is email
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            is_first_login=True
        )
        
        # Assign selected Groups
        for name in role_names:
            try:
                group = Group.objects.get(name=name)
                user.groups.add(group)
            except Group.DoesNotExist:
                continue
        
        return user

    def update(self, instance, validated_data):
        """
        Handles Updating staff details and roles from the MUI Modal.
        """
        role_names = validated_data.pop('roles', None)
        
        # Update standard fields
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone_number = validated_data.get('phone_number', instance.phone_number)
        # Note: Email is usually kept unique/unchangeable here to prevent auth issues
        
        instance.save()

        # Update Groups if roles were provided
        if role_names is not None:
            instance.groups.clear() # Reset current roles
            for name in role_names:
                try:
                    group = Group.objects.get(name=name)
                    instance.groups.add(group)
                except Group.DoesNotExist:
                    continue
        
        return instance


# 3. PASSWORD SERIALIZER: Validates the new password during forced reset
class ChangePasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(
        write_only=True, 
        min_length=8, 
        required=True
    )

    def validate_new_password(self, value):
        # Add any custom complexity checks here (optional)
        if value.lower() == 'password':
            raise serializers.ValidationError("Password is too common.")
        return value