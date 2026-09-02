from rest_framework import serializers

from .models import Event, Registration
from .utils import is_kab_email, normalize_kab_email, normalize_ug_phone, unique_slug

PROGRAMMES = [
    "Bachelor of Computer Science",
    "Bachelor of Information Technology",
    "Bachelor of Library and Information Science",
    "Diploma in Computer Science",
    "Diploma in Information Technology",
    "Diploma in Library and Information Science",
    "Other FOCLIS programme",
]

YEARS = ["Year 1", "Year 2", "Year 3", "Year 4", "Postgraduate"]


class PublicEventSerializer(serializers.ModelSerializer):
    taken = serializers.SerializerMethodField()
    seats_left = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            "id",
            "slug",
            "title",
            "summary",
            "description",
            "venue",
            "starts_at",
            "ends_at",
            "capacity",
            "is_featured",
            "show_public_details",
            "extra_question",
            "extra_question_required",
            "taken",
            "seats_left",
            "is_full",
        )

    def get_taken(self, obj):
        value = getattr(obj, "taken", None)
        if isinstance(value, int):
            return value
        return obj.registrations.count()

    def get_seats_left(self, obj):
        if not obj.capacity:
            return None
        return max(obj.capacity - self.get_taken(obj), 0)

    def get_is_full(self, obj):
        left = self.get_seats_left(obj)
        return left == 0


class RegistrationCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=80)
    kab_email = serializers.EmailField()
    phone = serializers.CharField(max_length=30)
    programme = serializers.ChoiceField(choices=[(p, p) for p in PROGRAMMES])
    year_of_study = serializers.ChoiceField(choices=[(y, y) for y in YEARS])
    extra_answer = serializers.CharField(max_length=240, required=False, allow_blank=True)

    def validate_kab_email(self, value):
        cleaned = normalize_kab_email(value)
        if not is_kab_email(cleaned):
            raise serializers.ValidationError("Use your Kabale University email.")
        return cleaned

    def validate_phone(self, value):
        phone = normalize_ug_phone(value)
        if not phone:
            raise serializers.ValidationError("Use a number like 07XX XXX XXX.")
        return phone

    def validate(self, attrs):
        event: Event = self.context["event"]
        if event.extra_question and event.extra_question_required and not attrs.get("extra_answer"):
            raise serializers.ValidationError({"extra_answer": "This answer is required."})
        return attrs


class RegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Registration
        fields = (
            "id",
            "full_name",
            "kab_email",
            "phone",
            "programme",
            "year_of_study",
            "extra_answer",
            "attended",
            "created_at",
            "event",
        )


class AdminEventSerializer(serializers.ModelSerializer):
    taken = serializers.SerializerMethodField()
    seats_left = serializers.SerializerMethodField()
    registered_count = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = (
            "id",
            "slug",
            "title",
            "summary",
            "description",
            "venue",
            "starts_at",
            "ends_at",
            "capacity",
            "is_published",
            "is_closed",
            "is_featured",
            "show_public_details",
            "extra_question",
            "extra_question_required",
            "taken",
            "seats_left",
            "registered_count",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("slug", "created_at", "updated_at", "show_public_details")

    def get_taken(self, obj):
        value = getattr(obj, "taken", None)
        if isinstance(value, int):
            return value
        return obj.registrations.count()

    def get_registered_count(self, obj):
        return self.get_taken(obj)

    def get_seats_left(self, obj):
        if not obj.capacity:
            return None
        return max(obj.capacity - self.get_taken(obj), 0)

    def create(self, validated_data):
        if validated_data.get("is_featured"):
            Event.objects.update(is_featured=False)
        validated_data["slug"] = unique_slug(validated_data["title"])
        validated_data["show_public_details"] = True
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if validated_data.get("is_featured"):
            Event.objects.exclude(pk=instance.pk).update(is_featured=False)
        validated_data["show_public_details"] = True
        return super().update(instance, validated_data)
