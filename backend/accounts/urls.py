from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView

from accounts.views import RegisterView, MeView, JWTLoginView, JWTRefreshView

app_name = 'accounts'

urlpatterns = [
    path('register', RegisterView.as_view(), name='register'),
    # 登录双路径都可用
    path('login', JWTLoginView.as_view(), name='login'),
    path('token', JWTLoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh', JWTRefreshView.as_view(), name='token_refresh'),
    path('token/verify', TokenVerifyView.as_view(), name='token_verify'),
    path('me', MeView.as_view(), name='me'),
]
