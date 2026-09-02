from django.test import TestCase

# Keep Django's test discovery happy. Product tests can land here later.
class SmokeTest(TestCase):
    def test_app_loads(self):
        self.assertTrue(True)
