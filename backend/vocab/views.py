from datetime import datetime, timezone

from drf_spectacular.utils import extend_schema
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from vocab.fsrs import schedule_card, new_default_card_fields
from vocab.models import Word, VocabCard
from vocab.serializers import (
    WordLookupRequestSerializer, WordLookupResponseSerializer,
    WordSerializer, CardSerializer, CardCreateRequestSerializer,
    CardReviewRequestSerializer, CardReviewResponseSerializer,
)
from ai_provider.services import lookup_word


# -------- Word 相关: 只允许后端 admin 改, 前端只查/通过 lookup 写入缓存 --------
class WordLookupView(APIView):
    """
    POST /vocab/words/lookup
      - 先查 Word 表,命中直接返回(from_cache=true)
      - 未命中才调 AI, 查得后写缓存返回(from_cache=false)
      - 允许匿名设备查词
    """
    permission_classes = [AllowAny]

    @extend_schema(request=WordLookupRequestSerializer, responses=WordLookupResponseSerializer)
    def post(self, request):
        req = WordLookupRequestSerializer(data=request.data)
        req.is_valid(raise_exception=True)
        word_raw = req.validated_data['word'].strip().lower().strip("'\"-,.!?;:()[]{}")
        context = req.validated_data.get('context') or ''
        # 查缓存
        cached = Word.objects.filter(lemma=word_raw).first()
        if cached:
            return Response({
                'id': cached.id, 'lemma': cached.lemma, 'phonetic': cached.phonetic,
                'senses': cached.senses[:2], 'collocations': cached.collocations[:3],
                'from_cache': True,
            })
        # 调 AI
        device: Word | None = getattr(request, 'device', None)
        try:
            result = lookup_word(device, word_raw, context)
        except RuntimeError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        obj, _ = Word.objects.update_or_create(
            lemma=result.lemma or word_raw,
            defaults={
                'phonetic': result.phonetic,
                'senses': result.senses,
                'collocations': result.collocations,
            }
        )
        return Response({
            'id': obj.id, 'lemma': obj.lemma, 'phonetic': obj.phonetic,
            'senses': obj.senses[:2], 'collocations': obj.collocations[:3],
            'from_cache': False,
        })


class CardViewSet(mixins.ListModelMixin,
                  mixins.CreateModelMixin,
                  mixins.RetrieveModelMixin,
                  mixins.DestroyModelMixin,
                  viewsets.GenericViewSet):
    """
    Vocab Card (FSRS 复习卡):
      GET  /cards             ?due=1 只取 due & 未掌握; ?mastered=1 只取已掌握
      POST /cards             加 1 张生词(无 due 则默认 new_card due=now)
      GET  /cards/{id}
      DELETE /cards/{id}
      POST /cards/{id}/review  {rating:'Again|Hard|Good|Easy'} → 后端 FSRS 调度,返回新 due/state/...
    """
    permission_classes = [AllowAny]
    serializer_class = CardSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        device: Word | None = getattr(self.request, 'device', None)
        if not device:
            return VocabCard.objects.none()
        qs = VocabCard.objects.filter(device=device).select_related('word')
        due = self.request.query_params.get('due')
        mastered = self.request.query_params.get('mastered')
        if due in ('1', 'true', 'True'):
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            qs = qs.filter(mastered=False, due__lte=now)
        if mastered in ('1', 'true', 'True'):
            qs = qs.filter(mastered=True)
        return qs.order_by('due')

    def create(self, request, *args, **kwargs):
        device: Word | None = getattr(request, 'device', None)
        if not device:
            return Response({'detail': '缺少 X-Device-Id 请求头'}, status=status.HTTP_400_BAD_REQUEST)
        s = CardCreateRequestSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        d = s.validated_data
        # 1. 找/建 Word
        if d.get('word_id'):
            word = Word.objects.get(id=d['word_id'])
        elif d.get('lemma'):
            defaults = {
                'phonetic': d.get('phonetic') or '',
                'senses': d.get('senses') or [],
                'collocations': d.get('collocations') or [],
            }
            word, _ = Word.objects.update_or_create(lemma=d['lemma'].strip().lower(), defaults=defaults)
        else:
            return Response({'detail': '请传 word_id 或 lemma'}, status=status.HTTP_400_BAD_REQUEST)
        # 2. 找已存在卡(按 device + word + source_path 组合唯一)
        card, created = VocabCard.objects.get_or_create(
            device=device, word=word, source_path=(d.get('source_path') or ''),
            defaults={
                'context_sentence': d.get('context_sentence') or '',
                **new_default_card_fields(),
            }
        )
        if not created:
            # 更新上下文(更贴近用户现在看到的句子更好)
            if d.get('context_sentence'):
                card.context_sentence = d['context_sentence']
                card.save(update_fields=['context_sentence', 'updated_at'])
        headers = self.get_success_headers(CardSerializer(card).data)
        return Response(CardSerializer(card).data,
                        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
                        headers=headers)

    @extend_schema(request=CardReviewRequestSerializer, responses=CardReviewResponseSerializer)
    @action(detail=True, methods=['post'], url_path='review')
    def review(self, request, pk=None):
        card: VocabCard = self.get_object()
        req = CardReviewRequestSerializer(data=request.data)
        req.is_valid(raise_exception=True)
        fields = schedule_card(card, req.validated_data['rating'], getattr(request, 'device', None))
        for k, v in fields.items():
            setattr(card, k, v)
        card.save(update_fields=list(fields.keys()) + ['updated_at'])
        return Response({
            'id': card.id, 'due': card.due, 'state': card.state,
            'reps': card.reps, 'lapses': card.lapses,
            'consecutive_correct': card.consecutive_correct,
            'mastered': card.mastered,
            'stability': card.stability, 'difficulty': card.difficulty,
        })
