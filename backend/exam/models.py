from django.db import models


class PaperMetadata(models.Model):
    """
    每一年真题元数据(可用性标志、结构化完成度)。
    真正的题目文本/参考译文/图表配置 仍然存 content/* 目录 JSON,避免 10MB+ 文本入库 SQLite 慢。
    """
    MODULE_CHOICES = (
        ('writing', '图表作文'),
        ('translation', '段落翻译'),
        ('reading', '阅读理解(Part A)'),  # 新增
        ('cloze', '完形填空'),
        ('newtype_b', '新题型 Part B(保留占位)'),
    )
    year = models.SmallIntegerField(db_index=True)
    module = models.CharField(max_length=16, choices=MODULE_CHOICES, db_index=True)
    title = models.CharField(max_length=256, blank=True, default='')
    has_ref_zh = models.BooleanField(default=False, help_text='有参考译文/参考答案')
    has_chart = models.BooleanField(default=False, help_text='写作:有结构化图表配置;阅读:有题干+选项')
    note = models.CharField(max_length=256, blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '真题元数据'
        verbose_name_plural = verbose_name
        unique_together = (('year', 'module'),)
        ordering = ('-year', 'module')

    def __str__(self):
        return f'{self.year} {self.get_module_display()}'
