thunderbolt_crm/
├── core/                       # Django Project Configuration
│   ├── settings.py             # Auth, JWT, App Registration, CORS
│   └── urls.py                 # Master API Routing
├── accounts/                   # RBAC & User Management
│   ├── models.py               # Custom User with Roles
│   ├── serializers.py          # JWT & Enrollment logic
│   └── views.py                # Login & Staff CRUD
├── courses/                    # Academic Inventory
│   ├── models.py               # Program & SubCourse models
│   ├── serializers.py          # Nested Course serialization
│   └── views.py                # Knowledge Base API
├── leads/                      # Lead Bank & Data Entry
│   ├── models.py               # Lead model with JSON metadata
│   ├── serializers.py          # Lead data mapping
│   └── views.py                # Smart CSV Bulk Import & Auto-AI Trigger
├── brain/                      # Central Intelligence Hub
│   ├── agents/                 # CrewAI Researcher definition
│   ├── tasks/                  # AI Task instructions (One-Shot)
│   ├── tools/                  # CRM Toolbox (DB bridge for AI)
│   ├── workflows/              # LangGraph "Lightning" Workflow
│   ├── models.py               # AI Logs & Intelligence persistence
│   ├── views.py                # Trigger & Polling API
│   └── llm_config.py           # Gemini 3 Flash / LangChain config
├── campaigns/                  # Sales Execution Module
│   ├── models.py               # Campaign & CampaignLead (Junction)
│   ├── serializers.py          # Flattened data for workspaces
│   └── views.py                # Workspace management API
├── dashboard/                  # Strategic Analytics
│   └── views.py                # Aggregated stats & chart data
├── frontend/                   # React Application (Vite)
│   ├── src/
│   │   ├── api/                # Axios configuration & interceptors
│   │   ├── components/         # Reusable UI (Sidebar, Modals, AI Sidebar)
│   │   ├── pages/              # Views (Dashboard, LeadBank, Campaigns)
│   │   ├── App.jsx             # React Router & RBAC Guard logic
│   │   └── main.jsx            # Theme & Context Providers
│   └── tailwind.config.js      # Custom styling config
├── .env                        # Secret keys (API, Django, Database)
├── manage.py                   # Django entry point
├── find_best_model.py          # Dynamic LLM benchmarking script
└── check_gemini.py             # LLM connectivity test script