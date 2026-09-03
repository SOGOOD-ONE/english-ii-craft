from django.urls import path, include
from rest_framework.routers import DefaultRouter
from translation.views import AttemptViewSet, ContentTranslationView

app_name = 'translation'

router = DefaultRouter()
router.register(r'attempts', AttemptViewSet, basename='attempt')

urlpatterns = [
    path('content/<int:year>', ContentTranslationView.as_view(), name='content-year'),
    path('', include(router.urls)),
]
