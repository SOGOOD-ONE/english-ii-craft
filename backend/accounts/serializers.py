"""Device 序列化（取代 User/JWT）"""
from rest_framework import serializers
from accounts.models import Device


class DeviceSerializer(serializers.ModelSerializer):
    has_custom_key = serializers.SerializerMethodField()

    class Meta:
        model = Device
        fields = (
            'device_id', 'ai_base_url', 'ai_api_key', 'ai_model',
            'mastery_required', 'daily_new_limit',
            'has_custom_key', 'created_at', 'last_seen',
        )
        read_only_fields = ('device_id', 'created_at', 'last_seen')
        extra_kwargs = {
            'ai_api_key': {'write_only': False, 'help_text': 'GET 时会被屏蔽;PATCH 全量更新'},
            'created_at': {'read_only': True},
            'last_seen': {'read_only': True},
        }

    def get_has_custom_key(self, obj: Device) -> bool:
        return bool(obj.ai_api_key)

    def to_representation(self, instance: Device):
        rep = super().to_representation(instance)
        if instance.ai_api_key:
            rep['ai_api_key_masked'] = instance.ai_api_key[:6] + '…' + instance.ai_api_key[-4:]
        rep.pop('ai_api_key', None)
        return rep


class DevicePatchSerializer(serializers.Serializer):
    """/device/me PATCH 请求体(只允许改配置 + 偏好)"""
    ai_base_url = serializers.CharField(required=False, allow_blank=True, max_length=256)
    ai_api_key = serializers.CharField(required=False, allow_blank=True, max_length=256,
                                       write_only=False)
    ai_model = serializers.CharField(required=False, allow_blank=True, max_length=64)
    mastery_required = serializers.IntegerField(required=False, min_value=1, max_value=10)
    daily_new_limit = serializers.IntegerField(required=False, min_value=5, max_value=200)
