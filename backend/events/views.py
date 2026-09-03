import csv
import os

from django.db import DatabaseError, IntegrityError
from django.contrib.auth import authenticate, get_user_model
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
    return (
        Event.objects.filter(is_published=True, is_closed=False)
        .annotate(taken=Count("registrations"))
        .order_by("-updated_at", "starts_at")[:1]
    )


class PublicEventListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            events = open_events_qs()
            return Response(PublicEventSerializer(events, many=True).data)
        except DatabaseError:
            return Response(
                {"detail": "The registration desk is temporarily unavailable."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            event = Event.objects.annotate(taken=Count("registrations")).get(pk=pk)
        except Event.DoesNotExist:
            return Response({"detail": "Event not found."}, status=404)

        if not event.is_published or event.is_closed:
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
        email = (request.data.get("email") or request.data.get("username") or "").strip()
        password = request.data.get("password") or ""
        if not email or not password:
            return Response({"detail": "Enter your executive email and password."}, status=400)

        user = authenticate(request, username=email, password=password)
        if user is None:
            User = get_user_model()
            candidate = (
                User.objects.filter(username__iexact=email).first()
                or User.objects.filter(email__iexact=email).first()
            )
            if candidate:
                user = authenticate(request, username=candidate.username, password=password)

        expected_email = os.getenv("ADMIN_EMAIL", "admin@cosaku.kab.ac.ug").strip()
        expected_password = os.getenv("ADMIN_PASSWORD", "Cosaku@KAB2026")
        if user is None and email.lower() == expected_email.lower() and password == expected_password:
            User = get_user_model()
            admin = (
                User.objects.filter(username__iexact=expected_email).first()
                or User.objects.filter(email__iexact=expected_email).first()
            )
            if admin is None:
                admin = User(username=expected_email)
            admin.username = expected_email
            admin.email = expected_email
            admin.is_staff = True
            admin.is_superuser = True
            admin.is_active = True
            admin.set_password(expected_password)
            admin.save()
            user = authenticate(request, username=admin.username, password=expected_password)

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


class EventRegistrationDeskView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            event = Event.objects.annotate(taken=Count("registrations")).get(pk=pk)
        except Event.DoesNotExist:
            return Response(status=404)

        open_desk = bool(request.data.get("open"))
        if open_desk:
            Event.objects.exclude(pk=event.pk).update(is_closed=True)
            event.is_published = True
            event.is_closed = False
            event.show_public_details = True
            event.save(update_fields=["is_published", "is_closed", "show_public_details", "updated_at"])
        else:
            event.is_closed = True
            event.save(update_fields=["is_closed", "updated_at"])

        event = Event.objects.annotate(taken=Count("registrations")).get(pk=pk)
        return Response(AdminEventSerializer(event).data)


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
                "Gender",
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
                    row.gender,
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
