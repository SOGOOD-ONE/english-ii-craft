import uuid
from django.db import models
from django.conf import settings


class Device(models.Model):
    """匿名设备身份——取代 User/JWT 认证"""
    device_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    # 自定义 AI Provider(为 None / '' 时表示用全局配置)
    ai_base_url = models.CharField(max_length=256, blank=True, default='')
    ai_api_key = models.CharField(max_length=256, blank=True, default='')
    ai_model = models.CharField(max_length=64, blank=True, default='')
    # 偏好: 连续正确多少次算"掌握"(生词本 FSRS 调度阈值)
    mastery_required = models.SmallIntegerField(default=2)
    # 每日生词上限
    daily_new_limit = models.SmallIntegerField(default=20)

    class Meta:
        verbose_name = '设备'
        verbose_name_plural = '设备'

    def __str__(self):
        return f'Device<{self.device_id}>'


class UserProfile(models.Model):
    """(保留旧兼容) 扩展 Django User 表"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile'
    )
    ai_base_url = models.CharField(max_length=256, blank=True, default='')
    ai_api_key = models.CharField(max_length=256, blank=True, default='')
    ai_model = models.CharField(max_length=64, blank=True, default='')
    mastery_required = models.SmallIntegerField(default=2)
    daily_new_limit = models.SmallIntegerField(default=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '用户配置'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'UserProfile<{self.user.username}>'
