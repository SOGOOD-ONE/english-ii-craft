from django.urls import path
from accounts.views import register_device, device_me

app_name = 'accounts'

urlpatterns = [
    path('register', register_device, name='device_register'),
    path('me', device_me, name='device_me'),
]