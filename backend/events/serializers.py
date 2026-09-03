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
GENDERS = ["Male", "Female"]


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
    gender = serializers.ChoiceField(choices=[(g, g) for g in GENDERS])
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
            "gender",
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
        extra_kwargs = {
            "summary": {"required": False, "allow_blank": True},
            "description": {"required": False, "allow_blank": True},
            "capacity": {"required": False, "allow_null": True},
            "extra_question": {"required": False, "allow_blank": True},
            "extra_question_required": {"required": False},
            "is_featured": {"required": False},
            "is_closed": {"required": False},
            "is_published": {"required": False},
        }

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

    def validate(self, attrs):
        starts = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        ends = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        if not starts or not ends:
            raise serializers.ValidationError("Starts and ends are required.")
        if ends <= starts:
            raise serializers.ValidationError({"ends_at": "The event must end after it starts."})

        clash = Event.objects.filter(starts_at__lt=ends, ends_at__gt=starts)
        if self.instance:
            clash = clash.exclude(pk=self.instance.pk)
        clash = clash.order_by("starts_at").first()
        if clash:
            raise serializers.ValidationError(
                f'This time overlaps “{clash.title}”. COSAKU runs one event at a time.'
            )
        return attrs

    def create(self, validated_data):
        if validated_data.get("is_featured"):
            Event.objects.update(is_featured=False)
        validated_data["slug"] = unique_slug(validated_data["title"])
        validated_data["show_public_details"] = True
        validated_data["is_published"] = True
        validated_data["is_closed"] = True
        validated_data.setdefault("summary", validated_data["title"])
        validated_data.setdefault("description", "")
        validated_data.setdefault("capacity", None)
        validated_data.setdefault("extra_question", "")
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if validated_data.get("is_featured"):
            Event.objects.exclude(pk=instance.pk).update(is_featured=False)
        validated_data.pop("is_closed", None)
        validated_data.pop("is_published", None)
        validated_data["show_public_details"] = True
        return super().update(instance, validated_data)
