from django.db import models
from courses.models import Program
from leads.models import Lead

class Campaign(models.Model):
    name = models.CharField(max_length=255)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='campaigns')
    batch = models.CharField(max_length=100)
    start_date = models.CharField(max_length=10) # MM/YY
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.batch}"

class CampaignLead(models.Model):
    STATUS_CHOICES = [
        ('INITIATE', 'Need to Initiate'),
        ('FOLLOWUP', 'Needs Follow-up'),
        ('CONVERTED', 'Converted'),
        ('NOT_CONVERTED', 'Not Converted'),
    ]

    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='campaign_leads')
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='campaign_assignments')
    
    # Specific tracking for this campaign
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='INITIATE')
    user_rating = models.IntegerField(default=0) # 1-5 scale
    
    # Cache fields to store AI output for fast loading in the table
    # This prevents us from having to join the Intelligence table for every row
    ai_score = models.IntegerField(default=0)
    ai_persona = models.CharField(max_length=100, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # A lead cannot be added to the same campaign twice
        unique_together = ('campaign', 'lead')

    def __str__(self):
        return f"{self.lead.first_name} in {self.campaign.name}"