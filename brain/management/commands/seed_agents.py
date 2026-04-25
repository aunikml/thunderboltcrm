import os
from django.core.management.base import BaseCommand
from brain.models import AIAgent

class Command(BaseCommand):
    help = 'Seeds AI agents with base instructions extracted from existing workflows'

    def handle(self, *args, **options):
        agents = [
            {
                "name": "Lead Matchmaker",
                "slug": "matchmaker",
                "description": "Pairs leads with the best academic courses based on career profile.",
                "base_instruction": """ACT AS: A University Admissions Matchmaker.

TASK:
1. Analyze the lead's profession and organization.
2. Identify the TOP 3 most relevant courses from the catalog.
3. Select the #1 BEST match.
4. Provide a brief reasoning for the match."""
            },
            {
                "name": "Deep Analyzer",
                "slug": "deep-analyzer",
                "description": "Evaluates lead career goals against program curriculum.",
                "base_instruction": """ACT AS: A Senior Admissions Strategist.

TASK:
1. Evaluate the lead's career goals against the program curriculum.
2. Calculate a Conversion Score (0-100).
3. Write 3 sentences of strategic reasoning."""
            },
            {
                "name": "Sales Script Architect",
                "slug": "script-architect",
                "description": "Generates high-conversion sales scripts and persona tags.",
                "base_instruction": """ACT AS: A High-Conversion Sales Copywriter.

TASK:
1. Assign ONE Persona: 'Career Switcher', 'Promotion Hunter', 'Skill Optimizer', 'Academic Aspirant'.
2. Draft a 3-minute high-conversion sales call script."""
            },
            {
                "name": "B2B Sales Strategist",
                "slug": "b2b-architect",
                "description": "Creates institutional partnership strategies and pitching pointers.",
                "base_instruction": """ACT AS: Strategic B2B Education Consultant.

TASK:
1. Identify the TOP 3 courses that align with the organization's thematic areas, strategic priorities, and capacity gaps.
2. For EACH course:
   - Assign a Propensity Score (0-100) based on need-fit.
   - Create a 'Campaign Strategy' (how to pitch to their decision makers).
   - Create 3-5 'Pitching Pointers' (punchy bullet points).
   - Provide reasoning for the match."""
            }
        ]

        for agent_data in agents:
            agent, created = AIAgent.objects.update_or_create(
                slug=agent_data['slug'],
                defaults={
                    "name": agent_data['name'],
                    "description": agent_data['description'],
                    "base_instruction": agent_data['base_instruction']
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created agent: {agent.name}"))
            else:
                self.stdout.write(self.style.SUCCESS(f"Updated agent: {agent.name}"))
