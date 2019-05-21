from collections import Counter

from allauth.account import app_settings as allauth_settings
from allauth.account.adapter import get_adapter
from allauth.account.utils import setup_user_email
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core import exceptions as django_exceptions
from django.core import mail
from django.db import transaction
from django.utils.translation import ugettext_lazy as _
import pytz
from rest_framework import serializers

from users.models import DailyWritingProfile


class TimezoneField(serializers.Field):
    def to_representation(self, obj):
        return str(obj)

    def to_internal_value(self, data):
        try:
            return pytz.timezone(str(data))
        except pytz.exceptions.UnknownTimeZoneError:
            raise serializers.ValidationError(_("Unknown timezone"))


class InviteRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, email):
        email = get_adapter().clean_email(email)
        return email

    def get_cleaned_data(self):
        return {"email": self.validated_data.get("email", "")}

    def save(self, request):
        self.cleaned_data = self.get_cleaned_data()
        adapter = get_adapter()
        return adapter.new_user_invite_request(request, self)


class DailyWritingProfileSerializer(serializers.ModelSerializer):
    timezone = TimezoneField()
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    email = serializers.EmailField(source="user.email")

    class Meta:
        model = DailyWritingProfile
        fields = (
            "first_name",
            "last_name",
            "email",
            "timezone",
            "target_milestone_word_count",
        )

    def update(self, instance, validated_data):
        user_updates = validated_data.pop("user", None)
        with transaction.atomic():
            if user_updates:
                for (key, value) in user_updates.items():
                    setattr(instance.user, key, value)
                instance.user.save()
            return super(DailyWritingProfileSerializer, self).update(
                instance, validated_data
            )
