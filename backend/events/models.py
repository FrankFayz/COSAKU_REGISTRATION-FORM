from django.db import models


class Event(models.Model):
    slug = models.SlugField(unique=True, max_length=80)
    title = models.CharField(max_length=120)
    summary = models.CharField(max_length=200, blank=True, default="")
    description = models.TextField(blank=True, default="")
    venue = models.CharField(max_length=120)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    capacity = models.PositiveIntegerField(null=True, blank=True)
    is_published = models.BooleanField(default=True)
    is_closed = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    show_public_details = models.BooleanField(default=False)
    extra_question = models.CharField(max_length=160, blank=True)
    extra_question_required = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_featured", "starts_at"]

    def __str__(self):
        return self.title


class Registration(models.Model):
    event = models.ForeignKey(Event, related_name="registrations", on_delete=models.CASCADE)
    full_name = models.CharField(max_length=80)
    kab_email = models.EmailField()
    phone = models.CharField(max_length=20)
    programme = models.CharField(max_length=80)
    year_of_study = models.CharField(max_length=20)
    extra_answer = models.CharField(max_length=240, blank=True)
    gender = models.CharField(max_length=24, blank=True, default="")
    attended = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("event", "kab_email")
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.full_name} · {self.kab_email}"
