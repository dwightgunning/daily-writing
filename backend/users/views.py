import json
import logging

from allauth.account.models import EmailConfirmationHMAC
from rest_auth.registration.views import RegisterView
from rest_auth.views import PasswordResetView
from rest_framework import status
from rest_framework.exceptions import APIException, NotFound
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView
from users.models import DailyWritingProfile
from users.serializers import (
    DailyWritingPasswordResetSerializer,
    DailyWritingProfileSerializer,
    InviteAcceptanceSerializer,
    InviteRequestSerializer,
    InviteTokenSerializer,
)

logger = logging.getLogger(__name__)


class InviteRequestView(RegisterView):
    serializer_class = InviteRequestSerializer

    def get_response_data(self, user):
        return {"email": user.email}

    def perform_create(self, serializer):
        user = serializer.save(self.request)
        return user


class InviteRequestAcceptanceView(APIView):
    """
    Invite request acceptance
    """

    permission_classes = (AllowAny,)

    def get(self, request, format=None, *args, **kwargs):
        """ Validates and returns the token or 404
        """
        serializer = InviteTokenSerializer(data={"token": kwargs["token"]})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.data)

    def post(self, request, format=None, *args, **kwargs):
        """ Accepts the invite and returns user account details to confirm the account is now usable
        """
        request.data["token"] = kwargs["token"]
        serializer = InviteAcceptanceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(request)
        return Response(serializer.data)


class DailyWritingProfileView(RetrieveUpdateAPIView):
    serializer_class = DailyWritingProfileSerializer
    model_class = DailyWritingProfile

    def get_object(self):
        profile, created = self.model_class.objects.get_or_create(
            user=self.request.user
        )
        if created:
            # Shouldn't occur: See users.models.create_or_update_user_profile signal
            logger.exception("Authenticated user profile missing!?")
        return profile


class DailyWritingPasswordResetView(PasswordResetView):
    """
    Extends the Django Auth PasswordResetForm overriding with a custom serializer
    """

    serializer_class = DailyWritingPasswordResetSerializer
