from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group

class Command(BaseCommand):
    help = 'Create initial RBAC roles'

    def handle(self, *args, **kwargs):
        roles = [
            'Admin', 
            'Lead manager', 
            'Campaign manager', 
            'Sales Representative', 
            'Manager', 
            'Core Dashboard Viewer', 
            'Skills admin'
        ]
        for role in roles:
            Group.objects.get_or_create(name=role)
        self.stdout.write(self.style.SUCCESS('Roles created successfully'))