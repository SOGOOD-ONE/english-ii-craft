from rest_framework import serializers
from vocab.models import Word, VocabCard
from vocab.fsrs import RATING_MAP


class WordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Word
        fields = ('id', 'lemma', 'phonetic', 'senses', 'collocations', 'cached_at')
        read_only_fields = ('id', 'cached_at')


class WordLookupRequestSerializer(serializers.Serializer):
    """POST /vocab/words/lookup"""
    word = serializers.CharField(max_length=64, required=True, help_text='待查英文单词')
    context = serializers.CharField(max_length=500, required=False, allow_blank=True, default='',
                                     help_text='所在句子上下文,用于消歧(建议传)')


class WordLookupResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    lemma = serializers.CharField()
    phonetic = serializers.CharField(allow_blank=True)
    senses = serializers.ListField(child=serializers.DictField())
    collocations = serializers.ListField(child=serializers.CharField())
    from_cache = serializers.BooleanField(help_text='是否来自本地缓存,未命中才 AI 调用')


class CardSerializer(serializers.ModelSerializer):
    word_detail = WordSerializer(source='word', read_only=True)

    class Meta:
        model = VocabCard
        fields = (
            'id', 'word', 'word_detail', 'context_sentence', 'source_path',
            'due', 'stability', 'difficulty', 'elapsed_days', 'scheduled_days',
            'reps', 'lapses', 'state', 'last_review',
            'consecutive_correct', 'mastered',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'due', 'stability', 'difficulty', 'elapsed_days', 'scheduled_days',
            'reps', 'lapses', 'state', 'last_review',
            'consecutive_correct', 'mastered', 'created_at', 'updated_at',
        )


class CardCreateRequestSerializer(serializers.Serializer):
    """POST /vocab/cards 创建卡(或找到已存在的直接返回)"""
    # 传 word_id 优先,不传时用 lemma 自动查找/创建(需传 lemma)
    word_id = serializers.IntegerField(required=False)
    lemma = serializers.CharField(max_length=64, required=False)
    # 提交 1 次查词结果时,前端可直接把后端 lookup 返回的 senses/phonetic/collocations 一起传
    senses = serializers.ListField(child=serializers.DictField(), required=False, default=list)
    phonetic = serializers.CharField(max_length=128, required=False, allow_blank=True, default='')
    collocations = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    context_sentence = serializers.CharField(max_length=1000, required=False, allow_blank=True, default='')
    source_path = serializers.CharField(max_length=128, required=False, allow_blank=True, default='')


class CardReviewRequestSerializer(serializers.Serializer):
    """POST /vocab/cards/{id}/review"""
    rating = serializers.ChoiceField(choices=list(RATING_MAP.keys()), required=True)


class CardReviewResponseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    due = serializers.DateTimeField()
    state = serializers.IntegerField()
    reps = serializers.IntegerField()
    lapses = serializers.IntegerField()
    consecutive_correct = serializers.IntegerField()
    mastered = serializers.BooleanField()
    stability = serializers.FloatField()
    difficulty = serializers.FloatField()
