from langchain_core.tools import tool
import json

class CatalogToolbox:
    
    @tool("fetch_program_catalog")
    def fetch_program_catalog():
        """
        Retrieves a high-density summary of all available academic programs.
        Use this to match a lead's professional profile to the right curriculum.
        """
        from courses.models import Program
        try:
            programs = Program.objects.filter(is_active=True)
            catalog = []
            
            for p in programs:
                # We provide enough context for the AI to make a strategic match
                catalog.append({
                    "id": p.id,
                    "name": p.name,
                    "type": p.get_program_type_display(),
                    "target_audience": getattr(p, 'target_audience', 'General Professionals'),
                    "objectives": p.objectives[:300] + "..." if p.objectives else "N/A",
                    "skills_gained": getattr(p, 'skills_competencies', 'N/A')
                })
            
            return json.dumps(catalog)
        except Exception as e:
            return f"Error fetching catalog: {str(e)}"
