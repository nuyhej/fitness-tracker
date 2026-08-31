import logging
from datetime import datetime, date, time, timezone, timedelta
from typing import Optional, Union
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

logger = logging.getLogger("jjinfit.timezone")

DEFAULT_TIMEZONE = "Asia/Seoul"

# Built-in fixed offset fallback dictionary for environments without tzdata
OFFSET_MAP = {
    "asia/seoul": timezone(timedelta(hours=9)),
    "asia/tokyo": timezone(timedelta(hours=9)),
    "kst": timezone(timedelta(hours=9)),
    "jst": timezone(timedelta(hours=9)),
    "utc": timezone.utc,
    "gmt": timezone.utc,
    "america/new_york": timezone(timedelta(hours=-4)),  # EDT
    "america/chicago": timezone(timedelta(hours=-5)),   # CDT
    "america/denver": timezone(timedelta(hours=-6)),    # MDT
    "america/los_angeles": timezone(timedelta(hours=-7)), # PDT
    "europe/london": timezone(timedelta(hours=1)),     # BST
    "europe/paris": timezone(timedelta(hours=2)),      # CEST
    "asia/singapore": timezone(timedelta(hours=8)),
    "asia/bangkok": timezone(timedelta(hours=7)),
    "australia/sydney": timezone(timedelta(hours=10)),
    "pacific/auckland": timezone(timedelta(hours=12)),
}


def get_tz(tz_name: Optional[str] = None) -> Union[ZoneInfo, timezone]:
    """
    Safely return a ZoneInfo or timezone object for the given timezone string.
    Falls back to 'Asia/Seoul' (+09:00) if invalid or missing.
    """
    if not tz_name or not isinstance(tz_name, str) or not tz_name.strip():
        tz_name = DEFAULT_TIMEZONE

    clean_name = tz_name.strip()
    try:
        return ZoneInfo(clean_name)
    except (ZoneInfoNotFoundError, Exception):
        lower = clean_name.lower()
        if lower in OFFSET_MAP:
            return OFFSET_MAP[lower]
        if "+09" in lower or "korea" in lower or "seoul" in lower:
            return OFFSET_MAP["asia/seoul"]
        if "new york" in lower or "newyork" in lower:
            return OFFSET_MAP["america/new_york"]
        if "los angeles" in lower or "la" in lower:
            return OFFSET_MAP["america/los_angeles"]
        logger.warning(f"[get_tz] Unknown timezone '{tz_name}', falling back to {DEFAULT_TIMEZONE}")
        return OFFSET_MAP.get(DEFAULT_TIMEZONE.lower(), timezone(timedelta(hours=9)))


def resolve_request_tz(
    header_tz: Optional[str] = None,
    user_tz: Optional[str] = None
) -> Union[ZoneInfo, timezone]:
    """
    Resolve effective timezone by priority:
    1. HTTP header (X-Timezone) if provided by client/browser/shortcut
    2. User account profile preference (users.timezone)
    3. Default ('Asia/Seoul')
    """
    if header_tz and header_tz.strip():
        return get_tz(header_tz)
    if user_tz and user_tz.strip():
        return get_tz(user_tz)
    return get_tz(DEFAULT_TIMEZONE)


def now_in_tz(tz: Union[ZoneInfo, timezone, str]) -> datetime:
    """Return the current datetime in the specified timezone."""
    zone = tz if isinstance(tz, (ZoneInfo, timezone)) else get_tz(tz)
    return datetime.now(zone)


def today_in_tz(tz: Union[ZoneInfo, timezone, str]) -> date:
    """Return today's date in the specified timezone."""
    return now_in_tz(tz).date()


def time_in_tz(tz: Union[ZoneInfo, timezone, str]) -> time:
    """Return the current time in the specified timezone."""
    return now_in_tz(tz).time()


def to_local_naive_dt(
    dt_val: Optional[Union[datetime, str]],
    target_tz: Union[ZoneInfo, timezone, str]
) -> Optional[datetime]:
    """
    Standardize incoming datetime into a naive datetime representing the wall-clock time
    in the target timezone (suitable for uniform storage in SQLite).

    - If None: returns None
    - If timezone-aware (e.g. 2026-08-31T12:00:00Z with UTC or 2026-08-31T08:00:00-04:00):
      converts to target_tz and strips tzinfo (e.g. 2026-08-31 21:00:00).
    - If naive (e.g. 2026-08-31 21:00:00):
      assumes it is already the intended wall-clock time in target_tz.
    """
    if dt_val is None:
        return None

    zone = target_tz if isinstance(target_tz, (ZoneInfo, timezone)) else get_tz(target_tz)

    if isinstance(dt_val, str):
        cleaned = dt_val.strip().replace("Z", "+00:00")
        try:
            dt_obj = datetime.fromisoformat(cleaned)
        except Exception:
            return None
    elif isinstance(dt_val, datetime):
        dt_obj = dt_val
    else:
        return None

    if dt_obj.tzinfo is not None:
        # Aware -> convert to target zone and strip tzinfo for DB
        converted = dt_obj.astimezone(zone)
        return converted.replace(tzinfo=None)
    else:
        # Naive -> already wall-clock time
        return dt_obj
