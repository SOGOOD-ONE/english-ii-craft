"""Device 接口（取代 User/JWT）"""
from drf_spectacular.utils import extend_schema, OpenApiResponse
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from accounts.models import Device
from accounts.serializers import DeviceSerializer, DevicePatchSerializer


@extend_schema(
    request=None,
    responses={201: DeviceSerializer},
)
@api_view(['POST'])
@permission_classes([AllowAny])
def register_device(request):
    """POST /api/v1/device/register 注册新设备(无 body),返回 device_id"""
    device = Device.objects.create()
    serializer = DeviceSerializer(device)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema(
    request=DevicePatchSerializer,
    responses=DeviceSerializer,
)
@api_view(['GET', 'PATCH'])
@permission_classes([AllowAny])
def device_me(request):
    """GET/PATCH /api/v1/device/me 读取或更新设备配置"""
    device: Device | None = getattr(request, 'device', None)
    if not device:
        return Response({'detail': '缺少 X-Device-Id 请求头'}, status=status.HTTP_400_BAD_REQUEST)
    if request.method == 'GET':
        serializer = DeviceSerializer(device)
        return Response(serializer.data)
    # PATCH
    serializer = DevicePatchSerializer(data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    data: dict = serializer.validated_data
    upd_keys = ['ai_base_url', 'ai_api_key', 'ai_model', 'mastery_required', 'daily_new_limit']
    dirty = False
    for k in upd_keys:
        if k in data:
            setattr(device, k, data[k])
            dirty = True
    if dirty:
        device.save(update_fields=upd_keys)
    return Response(DeviceSerializer(device).data)