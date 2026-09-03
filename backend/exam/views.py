"""
Exam 模块: 年份元数据 + 真题 JSON 静态内容 serving。

数据规则(后端读 settings.EXAM_CONTENT_ROOT):
    <root>/content/writing/<year>.json
    <root>/content/translation/<year>.json
    <root>/content/reading/<year>.json   ← 新增: 4 篇阅读 + 每题选项/答案
    <root>/content/cloze/<year>.json     (预留)

前端所有年份列表都走 GET /exam/years?module=writing|translation|reading
各模块题目走 GET /exam/content/<module>/<year>
"""
import json
from pathlib import Path
import re

from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiParameter
from rest_framework import serializers, viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from exam.models import PaperMetadata


YEAR_FILE_RE = re.compile(r'^(\d{4})\.json$')


def _list_years_for_module(module: str) -> list[int]:
    p: Path = settings.EXAM_CONTENT_ROOT / module
    if not p.exists():
        return []
    years = []
    for f in p.glob('*.json'):
        m = YEAR_FILE_RE.match(f.name)
        if m:
            years.append(int(m.group(1)))
    return sorted(set(years), reverse=True)


class YearItemSerializer(serializers.Serializer):
    year = serializers.IntegerField()
    module = serializers.CharField()
    title = serializers.CharField(allow_blank=True, default='')
    has_ref_zh = serializers.BooleanField()
    has_chart = serializers.BooleanField()
    note = serializers.CharField(allow_blank=True, default='')


class YearsQuerySerializer(serializers.Serializer):
    module = serializers.ChoiceField(
        choices=['writing', 'translation', 'reading', 'cloze', 'newtype_b'],
        required=False,
        allow_blank=False,
        default='writing',
    )


class ExamYearsView(APIView):
    """GET /exam/years?module=writing|translation|reading 返回可用年份列表(文件存在即认为可用)"""
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(
        parameters=[
            OpenApiParameter('module', OpenApiTypes.STR, required=False,
                             description='writing / translation / reading / cloze / newtype_b')
        ],
        responses=YearItemSerializer(many=True),
    )
    def get(self, request):
        qs = YearsQuerySerializer(data=request.query_params)
        qs.is_valid(raise_exception=True)
        module = qs.validated_data['module']
        years = _list_years_for_module(module)
        # 如果数据库有元数据,用它填充 title/has_ref_zh/has_chart/note;否则给默认值
        meta_qs = PaperMetadata.objects.filter(module=module)
        meta_map = {m.year: m for m in meta_qs}
        items = []
        for y in years:
            m = meta_map.get(y)
            if m:
                items.append({
                    'year': y, 'module': module, 'title': m.title,
                    'has_ref_zh': m.has_ref_zh, 'has_chart': m.has_chart, 'note': m.note,
                })
            else:
                items.append({
                    'year': y, 'module': module, 'title': f'{y} 年模块真题',
                    'has_ref_zh': False, 'has_chart': False, 'note': '元数据待补充(Django Admin 可编辑)',
                })
        return Response(items)


class ExamContentView(APIView):
    """
    GET /exam/content/<module>/<year>  返回该年真题 JSON。
      开发阶段给 5 秒缓存(避免每次翻页重读磁盘);生产可改长一点。
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    @method_decorator(cache_page(5))
    def get(self, request, module: str, year: int):
        if module not in {'writing', 'translation', 'reading', 'cloze', 'newtype_b'}:
            return Response({'detail': 'module 非法'}, status=400)
        p: Path = settings.EXAM_CONTENT_ROOT / module / f'{year}.json'
        if not p.exists():
            return Response({'detail': f'{year} 年 {module} 真题 JSON 不存在'}, status=404)
        try:
            data = json.loads(p.read_text(encoding='utf-8'))
        except Exception as exc:
            return Response({'detail': f'JSON 解析失败: {exc}'}, status=500)
        return Response(data)
