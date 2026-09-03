from django.db import models
from accounts.models import Device


class TranslationAttempt(models.Model):
    """段落翻译:设备逐句翻译的提交记录 + Diff结果 + 可选AI润色"""
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='trans_attempts', null=True, blank=True)
    year = models.SmallIntegerField(db_index=True)
    slice_id = models.CharField(max_length=16, help_text='如 s1/s2/s10, 对应 content/translation/<year>.json 的 slice.id')
    source_text = models.TextField(blank=True, default='', help_text='冗余存一份原文,前端直接拿了做 Diff 展示')
    user_translation = models.TextField()
    ref_zh = models.TextField(blank=True, default='', help_text='提交时后端的参考译文快照(如果有)')
    # jsdiff / diff-match-patch 字符级对比结果,前端可直接渲染红绿高亮
    diff_report = models.JSONField(default=dict, blank=True,
                                    help_text='{equal:[{idx,text}],added:[{idx,text}],removed:[{idx,text}]}')
    # AI 润色
    ai_feedback = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = '翻译提交记录'
        verbose_name_plural = verbose_name
        ordering = ('-created_at',)

    def __str__(self):
        return f'TransAttempt<{self.device.device_id if self.device else "None"}/{self.year}-{self.slice_id}>'
