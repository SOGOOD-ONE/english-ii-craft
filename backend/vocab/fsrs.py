"""
FSRS v5 调度封装(py-fsrs 官方包名 `fsrs>=5`)
  - new_card_fields()    返回 due=now 的默认卡字段
  - schedule(card, rating) 复习一次,返回要更新到 DB 的字段 dict

注意:py-fsrs v5 的 `Card` 本体只带精简字段(state/stability/difficulty/due/last_review/step),
reps/lapses/scheduled_days 等信息在官方 v5 Python 包里不作为卡字段保存,我们在业务层(VocabCard)累加:
  - 每次复习 reps + 1
  - rating == Again 时 lapses + 1
  - scheduled_days 用 due - last_review 的天数差
"""
from __future__ import annotations

from datetime import datetime, timezone, timedelta
from typing import Literal, Any

try:
    from fsrs import Scheduler, Card, Rating
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        "py-fsrs not installed. Run: python -m pip install 'fsrs>=5,<6'"
    ) from exc

from vocab.models import VocabCard

RatingType = Literal['Again', 'Hard', 'Good', 'Easy']
RATING_MAP: dict[str, Rating] = {
    'Again': Rating.Again,
    'Hard': Rating.Hard,
    'Good': Rating.Good,
    'Easy': Rating.Easy,
}

_scheduler = Scheduler()


def _to_fsrs_card(card: VocabCard) -> Card:
    c = Card()
    # py-fsrs v5 Card 支持 from_dict({state,stability,difficulty,due,last_review})
    # 为了避免字段差异,直接对属性赋值
    c.state = int(card.state or c.state)
    c.stability = float(card.stability) if card.stability else c.stability
    c.difficulty = float(card.difficulty) if card.difficulty else c.difficulty
    if card.due:
        c.due = card.due.replace(tzinfo=timezone.utc) if card.due.tzinfo is None else card.due
    if card.last_review:
        c.last_review = (card.last_review.replace(tzinfo=timezone.utc)
                         if card.last_review.tzinfo is None else card.last_review)
    return c


def new_default_card_fields() -> dict[str, Any]:
    c = Card()
    return {
        'due': c.due.replace(tzinfo=None),
        'stability': c.stability,
        'difficulty': c.difficulty,
        'elapsed_days': 0,
        'scheduled_days': 0,
        'reps': 0,
        'lapses': 0,
        'state': int(c.state or 0),
        'last_review': None,
        'consecutive_correct': 0,
        'mastered': False,
    }


def schedule_card(card: VocabCard, rating: RatingType,
                  device: Any | None = None,
                  now: datetime | None = None) -> dict[str, Any]:
    now_dt = (now or datetime.now(timezone.utc))
    if now_dt.tzinfo is None:
        now_dt = now_dt.replace(tzinfo=timezone.utc)

    prev_reps = int(card.reps or 0)
    prev_lapses = int(card.lapses or 0)
    new_reps = prev_reps + 1
    new_lapses = prev_lapses + (1 if rating == 'Again' else 0)

    fsrs_card = _to_fsrs_card(card)
    next_card, _log = _scheduler.review_card(fsrs_card, RATING_MAP[rating], review_datetime=now_dt)

    # 业务掌握规则(连续 Good/Easy N 次 算掌握)
    mastery_threshold = 2
    if device:
        try:
            mastery_threshold = int(device.mastery_required or 2)
        except Exception:
            pass
    is_recognized = rating in ('Good', 'Easy')
    consecutive = (int(card.consecutive_correct or 0) + 1) if is_recognized else 0
    mastered = consecutive >= mastery_threshold

    def _strip_tz(dt):
        if dt is None:
            return None
        return dt.replace(tzinfo=None) if dt.tzinfo else dt

    # scheduled_days: 下次 due 与本次 review 的间隔天数
    scheduled_days = 0
    try:
        delta: timedelta = next_card.due - now_dt
        scheduled_days = int(delta.total_seconds() // 86400)
    except Exception:
        scheduled_days = 0

    # elapsed_days: 距离上次复习过去了几天
    if card.last_review:
        base = card.last_review if card.last_review.tzinfo else card.last_review.replace(tzinfo=timezone.utc)
        elapsed_days = int((now_dt - base).total_seconds() // 86400)
    else:
        elapsed_days = 0

    return {
        'due': _strip_tz(next_card.due),
        'stability': float(next_card.stability),
        'difficulty': float(next_card.difficulty),
        'elapsed_days': max(0, elapsed_days),
        'scheduled_days': max(0, scheduled_days),
        'reps': new_reps,
        'lapses': new_lapses,
        'state': int(next_card.state or 0),
        'last_review': _strip_tz(next_card.last_review) or now_dt.replace(tzinfo=None),
        'consecutive_correct': consecutive,
        'mastered': mastered,
    }
