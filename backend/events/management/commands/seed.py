from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils.dateparse import parse_datetime
from django.utils.timezone import make_aware
import os

from events.models import Event


class Command(BaseCommand):
    help = "Create the COSAKU admin user and seed the main event."

    def handle(self, *args, **options):
        User = get_user_model()
        email = os.getenv("ADMIN_EMAIL", "admin@cosaku.kab.ac.ug")
        password = os.getenv("ADMIN_PASSWORD", "Cosaku@KAB2026")
        user, created = User.objects.get_or_create(
            username=email,
            defaults={"email": email, "is_staff": True, "is_superuser": True},
        )
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()
        self.stdout.write(self.style.SUCCESS("Admin ready" if created else "Admin updated"))

        removed, _ = Event.objects.filter(slug="foclis-hackathon-2026").delete()
        if removed:
            self.stdout.write(self.style.WARNING("Removed FOCLIS Hackathon 2026 and its registrations."))

        Event.objects.update_or_create(
            slug="cosaku-welcome-semester",
            defaults={
                "title": "COSAKU Welcome & Membership Desk",
                "summary": "Meet the executive, pick a community, and register in one minute.",
                "description": (
                    "The Computing Students Association of Kabale University invites every FOCLIS student "
                    "to the semester welcome desk. Meet the executive, hear this semester’s calendar, "
                    "and get on the official register for workshops and industry sessions."
                ),
                "venue": "FOCLIS Block, Kikungiri Campus",
                "starts_at": make_aware(parse_datetime("2026-09-12 14:00:00")),
                "ends_at": make_aware(parse_datetime("2026-09-12 17:00:00")),
                "capacity": 200,
                "is_published": True,
                "is_featured": True,
                "extra_question": "",
                "extra_question_required": False,
            },
        )
        self.stdout.write(self.style.SUCCESS("Welcome event seeded."))
