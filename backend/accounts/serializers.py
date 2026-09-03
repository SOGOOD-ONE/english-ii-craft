from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from accounts.models import UserProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'is_staff', 'date_joined')
        read_only_fields = ('id', 'is_staff', 'date_joined')


class UserProfileSerializer(serializers.ModelSerializer):
    """PATCH /auth/me 里允许用户更新自己的 AI 配置 + 偏好,不直接改 User 字段"""
    has_custom_key = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = (
            'ai_base_url', 'ai_api_key', 'ai_model',
            'mastery_required', 'daily_new_limit',
            'has_custom_key', 'created_at', 'updated_at',
        )
        extra_kwargs = {
            'ai_api_key': {'write_only': False, 'help_text': 'GET 时会被屏蔽;PATCH 全量更新'},
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }

    def get_has_custom_key(self, obj: UserProfile) -> bool:
        return bool(obj.ai_api_key)

    def to_representation(self, instance: UserProfile):
        """GET 时 ai_api_key 永远不直接返回,只告诉是否已配置"""
        rep = super().to_representation(instance)
        if instance.ai_api_key:
            rep['ai_api_key_masked'] = instance.ai_api_key[:6] + '…' + instance.ai_api_key[-4:]
        rep.pop('ai_api_key', None)
        return rep


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2')

    def validate(self, data: dict):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': '两次密码不一致'})
        return data

    def create(self, validated_data: dict) -> User:
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        # 自动创建 profile
        UserProfile.objects.get_or_create(user=user)
        return user


class JWTObtainPairSerializer(TokenObtainPairSerializer):
    """登录除了 access/refresh,还顺便返回 user 基础信息 + profile,前端省一次请求"""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['username'] = user.username
        token['email'] = user.email
        UserProfile.objects.get_or_create(user=user)
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        profile, _ = UserProfile.objects.get_or_create(user=self.user)
        data['user'] = UserSerializer(self.user).data
        data['profile'] = UserProfileSerializer(profile).data
        return data


class MeResponseSerializer(serializers.Serializer):
    """仅用于 drf-spectacular 文档描述"""
    user = UserSerializer()
    profile = UserProfileSerializer()


class MePatchSerializer(serializers.Serializer):
    """/auth/me PATCH 请求体(只允许改 profile + email)"""
    email = serializers.EmailField(required=False)
    ai_base_url = serializers.CharField(required=False, allow_blank=True, max_length=256)
    ai_api_key = serializers.CharField(required=False, allow_blank=True, max_length=256,
                                       write_only=False)
    ai_model = serializers.CharField(required=False, allow_blank=True, max_length=64)
    mastery_required = serializers.IntegerField(required=False, min_value=1, max_value=10)
    daily_new_limit = serializers.IntegerField(required=False, min_value=5, max_value=200)
