from django.urls import path, include
from rest_framework.routers import DefaultRouter
from vocab.views import WordLookupView, CardViewSet

app_name = 'vocab'

router = DefaultRouter()
router.register(r'cards', CardViewSet, basename='card')

urlpatterns = [
    path('words/lookup', WordLookupView.as_view(), name='word-lookup'),
    path('', include(router.urls)),
]
