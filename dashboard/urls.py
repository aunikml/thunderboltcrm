from django.urls import path
from .views import SalesAnalyticsView

urlpatterns = [
    # This endpoint returns all the chart data and stat cards
    path('analytics/', SalesAnalyticsView.as_view(), name='sales_analytics'),
]