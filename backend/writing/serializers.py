from rest_framework import serializers
from writing.models import EssayReview


class ReviewRequestSerializer(serializers.Serializer):
    """POST /writing/reviews"""
    year = serializers.IntegerField(min_value=2010, max_value=2099, required=True)
    essay = serializers.CharField(max_length=5000, min_length=30, required=True,
                                  help_text='用户提交的图表作文原文(英文)')
    chart_info = serializers.CharField(max_length=3000, required=False, allow_blank=True, default='',
                                       help_text='该年份图表核心数据描述,AI 用来核对是否描述正确')


class CorrectionSerializer(serializers.Serializer):
    original = serializers.CharField()
    improved = serializers.CharField()
    reason = serializers.CharField()


class ReviewResponseSerializer(serializers.ModelSerializer):
    corrections = CorrectionSerializer(many=True)
    scores = serializers.SerializerMethodField()

    class Meta:
        model = EssayReview
        fields = (
            'id', 'year', 'user_essay',
            'total_score', 'scores',
            's_data', 's_logic', 's_vocab', 's_grammar',
            'data_feedback', 'logic_feedback', 'summary',
            'corrections', 'ai_model', 'prompt_tokens', 'completion_tokens',
            'error_message', 'created_at',
        )
        read_only_fields = fields

    def get_scores(self, obj: EssayReview) -> dict:
        return {'data': float(obj.s_data), 'logic': float(obj.s_logic),
                'vocab': float(obj.s_vocab), 'grammar': float(obj.s_grammar)}
