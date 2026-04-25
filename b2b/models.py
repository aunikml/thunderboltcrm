from django.db import models
from courses.models import Program

class Organization(models.Model):
    ORG_TYPES = [
        ('NGO', 'NGO'),
        ('CORP', 'Corporate'),
        ('GOV', 'Government'),
        ('ACAD', 'Academic'),
        ('DEV', 'Development Partner'),
    ]

    ACADEMIC_LEVELS = [
        ('PRE_PRI', 'Pre-primary'),
        ('PRI', 'Primary'),
        ('SEC', 'Secondary'),
        ('TER', 'Tertiary'),
        ('VOC', 'Vocational'),
    ]

    # --- Core Identity ---
    name = models.CharField(max_length=255)
    org_type = models.CharField(max_length=10, choices=ORG_TYPES)
    academic_levels = models.JSONField(default=list, blank=True, help_text="Multi-select: pre-primary, primary, secondary, tertiary, vocational")
    
    country = models.CharField(max_length=100)
    hq_location = models.CharField(max_length=255)
    branches = models.TextField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    year_established = models.IntegerField(blank=True, null=True)
    
    size_range = models.CharField(max_length=50, help_text="e.g., 1-50, 50-200, 500+")
    beneficiary_reach = models.CharField(max_length=255, blank=True, null=True)

    # --- Strategic Focus ---
    thematic_areas = models.TextField(help_text="e.g., ECD, Mental Health, Education")
    strategic_priorities = models.TextField(blank=True, null=True)
    challenges = models.TextField(blank=True, null=True)
    capacity_gaps = models.TextField(blank=True, null=True)
    
    FUNDING_CHOICES = [
        ('DONOR', 'Donor-funded'),
        ('SELF', 'Self-funded'),
        ('GRANT', 'Grant cycle stage'),
    ]
    funding_status = models.CharField(max_length=10, choices=FUNDING_CHOICES, default='SELF')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class B2BMatch(models.Model):
    """
    Stores AI-generated insights for an organization.
    """
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='matches')
    program = models.ForeignKey(Program, on_delete=models.CASCADE)
    
    propensity_score = models.IntegerField(default=0)
    campaign_strategy = models.TextField()
    pitching_pointers = models.JSONField(default=list)
    
    # Track the reasoning
    match_reasoning = models.TextField()
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "B2B Matches"
