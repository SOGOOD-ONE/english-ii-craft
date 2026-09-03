from django.urls import path
from accounts.views import register_device, device_me

app_name = 'accounts'

urlpatterns = [
    path('device/register', register_device, name='device_register'),
    path('device/me', device_me, name='device_me'),
]