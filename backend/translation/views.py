import json
from pathlib import Path

from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from diff_match_patch import diff_match_patch

from accounts.models import Device
from translation.models import TranslationAttempt
from translation.serializers import AttemptRequestSerializer, AttemptSerializer


def _load_translation_json(year: int) -> dict | None:
    p: Path = settings.EXAM_CONTENT_ROOT / 'translation' / f'{year}.json'
    if not p.exists():
        return None
    try:
        return json.loads(p.read_text(encoding='utf-8'))
    except Exception:
        return None


class ContentTranslationView(APIView):
    """GET /translation/content/{year} 直接返回真题目录下 JSON(公开,未登录也能看题目)"""
    permission_classes = [AllowAny]

    def get(self, request, year: int):
        data = _load_translation_json(int(year))
        if not data:
            return Response({'detail': f'找不到 {year} 年翻译 JSON'}, status=status.HTTP_404_NOT_FOUND)
        return Response(data)


class AttemptViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    serializer_class = AttemptSerializer

    def get_queryset(self):
        device: Device | None = getattr(self.request, 'device', None)
        if not device:
            return TranslationAttempt.objects.none()
        qs = TranslationAttempt.objects.filter(device=device).order_by('-created_at')
        y = self.request.query_params.get('year')
        if y and str(y).isdigit():
            qs = qs.filter(year=int(y))
        sid = self.request.query_params.get('slice_id')
        if sid:
            qs = qs.filter(slice_id=str(sid))
        return qs

    def create(self, request, *args, **kwargs):
        device: Device | None = getattr(request, 'device', None)
        if not device:
            return Response({'detail': '缺少 X-Device-Id 请求头'}, status=status.HTTP_400_BAD_REQUEST)
        s = AttemptRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        year = d['year']
        ref_zh = ''
        slice_text_for_ref = ''
        j = _load_translation_json(year)
        if j:
            for sl in j.get('slices') or []:
                if str(sl.get('id')) == str(d['slice_id']):
                    ref_zh = sl.get('refZh') or ''
                    slice_text_for_ref = sl.get('text') or ''
                    break
            if not ref_zh and j.get('refZh'):
                ref_zh = j['refZh']
        source = d['source_text'] or slice_text_for_ref
        dmp = diff_match_patch()
        diffs = dmp.diff_main(ref_zh, d['user_translation']) if ref_zh else []
        diff_report = {
            'diffs': [[op, txt] for (op, txt) in diffs],
            'has_refZh': bool(ref_zh),
        }
        obj = TranslationAttempt.objects.create(
            device=device,
            year=year, slice_id=d['slice_id'],
            source_text=source,
            user_translation=d['user_translation'],
            ref_zh=ref_zh,
            diff_report=diff_report,
        )
        return Response(AttemptSerializer(obj).data, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        return self.get_paginated_response(AttemptSerializer(page, many=True).data)
