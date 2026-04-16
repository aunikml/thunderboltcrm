from django.db import models
from courses.models import Program

class Lead(models.Model):
    CATEGORIES = [
        ('PARTICIPANT', 'Course Participant'),
        ('SOCIAL', 'Social Media Lead'),
        ('WEBINAR', 'Webinar Lead'),
    ]
    
    PLATFORMS = [
        ('FB', 'Facebook'),
        ('IG', 'Instagram'),
        ('LI', 'LinkedIn'),
        ('TT', 'TikTok'),
        ('NA', 'N/A'),
    ]

    # Contact Info
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField()
    phone = models.CharField(max_length=25, blank=True, null=True)
    
    # Context
    category = models.CharField(max_length=20, choices=CATEGORIES)
    platform = models.CharField(max_length=10, choices=PLATFORMS, default='NA')
    
    # Relations
    program = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, related_name='leads')
    
    # Enrollment Info (Optional for Social/Webinar)
    batch = models.CharField(max_length=100, blank=True, null=True)
    start_date = models.CharField(max_length=10, help_text="MM/YY", blank=True, null=True)

    # Agent Data
    additional_data = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} - {self.get_category_display()}"