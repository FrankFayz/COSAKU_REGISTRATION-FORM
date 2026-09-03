from django.db import migrations


def rewrite_phones(apps, schema_editor):
    from events.utils import normalize_ug_phone

    Registration = apps.get_model("events", "Registration")
    for row in Registration.objects.all():
        cleaned = normalize_ug_phone(row.phone)
        if cleaned and cleaned != row.phone:
            row.phone = cleaned
            row.save(update_fields=["phone"])


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0007_one_kab_email_per_event"),
    ]

    operations = [
        migrations.RunPython(rewrite_phones, migrations.RunPython.noop),
    ]
