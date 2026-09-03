from drf_spectacular.utils import extend_schema
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from ai_provider.services import review_essay, AIConfig, resolve_config
from writing.models import EssayReview
from writing.serializers import ReviewRequestSerializer, ReviewResponseSerializer


class ReviewViewSet(viewsets.GenericViewSet):
    """
    - POST /reviews  → AI 批改 + 保存记录
    - GET  /reviews  → 我的批改历史(可按 year 过滤,分页)
    - GET  /reviews/{id}
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ReviewResponseSerializer

    def get_queryset(self):
        qs = EssayReview.objects.filter(user=self.request.user).order_by('-created_at')
        y = self.request.query_params.get('year')
        if y and str(y).isdigit():
            qs = qs.filter(year=int(y))
        return qs

    @extend_schema(request=ReviewRequestSerializer, responses=ReviewResponseSerializer)
    def create(self, request, *args, **kwargs):
        s = ReviewRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        year = s.validated_data['year']
        essay = s.validated_data['essay']
        chart_info = s.validated_data.get('chart_info') or ''
        result = review_essay(request.user, chart_info, essay)
        rec = EssayReview.objects.create(
            user=request.user,
            year=year,
            chart_info=chart_info,
            user_essay=essay,
            total_score=result.total_score,
            s_data=result.s_data, s_logic=result.s_logic, s_vocab=result.s_vocab, s_grammar=result.s_grammar,
            data_feedback=result.data_feedback,
            logic_feedback=result.logic_feedback,
            summary=result.summary,
            corrections=result.corrections,
            ai_base_url=result.base_url,
            ai_model=result.model,
            prompt_tokens=result.prompt_tokens,
            completion_tokens=result.completion_tokens,
            error_message=result.error_message,
        )
        resp_status = status.HTTP_400_BAD_REQUEST if result.error_message else status.HTTP_201_CREATED
        return Response(ReviewResponseSerializer(rec).data, status=resp_status)

    def list(self, request, *args, **kwargs):
        page = self.paginate_queryset(self.get_queryset())
        data = ReviewResponseSerializer(page, many=True).data
        return self.get_paginated_response(data)

    def retrieve(self, request, *args, **kwargs):
        obj = self.get_object()
        return Response(ReviewResponseSerializer(obj).data)


class ReviewConfigView(viewsets.GenericViewSet):
    """
    GET /writing/ai-config/available
      公开接口,前端用来判断是否可以用 AI(有全局 Key 或用户自己配了 Key)
      返回 {available:bool, effective_model, using_user_key:bool}
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        user = request.user if request.user and request.user.is_authenticated else None
        cfg: AIConfig = resolve_config(user)
        using_user = False
        if user and getattr(user, 'profile', None):
            if user.profile.ai_api_key:
                using_user = True
        return Response({
            'available': bool(cfg.api_key),
            'effective_base': cfg.base_url,
            'effective_model': cfg.model,
            'using_user_key': using_user,
        })
