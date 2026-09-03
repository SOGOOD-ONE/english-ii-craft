from django.db import models
from django.conf import settings


class Word(models.Model):
    """
    全局共享词典(所有用户共用的 lemma 条目):
    hover 查词时后端先查这个表,未命中再调 AI Provider,写回本缓存。
    """
    lemma = models.CharField(max_length=64, unique=True, db_index=True,
                             help_text='单词原型(还原成 lemma 后作为主键)')
    phonetic = models.CharField(max_length=128, blank=True, default='')
    senses = models.JSONField(default=list, blank=True,
                              help_text='[{"pos":"n","definition":"释义"}]')
    collocations = models.JSONField(default=list, blank=True, help_text='常见搭配字符串数组')
    # 审计
    cached_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '单词释义缓存'
        verbose_name_plural = verbose_name
        ordering = ('lemma',)

    def __str__(self):
        return self.lemma


class VocabCard(models.Model):
    """
    FSRS 用户生词卡(一个用户 × 一个 Word = 一张卡,支持多语境)。
    FSRS 字段对应 ts-fsrs 的 Card 结构。
    """
    STATE_NEW = 0
    STATE_LEARNING = 1
    STATE_REVIEW = 2
    STATE_RELEARNING = 3
    STATE_CHOICES = (
        (STATE_NEW, '新词'),
        (STATE_LEARNING, '学习中'),
        (STATE_REVIEW, '复习中'),
        (STATE_RELEARNING, '再学习'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vocab_cards')
    word = models.ForeignKey(Word, on_delete=models.PROTECT, related_name='cards')
    # 上下文(用户是在哪个句子里抓词的 / 来源年份)
    context_sentence = models.TextField(blank=True, default='')
    source_path = models.CharField(max_length=128, blank=True, default='',
                                   help_text='translation/2023 / writing/2021 / reading/2024-p1 ...')
    # FSRS 标准字段
    due = models.DateTimeField(db_index=True, help_text='下次复习到期时间')
    stability = models.FloatField(default=0.0)
    difficulty = models.FloatField(default=0.0)
    elapsed_days = models.IntegerField(default=0)
    scheduled_days = models.IntegerField(default=0)
    reps = models.IntegerField(default=0)
    lapses = models.IntegerField(default=0)
    state = models.SmallIntegerField(default=STATE_NEW, choices=STATE_CHOICES)
    last_review = models.DateTimeField(null=True, blank=True)
    # 业务掌握规则(FSRS + 额外业务叠加): 连续正确 N 次算掌握, 不复习
    consecutive_correct = models.SmallIntegerField(default=0)
    mastered = models.BooleanField(default=False, db_index=True, help_text='业务标记,掌握后不进 due 队列')
    # 元
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = '生词卡'
        verbose_name_plural = verbose_name
        unique_together = (('user', 'word', 'source_path'),)
        ordering = ('due',)
        indexes = [
            models.Index(fields=['user', 'due', 'mastered']),
        ]

    def __str__(self):
        return f'Card<{self.user.username}/{self.word.lemma}>'
