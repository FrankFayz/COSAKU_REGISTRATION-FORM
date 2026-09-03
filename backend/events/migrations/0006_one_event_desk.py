from datetime import timedelta

from django.db import migrations, models


def fill_ends_and_one_open_desk(apps, schema_editor):
    Event = apps.get_model("events", "Event")
    for event in Event.objects.filter(ends_at__isnull=True):
        event.ends_at = event.starts_at + timedelta(hours=2)
        event.save(update_fields=["ends_at"])

    open_desks = list(Event.objects.filter(is_closed=False).order_by("starts_at", "id"))
    for extra in open_desks[1:]:
        extra.is_closed = True
        extra.save(update_fields=["is_closed"])


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0005_registration_gender"),
    ]

    operations = [
        migrations.RunPython(fill_ends_and_one_open_desk, noop),
        migrations.AlterField(
            model_name="event",
            name="ends_at",
            field=models.DateTimeField(),
        ),
    ]
