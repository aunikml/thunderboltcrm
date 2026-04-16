from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/accounts/', include('accounts.urls')),
    path('api/courses/', include('courses.urls')),
    path('api/leads/', include('leads.urls')),
    path('api/brain/', include('brain.urls')),
    path('api/campaigns/', include('campaigns.urls')),
    path('api/dashboard/', include('dashboard.urls')),
]