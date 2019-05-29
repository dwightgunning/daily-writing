from collections import Counter

from allauth.account import app_settings as allauth_settings
from allauth.account.adapter import get_adapter
from allauth.account.models import EmailConfirmationHMAC
from allauth.account.utils import setup_user_email
from allauth.utils import get_username_max_length
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions as django_exceptions
from django.core import mail
from django.db import transaction
from django import forms
from django.utils.translation import ugettext_lazy as _
import pytz
from rest_framework import serializers
from users.models import DailyWritingProfile

from django.core import signing  # TODO
from allauth.account import app_settings
from allauth.account.models import EmailAddress


from django.core.validators import ValidationError


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


class InviteTokenSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)

    def validate_token(self, token):
        email_confirmation = EmailConfirmationHMAC.from_key(token)
        if (
            not email_confirmation
            or not email_confirmation.email_address.user.groups.filter(
                name="Invited"
            ).exists()
        ):
            raise serializers.ValidationError("Not found")
        return token


class InviteAcceptanceSerializer(InviteTokenSerializer):
    username = serializers.CharField(
        max_length=get_username_max_length(),
        min_length=allauth_settings.USERNAME_MIN_LENGTH,
        required=True,
        write_only=True,
    )
    password = serializers.CharField(write_only=True, required=True)

    def validate_username(self, username):
        adapter = get_adapter()
        token = self.initial_data["token"]
        email_address = EmailConfirmationHMAC.from_key(token).email_address
        # Shallow clean without checking for uniqueness
        validated_username = adapter.clean_username(username, shallow=True)

        if validated_username == email_address.user.username:
            return validated_username  # user keeps the same username

        # clean again it with db uniqueness checks
        return adapter.clean_username(validated_username)

    def validate_password(self, password):
        return get_adapter().clean_password(password)

    def get_cleaned_data(self):
        return {
            "token": self.validated_data.get("token", ""),
            "username": self.validated_data.get("username", ""),
            "password1": self.validated_data.get(
                "password", ""
            ),  # allauth expects field to be 'password1'
        }

    def save(self, request):
        self.cleaned_data = (
            self.get_cleaned_data()
        )  # referenced by Account Adapter during save_user
        token = self.cleaned_data["token"]
        email_address = EmailConfirmationHMAC.from_key(token).email_address
        self.cleaned_data["email"] = email_address.email
        adapter = get_adapter()
        # Confirm email via adapter rather than EmailConfirmationHMAC as this doesn't send a confirmation email
        adapter.confirm_email(request, email_address)
        adapter.save_user(request, email_address.user, self)
        email_address.user.groups.add(Group.objects.get(name="Invite Accepted"))
        email_address.user.groups.remove(Group.objects.get(name="Invited"))


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
