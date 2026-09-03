import re

from django.utils.text import slugify

KAB_EMAIL_DOMAIN = "@kab.ac.ug"


def normalize_kab_email(value: str) -> str:
    return value.strip().lower()


def is_kab_email(value: str) -> bool:
    return normalize_kab_email(value).endswith(KAB_EMAIL_DOMAIN)


def normalize_ug_phone(value: str) -> str | None:
    digits = re.sub(r"\D", "", value or "")
    if digits.startswith("00"):
        digits = digits[2:]
    if digits.startswith("2560") and len(digits) == 13:
        digits = digits[3:]
    elif digits.startswith("256") and len(digits) == 12 and digits[3] == "7":
        digits = f"0{digits[3:]}"

    if len(digits) == 10 and digits.startswith("07"):
        return digits
    if len(digits) == 9 and digits.startswith("7"):
        return f"0{digits}"
    if 8 <= len(digits) <= 15 and not digits.startswith("0"):
        return digits
    return None


def unique_slug(title: str, exclude_id: int | None = None) -> str:
    from .models import Event

    base = slugify(title)[:72] or "event"
    slug = base
    n = 2
    while True:
        qs = Event.objects.filter(slug=slug)
        if exclude_id:
            qs = qs.exclude(pk=exclude_id)
        if not qs.exists():
            return slug
        slug = f"{base}-{n}"
        n += 1
