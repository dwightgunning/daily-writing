import logging

from django.shortcuts import get_object_or_404
from django.http import Http404
from rest_framework.generics import RetrieveUpdateAPIView

from users.models import DailyWritingProfile
from users.serializers import DailyWritingProfileSerializer

logger = logging.getLogger(__name__)


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
