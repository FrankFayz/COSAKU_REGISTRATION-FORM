import csv
from datetime import timedelta

from django.db import IntegrityError
from django.contrib.auth import authenticate
from django.db.models import Count
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Event, Registration
from .serializers import (
    AdminEventSerializer,
    PublicEventSerializer,
    RegistrationCreateSerializer,
    RegistrationSerializer,
)


class ApiRootView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "name": "COSAKU API",
                "events": "/api/events/",
                "register": "/api/events/<id>/register/",
                "login": "/api/auth/login/",
            }
        )


def open_events_qs():
    horizon = timezone.now() - timedelta(hours=6)
    return (
        Event.objects.filter(is_published=True, is_closed=False, starts_at__gt=horizon)
        .annotate(taken=Count("registrations"))
        .order_by("-is_featured", "starts_at")
    )


class PublicEventListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        events = open_events_qs()
        return Response(PublicEventSerializer(events, many=True).data)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            event = Event.objects.annotate(taken=Count("registrations")).get(pk=pk)
        except Event.DoesNotExist:
            return Response({"detail": "Event not found."}, status=404)

        if not event.is_published:
            return Response({"detail": "This event is not open for registration."}, status=400)
        if event.is_closed or event.starts_at < timezone.now() - timedelta(hours=12):
            return Response({"detail": "Registration for this event has closed."}, status=400)
        if event.capacity and event.taken >= event.capacity:
            return Response({"detail": "This event is full. Please try another COSAKU event."}, status=400)

        serializer = RegistrationCreateSerializer(data=request.data, context={"event": event})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if Registration.objects.filter(event=event, kab_email=data["kab_email"]).exists():
            return Response(
                {"detail": "This Kab email is already registered for this event."},
                status=400,
            )

        try:
            registration = Registration.objects.create(event=event, **data)
        except IntegrityError:
            return Response(
                {"detail": "This Kab email is already registered for this event."},
                status=400,
            )
        payload = RegistrationSerializer(registration).data
        payload["event_title"] = event.title
        payload["venue"] = event.venue
        payload["starts_at"] = event.starts_at
        return Response(payload, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip()
        password = request.data.get("password") or ""
        user = authenticate(request, username=email, password=password)
        if user is None or not user.is_active:
            return Response({"detail": "Those executive details were not accepted."}, status=400)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({"token": token.key, "email": user.email or user.username})


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({"ok": True})


class StatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now = timezone.now()
        return Response(
            {
                "events": Event.objects.count(),
                "upcoming": Event.objects.filter(
                    is_published=True, is_closed=False, starts_at__gte=now
                ).count(),
                "registrations": Registration.objects.count(),
                "attended": Registration.objects.filter(attended=True).count(),
            }
        )


class AdminEventListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        events = Event.objects.annotate(taken=Count("registrations")).order_by("-starts_at")
        return Response(AdminEventSerializer(events, many=True).data)

    def post(self, request):
        serializer = AdminEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminEventDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return Event.objects.annotate(taken=Count("registrations")).get(pk=pk)

    def get(self, request, pk):
        try:
            event = self.get_object(pk)
        except Event.DoesNotExist:
            return Response(status=404)
        data = AdminEventSerializer(event).data
        data["registrations"] = RegistrationSerializer(event.registrations.all(), many=True).data
        return Response(data)

    def put(self, request, pk):
        return self._update(request, pk, partial=False)

    def patch(self, request, pk):
        return self._update(request, pk, partial=True)

    def _update(self, request, pk, partial):
        try:
            event = self.get_object(pk)
        except Event.DoesNotExist:
            return Response(status=404)
        serializer = AdminEventSerializer(event, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            return Response(status=404)
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EventCSVView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            event = Event.objects.get(pk=pk)
        except Event.DoesNotExist:
            return Response(status=404)
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="COSAKU-{event.slug}-registrations.csv"'
        writer = csv.writer(response)
        writer.writerow(
            [
                "Full name",
                "Kab Email",
                "WhatsApp number",
                "Programme",
                "Year of study",
                "Extra answer",
                "Attended",
                "Registered at",
            ]
        )
        for row in event.registrations.all():
            writer.writerow(
                [
                    row.full_name,
                    row.kab_email,
                    row.phone,
                    row.programme,
                    row.year_of_study,
                    row.extra_answer,
                    "Yes" if row.attended else "No",
                    row.created_at.isoformat(),
                ]
            )
        return response


class AttendanceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            registration = Registration.objects.get(pk=pk)
        except Registration.DoesNotExist:
            return Response(status=404)
        registration.attended = not registration.attended
        registration.save(update_fields=["attended"])
        return Response(RegistrationSerializer(registration).data)


class RecentRegistrationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rows = Registration.objects.select_related("event").order_by("-created_at")[:8]
        data = []
        for row in rows:
            item = RegistrationSerializer(row).data
            item["event_title"] = row.event.title
            data.append(item)
        return Response(data)
