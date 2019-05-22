import json
import logging

from allauth.account.models import EmailConfirmationHMAC
from django.shortcuts import get_object_or_404
from django.http import Http404
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
        if serializer.is_valid():
            return Response(serializer.data)
        else:
            return Response(
                {"errors": serializer.errors}, status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request, format=None, *args, **kwargs):
        request.data["token"] = kwargs["token"]
        serializer = InviteAcceptanceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(request)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            if "token" in serializer.errors:
                return Response(
                    {"errors": {"token": serializer.errors["token"]}},
                    status=status.HTTP_404_NOT_FOUND,
                )
            else:
                return Response(
                    {"errors": serializer.errors},
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )


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
        # context['user'] = self.request.user
        return context
