from .models import AIAgent

def get_agent_instructions(slug):
    """
    Retrieves the full instruction set for an agent.
    Combines the base_instruction with all tuning history.
    """
    try:
        agent = AIAgent.objects.get(slug=slug)
        # Start with base
        full_instructions = agent.base_instruction
        
        # Append all tuning records in chronological order
        tunes = agent.tuning_history.all().order_by('created_at')
        if tunes.exists():
            full_instructions += "\n\nADDITIONAL INSTRUCTIONS (TUNING):\n"
            for tune in tunes:
                full_instructions += f"\n- {tune.additional_instructions}"
        
        return full_instructions
    except AIAgent.DoesNotExist:
        return "You are a helpful AI assistant."
