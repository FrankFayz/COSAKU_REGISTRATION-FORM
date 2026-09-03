from datetime import timedelta

from django.test import SimpleTestCase
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Event, Registration
from .utils import normalize_ug_phone


class PhoneNormalizeTests(SimpleTestCase):
    def test_local_and_country_code(self):
        self.assertEqual(normalize_ug_phone("0700123456"), "0700123456")
        self.assertEqual(normalize_ug_phone("07 00 123 456"), "0700123456")
        self.assertEqual(normalize_ug_phone("700123456"), "0700123456")
        self.assertEqual(normalize_ug_phone("+256700123456"), "0700123456")
        self.assertEqual(normalize_ug_phone("+256 700 123 456"), "0700123456")
        self.assertEqual(normalize_ug_phone("256700123456"), "0700123456")
        self.assertEqual(normalize_ug_phone("00256700123456"), "0700123456")
        self.assertEqual(normalize_ug_phone("+2560700123456"), "0700123456")
        self.assertIsNone(normalize_ug_phone("abc"))



class RegisterOncePerEventTests(APITestCase):
    def setUp(self):
        now = timezone.now()
        self.event = Event.objects.create(
            slug="welcome-desk",
            title="Welcome desk",
            venue="FOCLIS Block",
            starts_at=now + timedelta(days=1),
            ends_at=now + timedelta(days=1, hours=3),
            is_published=True,
            is_closed=False,
        )

    def payload(self, email="student@kab.ac.ug"):
        return {
            "full_name": "Test Student",
            "gender": "Male",
            "kab_email": email,
            "phone": "0700123456",
            "programme": "Bachelor of Computer Science",
            "year_of_study": "Year 1",
        }

    def test_same_email_blocked_for_one_event(self):
        url = f"/api/events/{self.event.pk}/register/"
        first = self.client.post(url, self.payload(), format="json")
        self.assertEqual(first.status_code, 201)
        second = self.client.post(url, self.payload(), format="json")
        self.assertEqual(second.status_code, 400)
        self.assertEqual(Registration.objects.filter(event=self.event).count(), 1)

    def test_email_match_ignores_capital_letters(self):
        url = f"/api/events/{self.event.pk}/register/"
        first = self.client.post(url, self.payload("Student@KAB.ac.ug"), format="json")
        self.assertEqual(first.status_code, 201)
        second = self.client.post(url, self.payload("student@kab.ac.ug"), format="json")
        self.assertEqual(second.status_code, 400)
        self.assertEqual(Registration.objects.filter(event=self.event).count(), 1)

    def test_same_email_can_join_a_later_event(self):
        now = timezone.now()
        other = Event.objects.create(
            slug="workshop",
            title="Workshop",
            venue="FOCLIS Block",
            starts_at=now + timedelta(days=8),
            ends_at=now + timedelta(days=8, hours=3),
            is_published=True,
            is_closed=True,
        )
        url = f"/api/events/{self.event.pk}/register/"
        self.assertEqual(self.client.post(url, self.payload(), format="json").status_code, 201)
        other.is_closed = False
        other.save(update_fields=["is_closed"])
        later = self.client.post(f"/api/events/{other.pk}/register/", self.payload(), format="json")
        self.assertEqual(later.status_code, 201)
        self.assertEqual(Registration.objects.filter(kab_email="student@kab.ac.ug").count(), 2)
