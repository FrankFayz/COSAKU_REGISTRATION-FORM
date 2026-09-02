from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("events", "0003_remove_registration_email"),
    ]

    operations = [
        migrations.AlterField(
            model_name="event",
            name="summary",
            field=models.CharField(blank=True, default="", max_length=200),
        ),
        migrations.AlterField(
            model_name="event",
            name="description",
            field=models.TextField(blank=True, default=""),
        ),
    ]
