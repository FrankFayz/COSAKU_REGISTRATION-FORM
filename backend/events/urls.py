from django.urls import path

from . import views

urlpatterns = [
    path("", views.ApiRootView.as_view()),
    path("events/", views.PublicEventListView.as_view()),
    path("events/<int:pk>/register/", views.RegisterView.as_view()),
    path("auth/login/", views.LoginView.as_view()),
    path("auth/logout/", views.LogoutView.as_view()),
    path("admin/stats/", views.StatsView.as_view()),
    path("admin/recent/", views.RecentRegistrationsView.as_view()),
    path("admin/events/", views.AdminEventListCreateView.as_view()),
    path("admin/events/<int:pk>/", views.AdminEventDetailView.as_view()),
    path("admin/events/<int:pk>/desk/", views.EventRegistrationDeskView.as_view()),
    path("admin/events/<int:pk>/csv/", views.EventCSVView.as_view()),
    path("admin/registrations/<int:pk>/attendance/", views.AttendanceView.as_view()),
]
