from django.urls import include, path
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView
from rest_auth.registration.views import RegisterView
from rest_auth.views import PasswordResetConfirmView

from api.views import empty_view
from users.views import (
    DailyWritingPasswordResetView,
    DailyWritingProfileView,
    InviteRequestView,
    InviteRequestAcceptanceView,
)

urlpatterns = [
    path(
        "auth/registration/", csrf_exempt(RegisterView.as_view()), name="rest_register"
    ),
    path(
        "auth/registration/invite/",
        csrf_exempt(InviteRequestView.as_view()),
        name="invite_request",
    ),
    path(
        "auth/registration/invite/<token>/",
        InviteRequestAcceptanceView.as_view(),
        name="invite_token",
    ),
    path(
        "auth/password/reset/",
        DailyWritingPasswordResetView.as_view(),
        name="rest_password_reset",
    ),
    path(
        "auth/password/reset/confirm/",
        PasswordResetConfirmView.as_view(),
        name="rest_password_reset_confirm",
    ),
    # Empty views to satisfy 'reverse' lookups  ## TODO: Find a better way?
    path("auth/password_reset/done/", empty_view, name="password_reset_done"),
    path("auth/reset/<uidb64>/<token>/", empty_view, name="password_reset_confirm"),
    path(
        "auth/registration/invite-acceptance/<key>/",
        empty_view,
        name="invite_acceptance",
    ),
    path("auth/", include("rest_auth.urls")),
    path("profile/", DailyWritingProfileView.as_view(), name="profile"),
]
