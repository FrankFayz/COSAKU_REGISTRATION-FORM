from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0004_optional_event_copy"),
    ]

    operations = [
        migrations.AddField(
            model_name="registration",
            name="gender",
            field=models.CharField(blank=True, default="", max_length=24),
        ),
    ]
