from django.db import models
from django.conf import settings


class EssayReview(models.Model):
    """图表大作文 AI 批改记录(完整 ReviewResponse 入库, 便于错题本/重看)"""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='essay_reviews')
    year = models.SmallIntegerField(db_index=True, help_text='真题年份')
    chart_info = models.TextField(blank=True, default='', help_text='传给 AI 的当前图表核心数据背景')
    user_essay = models.TextField(help_text='考生提交作文原文')
    # 4 维打分
    total_score = models.DecimalField(max_digits=4, decimal_places=1, default=0.0)
    s_data = models.DecimalField(max_digits=4, decimal_places=1, default=0.0, help_text='数据完整度(满分4)')
    s_logic = models.DecimalField(max_digits=4, decimal_places=1, default=0.0, help_text='归因论述逻辑(满分4)')
    s_vocab = models.DecimalField(max_digits=4, decimal_places=1, default=0.0, help_text='词汇句式丰富度(满分4)')
    s_grammar = models.DecimalField(max_digits=4, decimal_places=1, default=0.0, help_text='语法与拼写(满分3)')
    # 文字评价
    data_feedback = models.TextField(blank=True, default='')
    logic_feedback = models.TextField(blank=True, default='')
    summary = models.TextField(blank=True, default='')
    # 逐句润色: [{original,improved,reason}]
    corrections = models.JSONField(default=list, blank=True)
    # AI 审计
    ai_base_url = models.CharField(max_length=256, blank=True, default='')
    ai_model = models.CharField(max_length=64, blank=True, default='')
    prompt_tokens = models.IntegerField(default=0)
    completion_tokens = models.IntegerField(default=0)
    error_message = models.TextField(blank=True, default='', help_text='AI 调用失败时留的错误信息')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = '作文批改记录'
        verbose_name_plural = verbose_name
        ordering = ('-created_at',)

    def __str__(self):
        return f'EssayReview<{self.user.username}/{self.year} {self.total_score}/15>'
