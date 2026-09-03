from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.generics import CreateAPIView, RetrieveUpdateAPIView, GenericAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.models import UserProfile
from accounts.serializers import (
    RegisterSerializer, JWTObtainPairSerializer,
    UserSerializer, UserProfileSerializer, MePatchSerializer, MeResponseSerializer,
)

User = get_user_model()


class RegisterView(CreateAPIView):
    """POST /auth/register 新用户注册"""
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # 注册成功直接返回 token,前端直接登录态
        token_serializer = JWTObtainPairSerializer(data={
            'username': request.data.get('username'),
            'password': request.data.get('password'),
        })
        token_serializer.is_valid(raise_exception=True)
        headers = self.get_success_headers(serializer.data)
        return Response(token_serializer.validated_data, status=status.HTTP_201_CREATED, headers=headers)


class JWTLoginView(TokenObtainPairView):
    """POST /auth/login 与 /auth/token 同功能,双路径都可用。"""
    serializer_class = JWTObtainPairSerializer
    permission_classes = [AllowAny]
    authentication_classes = []


class JWTRefreshView(TokenRefreshView):
    """POST /auth/token/refresh"""
    permission_classes = [AllowAny]
    authentication_classes = []


class MeView(RetrieveUpdateAPIView):
    """
    GET/PATCH /auth/me
      GET → 当前用户信息 + 配置(Key 会 mask,只返回是否有自定义)
      PATCH → 更新 email + profile(ai 配置/偏好)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = MePatchSerializer
    pagination_class = None

    def get_object(self):
        return self.request.user

    @extend_schema(responses=MeResponseSerializer)
    def retrieve(self, request, *args, **kwargs):
        user: User = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'profile': UserProfileSerializer(profile).data,
        })

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)  # 只支持 PATCH,默认 partial
        user: User = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        serializer = MePatchSerializer(data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        data: dict = serializer.validated_data
        if 'email' in data and data['email']:
            user.email = data['email']
            user.save(update_fields=['email'])
        upd_keys = ['ai_base_url', 'ai_api_key', 'ai_model', 'mastery_required', 'daily_new_limit']
        dirty = False
        for k in upd_keys:
            if k in data:
                setattr(profile, k, data[k])
                dirty = True
        if dirty:
            profile.save(update_fields=upd_keys + ['updated_at'])
        return Response({
            'user': UserSerializer(user).data,
            'profile': UserProfileSerializer(profile).data,
        })

    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
