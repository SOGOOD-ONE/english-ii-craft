"""DeviceAuthMiddleware — 用 X-Device-Id 替代 JWT 认证"""
from django.utils.deprecation import MiddlewareMixin
from django.utils import timezone
from django.core.exceptions import ValidationError
from .models import Device


class DeviceAuthMiddleware(MiddlewareMixin):
    """从请求头 X-Device-Id 读取设备身份，设置 request.device"""

    def process_request(self, request):
        raw = request.META.get('HTTP_X_DEVICE_ID', '')
        if not raw:
            request.device = None
            return
        try:
            device = Device.objects.get(device_id=raw)
            device.last_seen = timezone.now()
            device.save(update_fields=['last_seen'])
            request.device = device
        except (Device.DoesNotExist, ValueError, ValidationError):
            request.device = None