"""
eii_craft URL Configuration
---------------------------
 - /api/schema/docs  Swagger UI (drf-spectacular)
 - /api/schema/redoc ReDoc
 - /admin           Django Admin
 - /api/v1/*         业务 REST
"""
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # OpenAPI 文档
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/schema/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    # 业务 v1
    path('api/v1/device/', include('accounts.urls')),
    path('api/v1/vocab/', include('vocab.urls')),
    path('api/v1/writing/', include('writing.urls')),
    path('api/v1/translation/', include('translation.urls')),
    path('api/v1/exam/', include('exam.urls')),
]
