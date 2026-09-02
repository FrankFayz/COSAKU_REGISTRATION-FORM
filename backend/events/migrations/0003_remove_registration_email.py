from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0002_kab_email_and_public_details"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="registration",
            name="email",
        ),
    ]
