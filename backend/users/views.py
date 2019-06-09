import json
import logging

from allauth.account.models import EmailConfirmationHMAC
from django.shortcuts import get_object_or_404
from rest_framework.exceptions import APIException, NotFound
from rest_auth.registration.views import RegisterView
from rest_framework import status
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.views import APIView
from users.models import DailyWritingProfile
from users.serializers import (
    DailyWritingProfileSerializer,
    InviteRequestSerializer,
    InviteTokenSerializer,
    InviteAcceptanceSerializer,
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
    View to retrieve an Invite Request Token.
    """

    permission_classes = (AllowAny,)

    def get(self, request, format=None, *args, **kwargs):
        """
        Returns  token.
        """
        serializer = InviteTokenSerializer(data={"token": kwargs["token"]})
        if not serializer.is_valid():
            raise NotFound(serializer.errors)
        return Response(serializer.data)

    def post(self, request, format=None, *args, **kwargs):
        request.data["token"] = kwargs["token"]
        serializer = InviteAcceptanceSerializer(data=request.data)
        if not serializer.is_valid():
            if "token" in serializer.errors:
                raise NotFound({"token": serializer.errors["token"]})
            else:
                raise APIException(
                    serializer.errors, status.HTTP_422_UNPROCESSABLE_ENTITY
                )
        serializer.save(request)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DailyWritingProfileView(RetrieveUpdateAPIView):
    serializer_class = DailyWritingProfileSerializer
    model_class = DailyWritingProfile

    def get_queryset(self):
        return self.model_class.objects.all()

    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    def get_object(self):
        try:
            return get_object_or_404(self.model_class, user__id=self.request.user.pk)
        except Http404 as e:
            logger.exception("Authenticated user profile missing!?")
            raise e

    def get_serializer_context(self):
        context = super(DailyWritingProfileView, self).get_serializer_context()
        return context
