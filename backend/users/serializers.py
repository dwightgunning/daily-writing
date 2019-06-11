from collections import Counter

from allauth.account import app_settings as allauth_settings
from allauth.account.adapter import get_adapter
from allauth.account.models import EmailAddress, EmailConfirmationHMAC
from allauth.account.utils import setup_user_email
from allauth.utils import get_username_max_length
from django import forms
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.auth.password_validation import validate_password
from django.core import exceptions as django_exceptions, mail
from django.core.validators import ValidationError
from django.db import transaction
from django.utils.translation import ugettext_lazy as _
import pytz
from rest_auth.serializers import PasswordResetSerializer
from rest_framework import serializers
from rest_framework.exceptions import APIException, NotFound

from api.exceptions import UnprocessibleError
from users.models import DailyWritingProfile
from users.forms import DailyWritingPasswordResetForm


class TimezoneField(serializers.Field):
    """
    Timezone field for pytz timezone objects
    """

    def to_representation(self, obj):
        return str(obj)

    def to_internal_value(self, data):
        """
        Deseralize timezone strings into pytz timezone objects

        Unknown/invalid timezones raise a DRF appropriate UnprocessibleError
        """
        try:
            return pytz.timezone(str(data))
        except pytz.exceptions.UnknownTimeZoneError:
            raise UnprocessibleError(_("Unknown timezone"))


class InviteRequestSerializer(serializers.Serializer):
    """
    Invite request serializer
    """

    email = serializers.EmailField(required=True)

    def validate_email(self, email):
        """ Validates the email address with the allauth account adapter
        """
        return get_adapter().clean_email(email)

    def get_cleaned_data(self):
        return {"email": self.validated_data.get("email", "")}

    def save(self, request):
        """ Saves the invite request by delegating to the allauth account adapter
        """
        self.cleaned_data = self.get_cleaned_data()
        return get_adapter().new_user_invite_request(request, self)


class InviteTokenSerializer(serializers.Serializer):
    """
    Invite token serializer
    """

    token = serializers.CharField(required=True)

    def validate_token(self, token):
        """
        Validates the token is valid and associated with an invited user

        Returns generic not invalid token error avoid exposing the validity
        of a given token and related email address.
        """
        email_confirmation = EmailConfirmationHMAC.from_key(token)
        if (
            not email_confirmation
            or not email_confirmation.email_address.user.groups.filter(
                name="Invited"
            ).exists()
        ):
            raise serializers.ValidationError(detail=_("Invalid token"), code="invalid")
        return token


class InviteAcceptanceSerializer(InviteTokenSerializer):
    """
    Invite acceptance serializer sets a username and a useable password, allowing
    the user to then login

    Essentially a signup form with username and password fields, along with an invite token
    that must be validated
    """

    username = serializers.CharField(
        max_length=get_username_max_length(),
        min_length=allauth_settings.USERNAME_MIN_LENGTH,
        required=True,
        write_only=True,
    )
    password = serializers.CharField(write_only=True, required=True)

    def validate_username(self, username):
        """
        Validates the username via the allauth account adapter
        """
        # Shallow clean doesn't check username uniqueness. See `validate()`.
        return get_adapter().clean_username(username, shallow=True)

    def validate_password(self, password):
        return get_adapter().clean_password(password)

    def validate(self, data):
        """ Validate related fields
        """
        # If the username fields doesn't match the user's existing username, check for uniqueness.
        if (
            EmailConfirmationHMAC.from_key(data["token"]).email_address.user.username
            != data["username"]
        ):
            get_adapter().clean_username(data["username"])
        return data

    def get_cleaned_data(self):
        """ Cleaned form data after field and form validation
        """
        return {
            "token": self.validated_data.get("token", ""),
            "username": self.validated_data.get("username", ""),
            "password1": self.validated_data.get(
                "password", ""
            ),  # allauth expects 'password1'
        }

    def save(self, request):
        """ Complete the invite acceptance

        - Updates to the User model by delegating to the allauth account adapter
        - Confirms the email address the user used to request their invite
        - Reassigns the user to the Invite Accepted group
        """
        self.cleaned_data = (
            self.get_cleaned_data()
        )  # referenced by Account Adapter during save_user
        token = self.cleaned_data["token"]
        email_address = EmailConfirmationHMAC.from_key(token).email_address
        self.cleaned_data["email"] = email_address.email
        adapter = get_adapter()
        # Confirm email via adapter instead of EmailConfirmationHMAC so that no email to user is triggered
        adapter.confirm_email(request, email_address)
        adapter.save_user(request, email_address.user, self)
        email_address.user.groups.add(Group.objects.get(name="Invite Accepted"))
        email_address.user.groups.remove(Group.objects.get(name="Invited"))


class DailyWritingProfileSerializer(serializers.ModelSerializer):
    """
    Daily writing profile serializer combines fields from the DailyWritingProfile and User model.
    """

    first_name = serializers.CharField(source="user.first_name", required=False)
    last_name = serializers.CharField(source="user.last_name", required=False)
    email = serializers.EmailField(source="user.email", required=False, read_only=True)
    timezone = TimezoneField(required=False)
    target_milestone_word_count = serializers.IntegerField(required=False)

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
        """
        Update the Daily Writing Profile and related User models
        """

        # Separates nested user object from DailyWritingProfile fields so they
        # can be applied separately
        user_updates = validated_data.pop("user", None)
        # Updates to profile and user models should be all or nothing
        with transaction.atomic():
            if user_updates:
                for (key, value) in user_updates.items():
                    setattr(instance.user, key, value)
                instance.user.save()
            return super(DailyWritingProfileSerializer, self).update(
                instance, validated_data
            )


class DailyWritingPasswordResetSerializer(PasswordResetSerializer):
    """
    Extends the REST Auth password reset serializer and overides the form class
    """

    password_reset_form_class = DailyWritingPasswordResetForm
