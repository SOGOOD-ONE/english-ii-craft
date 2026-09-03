from django.db import models
from django.conf import settings


class UserProfile(models.Model):
    """
    扩展 Django User 表:
      - 用户可以自己设置一套 AI Provider 覆盖全局默认;
      - 未设置时后端用 settings.GLOBAL_AI_*。
    """
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile'
    )
    # 自定义 AI Provider(为 None / '' 时表示用全局配置)
    ai_base_url = models.CharField(max_length=256, blank=True, default='')
    ai_api_key = models.CharField(max_length=256, blank=True, default='')
    ai_model = models.CharField(max_length=64, blank=True, default='')
    # 偏好: 连续正确多少次算"掌握"(生词本 FSRS 调度阈值)
    mastery_required = models.SmallIntegerField(default=2)
    # 每日生词上限(前端参考值,后端调度不强制)
    daily_new_limit = models.SmallIntegerField(default=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '用户配置'
        verbose_name_plural = verbose_name

    def __str__(self):
        return f'UserProfile<{self.user.username}>'
