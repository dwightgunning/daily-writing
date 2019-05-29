from allauth.account.adapter import get_adapter
from allauth.account.models import EmailAddress, EmailConfirmationHMAC
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core import mail
from django.core.validators import ValidationError
from unittest.mock import ANY, Mock, patch
from rest_framework import serializers
from rest_framework.test import APIRequestFactory, APITestCase
from users.serializers import (
    InviteAcceptanceSerializer,
    InviteRequestSerializer,
    InviteTokenSerializer,
)


class InviteRequestSerializerTest(APITestCase):
    """
    Tests de-serialization of invite requests. Field valdiation, errors
    and effects of the save() function.
    """

    fixtures = ["dailywriting/fixtures/seed.json", "test_users.json"]

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user_model = get_user_model()

    @patch("users.serializers.get_adapter")
    def test_invite_request_invalid_email(self, mock_get_adapter):
        test_email = "fake_mail"

        mock_adapter = Mock()
        mock_adapter.clean_email = Mock(side_effect=KeyError("foo"))
        # Supply the mock adapter
        mock_get_adapter.return_value = mock_adapter

        test_data = {"email": test_email}
        stub_request = self.factory.post(
            path="./fake_path", data=test_data, format="json"
        )
        stub_request.session = (
            {}
        )  # Stub session as middleware doesn't run with APIRequestFactory

        serializer = InviteRequestSerializer(data=test_data)
        self.assertFalse(serializer.is_valid())
        self.assertTrue(
            "invalid" in [error.code for error in serializer.errors["email"]]
        )

    @patch("users.serializers.get_adapter")
    def test_invite_request_save(self, mock_get_adapter):
        """
        Saving uses the AccountAdapter to create an invite request for the new user
        """
        # Setup our mock adapter
        test_email = "invite_request@tester.com"

        mock_adapter = Mock()
        mock_adapter.clean_email.return_value = test_email
        mock_user = Mock()
        mock_adapter.new_user_invite_request.return_value = mock_user
        # Supply the mock adapter
        mock_get_adapter.return_value = mock_adapter

        test_data = {"email": test_email}
        stub_request = self.factory.post(
            path="./fake_path", data=test_data, format="json"
        )
        stub_request.session = (
            {}
        )  # Stub session as middleware doesn't run with APIRequestFactory

        serializer = InviteRequestSerializer(data=test_data)
        self.assertTrue(serializer.is_valid())
        user_requesting_invite = serializer.save(request=stub_request)

        mock_adapter.new_user_invite_request.assert_called_with(
            stub_request, serializer
        )
        self.assertEqual(user_requesting_invite, mock_user)

    @patch("users.serializers.get_adapter")
    def test_invite_save_before_validating_input(self, mock_get_adapter):
        """
        Saving before validating raises an Error
        """
        # Setup our mock adapter
        test_email = "invite_request@tester.com"

        mock_adapter = Mock()
        mock_adapter.clean_email.return_value = test_email
        # Supply the mock adapter
        mock_get_adapter.return_value = mock_adapter

        test_data = {"email": test_email}
        stub_request = self.factory.post(
            path="./fake_path", data=test_data, format="json"
        )
        stub_request.session = (
            {}
        )  # Stub session as middleware doesn't run with APIRequestFactory

        serializer = InviteRequestSerializer(data=test_data)
        with self.assertRaises(AssertionError):
            serializer.save(request=stub_request)


class InviteTokenSerializerTest(APITestCase):
    fixtures = ["dailywriting/fixtures/seed.json"]

    def test_validate_token_valid(self):
        test_email = "tester@tester.com"
        tmp_username = "temp_username"
        test_user = get_adapter().new_user(None)
        test_user.email = test_email
        test_user.username = tmp_username
        test_user.save()
        test_user.groups.add(Group.objects.get(name="Invited"))
        email_address = EmailAddress.objects.create(
            email=test_user.email, user=test_user
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
        test_email = "tester@tester.com"
        tmp_username = "temp_username"
        test_user = get_adapter().new_user(None)
        test_user.email = test_email
        test_user.username = tmp_username
        test_user.set_unusable_password()
        test_user.save()
        test_user.groups.add(Group.objects.get(name="Invite Accepted"))
        email_address = EmailAddress(email=test_user.email, user=test_user)

        serializer = InviteTokenSerializer()
        with self.assertRaises(serializers.ValidationError):
            serializer.validate_token(EmailConfirmationHMAC(email_address).key)


class InviteAcceptanceSerializerTest(APITestCase):
    fixtures = ["dailywriting/fixtures/seed.json"]

    def test_validate_username_matching_same_user_model(self):
        test_email = "tester@tester.com"
        test_username = "autogen-username"
        test_user = get_adapter().new_user(None)
        test_user.email = test_email
        test_user.username = test_username
        test_user.set_unusable_password()
        test_user.save()
        test_user.groups.add(Group.objects.get(name="Invited"))
        email_address = EmailAddress.objects.create(
            email=test_user.email, user=test_user
        )
        test_data = {
            "token": EmailConfirmationHMAC(email_address).key,
            "username": test_username,
            "password": "kl#23jrkja11pf",
        }

        serializer = InviteAcceptanceSerializer(data=test_data)
        self.assertEquals(serializer.validate_username(test_username), test_username)

    def test_validate_username_matching_other_user_model(self):
        test_email = "tester@tester.com"
        test_username = "autogen-username"
        test_user = get_adapter().new_user(None)
        test_user.email = test_email
        test_user.username = test_username
        test_user.set_unusable_password()
        test_user.save()

        other_user = get_adapter().new_user(None)
        other_user.email = "other_user@tester.com"
        other_user.username = "other_user"
        other_user.set_unusable_password()
        other_user.save()

        test_user.groups.add(Group.objects.get(name="Invited"))
        email_address = EmailAddress.objects.create(
            email=test_user.email, user=test_user
        )
        test_data = {
            "token": EmailConfirmationHMAC(email_address).key,
            "username": other_user.username,
            "password": "kl#23jrkja11pf",
        }

        serializer = InviteAcceptanceSerializer(data=test_data)
        with self.assertRaises(ValidationError):
            serializer.validate_username(other_user.username)

    def test_save(self):
        test_email = "tester@tester.com"
        tmp_username = "temp_username"
        test_user = get_adapter().new_user(None)
        test_user.email = test_email
        test_user.username = tmp_username
        test_user.set_unusable_password()
        test_user.save()
        test_user.groups.add(Group.objects.get(name="Invited"))
        email_address = EmailAddress.objects.create(
            email=test_user.email, user=test_user
        )
        test_data = {
            "token": EmailConfirmationHMAC(email_address).key,
            "username": "tester",
            "password": "kl#23jrkja11pf",
        }

        serializer = InviteAcceptanceSerializer(data=test_data)
        serializer.is_valid()
        serializer.save(None)

        EmailAddress.objects.get(email=test_user.email, primary=True, verified=True)
        updated_user = get_user_model().objects.get(
            email=test_user.email, username=test_data["username"]
        )
        self.assertTrue(updated_user.check_password(test_data["password"]))
        self.assertEqual(len(mail.outbox), 0)  # No email confirmations sent to the user
