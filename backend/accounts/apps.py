from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'accounts'
    verbose_name = '账户管理'

    def ready(self):
        # 注册 post_save signal,创建 User 时自动挂 profile
        from django.db.models.signals import post_save
        from django.contrib.auth import get_user_model

        def _create_profile(sender, instance, created, **kwargs):
            if created:
                from accounts.models import UserProfile
                UserProfile.objects.get_or_create(user=instance)

        post_save.connect(_create_profile, sender=get_user_model(), weak=False, dispatch_uid='accounts__auto_profile')
