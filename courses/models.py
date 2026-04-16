from django.db import models

class Program(models.Model):
    PROGRAM_TYPES = [
        ('SHORT', 'Short/Certificate Course'),
        ('POSTGRAD', 'Postgraduate Program'),
    ]

    DEGREE_TYPES = [
        ('MSC', 'M.Sc'),
        ('MED', 'M.Ed'),
        ('MBA', 'MBA'),
        ('NONE', 'None (Certificate)'),
    ]

    # --- CORE TYPE & IDENTITY ---
    program_type = models.CharField(max_length=10, choices=PROGRAM_TYPES)
    name = models.CharField(max_length=255, unique=True, blank=True, null=True)
    language = models.CharField(max_length=50, default="English", blank=True, null=True)

    # --- COMMON / SHORT COURSE FIELDS (All non-mandatory) ---
    overview = models.TextField(blank=True, null=True)
    
    # Using JSONField for all List requirements to support Agentic parsing
    objectives = models.JSONField(default=list, blank=True, null=True) # Objective of the course
    knowledge = models.JSONField(default=list, blank=True, null=True)  # Knowledge - list
    skills_competencies = models.JSONField(default=list, blank=True, null=True) # Skills - list
    target_audience = models.JSONField(default=list, blank=True, null=True) # Who is this for - list
    topics = models.JSONField(default=list, blank=True, null=True) # Topics - list
    
    duration_tuition_fee = models.TextField(blank=True, null=True) # Reused for "Duration" or "Markdown Fees"
    number_of_sessions = models.IntegerField(blank=True, null=True)

    # --- POSTGRADUATE SPECIFIC FIELDS (All non-mandatory) ---
    degree_type = models.CharField(max_length=10, choices=DEGREE_TYPES, default='NONE', blank=True, null=True)
    about_programme = models.TextField(blank=True, null=True)
    program_structure = models.TextField(help_text="Markdown supported", blank=True, null=True)
    assessment_details = models.TextField(blank=True, null=True)
    unique_features = models.JSONField(default=list, blank=True, null=True)
    admission_requirements = models.JSONField(default=list, blank=True, null=True)
    teaching_learning = models.TextField(blank=True, null=True)
    admission_test_details = models.TextField(blank=True, null=True)
    career_prospects = models.TextField(blank=True, null=True)

    # --- META DATA ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name if self.name else f"Unnamed {self.get_program_type_display()}"

class SubCourse(models.Model):
    """
    Nested Course Modules within an Academic Program.
    """
    program = models.ForeignKey(
        Program, 
        related_name='modules', 
        on_delete=models.CASCADE,
        blank=True, 
        null=True
    )
    name = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.name}" if self.name else "Unnamed Module"