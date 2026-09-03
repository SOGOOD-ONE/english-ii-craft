from django.urls import path, include
from rest_framework.routers import DefaultRouter
from writing.views import ReviewViewSet, ReviewConfigView

app_name = 'writing'

router = DefaultRouter()
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'ai-config', ReviewConfigView, basename='review-config')

urlpatterns = [
    path('', include(router.urls)),
]
