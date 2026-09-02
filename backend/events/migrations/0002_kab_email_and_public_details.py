from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import migrations, models

KAB_DOMAIN = "@kab.ac.ug"


def migrate_identity_and_clear_questions(apps, schema_editor):
    Event = apps.get_model("events", "Event")
    Registration = apps.get_model("events", "Registration")

    Event.objects.update(extra_question="", extra_question_required=False)

    seen = set()
    for row in Registration.objects.order_by("created_at"):
        raw = (row.student_number or "").strip().lower()
        try:
            validate_email(raw)
        except ValidationError:
            row.delete()
            continue
        if not raw.endswith(KAB_DOMAIN):
            row.delete()
            continue
        key = (row.event_id, raw)
        if key in seen:
            row.delete()
            continue
        seen.add(key)
        row.kab_email = raw
        row.save(update_fields=["kab_email"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="event",
            name="show_public_details",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="registration",
            name="kab_email",
            field=models.EmailField(max_length=254, null=True),
        ),
        migrations.AlterUniqueTogether(
            name="registration",
            unique_together=set(),
        ),
        migrations.RunPython(migrate_identity_and_clear_questions, noop_reverse),
        migrations.AlterField(
            model_name="registration",
            name="kab_email",
            field=models.EmailField(max_length=254),
        ),
        migrations.RemoveField(
            model_name="registration",
            name="student_number",
        ),
        migrations.AlterUniqueTogether(
            name="registration",
            unique_together={("event", "kab_email")},
        ),
    ]
