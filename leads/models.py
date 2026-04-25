from django.db import models
from courses.models import Program

class LeadImportBatch(models.Model):
    """
    Groups leads by their upload event.
    Essential for tracking AI Matchmaking Discovery history.
    """
    name = models.CharField(max_length=255, blank=True, null=True)
    source_platform = models.CharField(max_length=50, blank=True, null=True)
    total_count = models.IntegerField(default=0)
    
    # Track if this was an AI Discovery batch
    is_discovery = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Batch {self.id} - {self.created_at.strftime('%Y-%m-%d')}"

class Lead(models.Model):
    CATEGORIES = [
        ('PARTICIPANT', 'Course Participant'),
        ('SOCIAL', 'Social Media Lead'),
        ('WEBINAR', 'Webinar Lead'),
        ('CAMPAIGN', 'Campaign Lead'),
    ]
    
    PLATFORMS = [
        ('FB', 'Facebook'),
        ('IG', 'Instagram'),
        ('LI', 'LinkedIn'),
        ('TT', 'TikTok'),
        ('EXT_REF', 'External Referral'),
        ('INT_REF', 'Internal Referral'),
        ('ORG_REF', 'Organizational Referral'),
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
    program = models.ForeignKey(Program, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    import_batch = models.ForeignKey(LeadImportBatch, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    
    # Enrollment Info (Optional for Social/Webinar)
    batch = models.CharField(max_length=100, blank=True, null=True)
    start_date = models.CharField(max_length=10, help_text="MM/YY", blank=True, null=True)

    # Agent Data
    additional_data = models.JSONField(default=dict, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} - {self.get_category_display()}"