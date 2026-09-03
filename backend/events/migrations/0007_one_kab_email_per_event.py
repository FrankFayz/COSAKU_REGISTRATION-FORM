from django.db import migrations, models
from django.db.models.functions import Lower


def lowercase_and_dedupe(apps, schema_editor):
    Registration = apps.get_model("events", "Registration")
    for row in Registration.objects.all():
        cleaned = (row.kab_email or "").strip().lower()
        if row.kab_email != cleaned:
            row.kab_email = cleaned
            row.save(update_fields=["kab_email"])

    seen = set()
    for row in Registration.objects.order_by("created_at", "id"):
        key = (row.event_id, (row.kab_email or "").lower())
        if key in seen:
            row.delete()
        else:
            seen.add(key)


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0006_one_event_desk"),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name="registration",
            unique_together=set(),
        ),
        migrations.RunPython(lowercase_and_dedupe, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name="registration",
            constraint=models.UniqueConstraint(
                "event",
                Lower("kab_email"),
                name="uniq_registration_event_kab_email_ci",
            ),
        ),
    ]
