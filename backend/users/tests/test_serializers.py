from unittest.mock import ANY, Mock, patch

from allauth.account.adapter import get_adapter
from allauth.account.models import EmailAddress, EmailConfirmationHMAC
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core import mail
from django.core.validators import ValidationError
from rest_framework import serializers
from rest_framework.exceptions import NotFound
from rest_framework.test import APIRequestFactory, APITestCase
from users.serializers import (
    InviteAcceptanceSerializer,
    InviteRequestSerializer,
    InviteTokenSerializer,
)

UserModel = get_user_model()


class TestInviteRequestSerializer(APITestCase):
    """
    Unit tests for InviteRequestSerializer
    """

    fixtures = ["dailywriting/fixtures/seed.json"]

    def setUp(self):
        self.factory = APIRequestFactory()

    def test_invite_request_invalid_email(self):
        """ Invite requests with an invalid email address result in a serializer error on the 'email' field
        """
        test_data = {"email": "invalid email"}
        serializer = InviteRequestSerializer(data=test_data)
        self.assertFalse(serializer.is_valid())
        self.assertTrue(
            "invalid" in [error.code for error in serializer.errors["email"]]
        )

    @patch("users.serializers.get_adapter")
    def test_invite_request_save(self, mock_get_adapter):
        """
        InviteRequestSerializer.save() deletgates to the AccountAdapter to create an invite request for the new user
        """
        test_email = "invite_request@tester.com"

        # Initialize and inject a mock allauth account adapter
        mock_adapter = Mock()
        mock_adapter.clean_email.return_value = test_email
        mock_user = Mock()
        mock_adapter.new_user_invite_request.return_value = mock_user
        mock_get_adapter.return_value = mock_adapter

        # Initialize test data and request that's required by allauth account adapter
        test_data = {"email": test_email}
        request = self.factory.post(path="/", data=test_data, format="json")
        # Stub session object as middleware does not run with APIRequestFactory
        request.session = {}

        serializer = InviteRequestSerializer(data=test_data)
        serializer.is_valid()
        user_requesting_invite = serializer.save(request=request)
        mock_adapter.new_user_invite_request.assert_called_with(request, serializer)
        self.assertEqual(user_requesting_invite, mock_user)


class TestInviteTokenSerializer(APITestCase):
    """
    Unit tests for InviteTokenSerializer
    """

    fixtures = ["dailywriting/fixtures/seed.json"]

    def setUp(self):
        self.test_email = "tester@tester.com"
        self.test_username = "temp_username"
        self.test_user = get_adapter().new_user(None)
        self.test_user.email = self.test_email
        self.test_user.username = self.test_username
        self.test_user.set_unusable_password()
        self.test_user.save()

    def test_validate_token_valid(self):
        self.test_user.groups.add(Group.objects.get(name="Invited"))
        email_address = EmailAddress.objects.create(
            email=self.test_user.email, user=self.test_user
        )
        test_token = EmailConfirmationHMAC(email_address).key
        serializer = InviteTokenSerializer()
        self.assertEqual(serializer.validate_token(test_token), test_token)

    def test_validate_token_invalid(self):
        test_data = {
            "token": "not a token",
            "username": "tester",
            "password": "kl#23jrkja11pf",
        }

        serializer = InviteTokenSerializer(data=test_data)
        with self.assertRaises(serializers.ValidationError):
            serializer.validate_token(test_data["token"])

    def test_validate_token_already_accepted(self):
        self.test_user.groups.add(Group.objects.get(name="Invite Accepted"))
        email_address = EmailAddress(email=self.test_user.email, user=self.test_user)

        serializer = InviteTokenSerializer()
        with self.assertRaises(serializers.ValidationError):
            serializer.validate_token(EmailConfirmationHMAC(email_address).key)


class TestInviteAcceptanceSerializer(APITestCase):
    """
    Unit tests for InviteAcceptanceSerializer
    """

    fixtures = ["dailywriting/fixtures/seed.json"]

    def setUp(self):
        self.test_email = "tester@tester.com"
        self.test_username = "autogen-username"
        self.test_user = get_adapter().new_user(None)
        self.test_user.email = self.test_email
        self.test_user.username = self.test_username
        self.test_user.set_unusable_password()
        self.test_user.save()

    def test_validate_username_matching_same_user_model(self):
        self.test_user.groups.add(Group.objects.get(name="Invited"))
        email_address = EmailAddress.objects.create(
            email=self.test_user.email, user=self.test_user
        )
        test_data = {
            "token": EmailConfirmationHMAC(email_address).key,
            "username": self.test_username,
            "password": "kl#23jrkja11pf",
        }

        serializer = InviteAcceptanceSerializer(data=test_data)
        validate_data = serializer.validate(data=test_data)
        self.assertEquals(validate_data, test_data)

    def test_validate_username_matching_other_user_model(self):
        other_user = get_adapter().new_user(None)
        other_user.email = "other_user@tester.com"
        other_user.username = "other_user"
        other_user.set_unusable_password()
        other_user.save()

        self.test_user.groups.add(Group.objects.get(name="Invited"))
        email_address = EmailAddress.objects.create(
            email=self.test_user.email, user=self.test_user
        )
        test_data = {
            "token": EmailConfirmationHMAC(email_address).key,
            "username": other_user.username,
            "password": "kl#23jrkja11pf",
        }

        serializer = InviteAcceptanceSerializer(data=test_data)
        with self.assertRaises(ValidationError):
            validate_data = serializer.validate(data=test_data)
            self.assertEquals(validate_data, test_data)

    def test_save(self):
        self.test_user.groups.add(Group.objects.get(name="Invited"))
        email_address = EmailAddress.objects.create(
            email=self.test_user.email, user=self.test_user
        )
        test_data = {
            "token": EmailConfirmationHMAC(email_address).key,
            "username": "tester",
            "password": "kl#23jrkja11pf",
        }

        serializer = InviteAcceptanceSerializer(data=test_data)
        serializer.is_valid()
        serializer.save(None)

        EmailAddress.objects.get(
            email=self.test_user.email, primary=True, verified=True
        )
        updated_user = UserModel.objects.get(
            email=self.test_user.email, username=test_data["username"]
        )
        self.assertTrue(updated_user.check_password(test_data["password"]))
        self.assertEqual(len(mail.outbox), 0)  # No email confirmations sent to the user
