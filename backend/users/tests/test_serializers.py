from allauth.account.adapter import get_adapter
from allauth.account.models import EmailAddress
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from unittest.mock import ANY, Mock, patch
from rest_framework.test import APIRequestFactory, APITestCase

from users.serializers import InviteRequestSerializer


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
