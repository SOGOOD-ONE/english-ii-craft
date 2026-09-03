from rest_framework import serializers
from translation.models import TranslationAttempt


class AttemptRequestSerializer(serializers.Serializer):
    """POST /translation/attempts 提交一次翻译。"""
    year = serializers.IntegerField(min_value=2010, max_value=2099, required=True)
    slice_id = serializers.CharField(max_length=16, required=True, help_text='如 s1 s2')
    source_text = serializers.CharField(max_length=2000, required=False, allow_blank=True, default='',
                                        help_text='提交时冗余保存原文,方便前端 Diff 回看')
    user_translation = serializers.CharField(max_length=5000, required=True)


class AttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = TranslationAttempt
        fields = (
            'id', 'year', 'slice_id', 'source_text', 'user_translation', 'ref_zh',
            'diff_report', 'ai_feedback', 'created_at',
        )
        read_only_fields = ('ref_zh', 'diff_report', 'ai_feedback', 'created_at', 'id')
