from django.contrib import admin

from .models import Event, Registration


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "starts_at", "venue", "is_published", "is_closed", "is_featured", "show_public_details")
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ("title", "venue")

    def save_model(self, request, obj, form, change):
        obj.show_public_details = True
        super().save_model(request, obj, form, change)


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ("full_name", "kab_email", "event", "attended", "created_at")
    list_filter = ("attended", "event")
    search_fields = ("full_name", "kab_email", "phone")
