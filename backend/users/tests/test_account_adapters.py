from unittest.mock import ANY, call, Mock, patch

from allauth.account.adapter import get_adapter
from allauth.account.models import EmailAddress, EmailConfirmationHMAC
from callee import operators
from django.core import mail
from django.test import TestCase

from users.account_adapters import DailyWritingAccountAdapter


class DailyWritingAccountAdapterTest(TestCase):
    @patch("users.account_adapters.email_address_exists")
    @patch("users.account_adapters.get_user_model")
    def test_invite_user_existing_email_invite_requested(
        self, mock_get_user_model, mock_email_address_exists
    ):
        test_email = "tester@tester.com"

        mock_email_address_exists.return_value = True

        mock_user = Mock(email=test_email)
        mock_user.groups.filter.exists.side_effect = [False]

        mock_request = Mock(user=mock_user)

        mock_get_user_model().objects.get.return_value = mock_user

        adapter = DailyWritingAccountAdapter()
        adapter.send_invite_request_received_email = Mock()

        adapter.new_user_invite_request(
            mock_request, Mock(cleaned_data={"email": test_email})
        )

        mock_email_address_exists.assert_called()
        mock_get_user_model().objects.get.assert_called_with(**{"email": test_email})
        mock_user.groups.filter.assert_called_with(**{"name": "Invite Requested"})
        adapter.send_invite_request_received_email.assert_called()

    @patch("users.account_adapters.email_address_exists")
    @patch("users.account_adapters.get_user_model")
    def test_invite_user_existing_email_invite_sent(
        self, mock_get_user_model, mock_email_address_exists
    ):
        test_email = "tester@tester.com"

        mock_email_address_exists.return_value = True

        mock_user = Mock(email=test_email)
        mock_user.groups.filter.side_effect = [
            Mock(exists=Mock(return_value=False)),  # Invite requested
            Mock(exists=Mock(return_value=True)),  # Invited
        ]

        mock_request = Mock(user=mock_user)

        mock_get_user_model().objects.get.return_value = mock_user

        adapter = DailyWritingAccountAdapter()
        adapter.send_invite_email = Mock()

        adapter.new_user_invite_request(
            mock_request, Mock(cleaned_data={"email": test_email})
        )

        mock_email_address_exists.assert_called()
        mock_get_user_model().objects.get.assert_called_with(**{"email": test_email})
        mock_user.groups.filter.assert_has_calls(
            [call(**{"name": "Invite Requested"}), call(**{"name": "Invited"})]
        )
        adapter.send_invite_email.assert_called()

    @patch("users.account_adapters.email_address_exists")
    @patch("users.account_adapters.get_user_model")
    def test_invite_user_existing_email_invite_accepted(
        self, mock_get_user_model, mock_email_address_exists
    ):
        test_email = "tester@tester.com"

        mock_email_address_exists.return_value = True

        mock_user = Mock(email=test_email)
        mock_user.groups.filter.side_effect = [
            Mock(exists=Mock(return_value=False)),  # Invite requested
            Mock(exists=Mock(return_value=False)),  # Invited
            Mock(exists=Mock(return_value=True)),  # Invite accepted
        ]

        mock_request = Mock(user=mock_user)

        mock_get_user_model().objects.get.return_value = mock_user

        adapter = DailyWritingAccountAdapter()
        adapter.send_account_username_email_address_reminder_email = Mock()

        adapter.new_user_invite_request(
            mock_request, Mock(cleaned_data={"email": test_email})
        )

        mock_email_address_exists.assert_called()
        mock_get_user_model().objects.get.assert_called_with(**{"email": test_email})
        mock_user.groups.filter.assert_has_calls(
            [
                call(**{"name": "Invite Requested"}),
                call(**{"name": "Invited"}),
                call(**{"name": "Invite Accepted"}),
            ]
        )
        adapter.send_account_username_email_address_reminder_email.assert_called()

    @patch("users.account_adapters.mail")
    def test_send_invite_request_received_email(self, mock_mail):
        mock_mail.send_mail = Mock()
        mock_mail.mail_admins = Mock()

        adapter = DailyWritingAccountAdapter()
        test_user = adapter.new_user(None)
        test_user.email = "tester@tester.com"
        adapter.send_invite_request_received_email(test_user)

        expected_args_send_mail = {
            "from_email": ANY,
            "message": ANY,
            "subject": ANY,
            "recipient_list": [test_user.email],
        }
        mock_mail.send_mail.assert_called_with(**expected_args_send_mail)

        expected_args_mail_admins = {"message": ANY, "subject": ANY}
        mock_mail.mail_admins.assert_called_with(**expected_args_mail_admins)

    @patch("users.account_adapters.mail")
    @patch("users.account_adapters.logger")
    def test_send_invite_request_received_email_send_mail_error(
        self, mock_logger, mock_mail
    ):
        mailing_error = Exception()
        mock_mail.send_mail = Mock(side_effect=mailing_error)
        mock_mail.mail_admins = Mock()

        adapter = DailyWritingAccountAdapter()
        test_user = adapter.new_user(None)
        test_user.email = "tester@tester.com"
        adapter.send_invite_request_received_email(test_user)

        expected_args_send_mail = {
            "from_email": ANY,
            "message": ANY,
            "subject": ANY,
            "recipient_list": [test_user.email],
        }
        mock_mail.send_mail.assert_called_with(**expected_args_send_mail)

        expected_args_mail_admins = {"message": ANY, "subject": ANY}
        mock_mail.mail_admins.assert_called_with(**expected_args_mail_admins)
        mock_logger.exception.assert_called()

    @patch("users.account_adapters.mail")
    @patch("users.account_adapters.logger")
    def test_send_invite_request_received_email_mail_admins_error(
        self, mock_logger, mock_mail
    ):
        mailing_error = Exception()
        mock_mail.send_mail = Mock()
        mock_mail.mail_admins = Mock(side_effect=mailing_error)

        adapter = DailyWritingAccountAdapter()
        test_user = adapter.new_user(None)
        test_user.email = "tester@tester.com"
        test_user.save()
        adapter.send_invite_request_received_email(test_user)

        expected_args_send_mail = {
            "from_email": ANY,
            "message": ANY,
            "subject": ANY,
            "recipient_list": [test_user.email],
        }
        mock_mail.send_mail.assert_called_with(**expected_args_send_mail)

        expected_args_mail_admins = {"message": ANY, "subject": ANY}
        mock_mail.mail_admins.assert_called_with(**expected_args_mail_admins)
        mock_logger.exception.assert_called()

    @patch("users.account_adapters.mail")
    def test_send_invite_email(self, mock_mail):
        adapter = DailyWritingAccountAdapter()
        test_email = "tester@tester.com"
        test_user = adapter.new_user(None)
        test_user.email = test_email
        test_user.save()
        test_email_address = EmailAddress.objects.create(
            email=test_email, user=test_user
        )
        expected_hmac = EmailConfirmationHMAC(test_email_address)

        adapter.send_invite_email(test_user)

        expected_args_send_mail = {
            "from_email": ANY,
            "message": operators.Contains(expected_hmac.key),
            "subject": ANY,
            "recipient_list": [test_email],
        }
        mock_mail.send_mail.assert_called_with(**expected_args_send_mail)

    @patch("users.account_adapters.mail")
    @patch("users.account_adapters.logger")
    def test_send_invite_email_error(self, mock_logger, mock_mail):
        test_email = "tester@tester.com"

        adapter = DailyWritingAccountAdapter()
        test_user = adapter.new_user(None)
        test_user.email = test_email
        test_user.username = "fakeusername"
        test_user.save()

        test_email_address = EmailAddress.objects.create(
            email=test_email, user=test_user
        )
        expected_hmac = EmailConfirmationHMAC(test_email_address)

        mailing_error = Exception()
        mock_mail.send_mail = Mock(side_effect=mailing_error)

        adapter.send_invite_email(test_user)

        expected_args_send_mail = {
            "from_email": ANY,
            "message": operators.Contains(expected_hmac.key),
            "subject": ANY,
            "recipient_list": [test_email],
        }
        mock_mail.send_mail.assert_called_with(**expected_args_send_mail)
        mock_logger.exception.assert_called()

    @patch("users.account_adapters.mail")
    def test_send_account_username_email_address_reminder_email(self, mock_mail):
        test_username = "tester"
        test_email = "tester@tester.com"

        adapter = DailyWritingAccountAdapter()
        test_user = adapter.new_user(None)
        test_user.username = test_username
        test_user.email = test_email
        test_user.save()

        test_email_address = EmailAddress.objects.create(
            email=test_email, user=test_user
        )

        adapter.send_account_username_email_address_reminder_email(test_user)

        expected_args_send_mail = {
            "from_email": ANY,
            "message": operators.Contains(test_email)
            & operators.Contains(test_user.username),
            "subject": ANY,
            "recipient_list": [test_email],
        }
        mock_mail.send_mail.assert_called_with(**expected_args_send_mail)

    @patch("users.account_adapters.mail")
    @patch("users.account_adapters.logger")
    def test_send_account_username_email_address_reminder_email_error(
        self, mock_logger, mock_mail
    ):
        test_username = "tester"
        test_email = "tester@tester.com"

        adapter = DailyWritingAccountAdapter()
        test_user = adapter.new_user(None)
        test_user.username = test_username
        test_user.email = test_email
        test_user.save()

        test_email_address = EmailAddress.objects.create(
            email=test_email, user=test_user
        )

        mailing_error = Exception()
        mock_mail.send_mail = Mock(side_effect=mailing_error)

        adapter.send_account_username_email_address_reminder_email(test_user)

        expected_args_send_mail = {
            "from_email": ANY,
            "message": operators.Contains(test_email)
            & operators.Contains(test_user.username),
            "subject": ANY,
            "recipient_list": [test_email],
        }
        mock_mail.send_mail.assert_called_with(**expected_args_send_mail)
        mock_logger.exception.assert_called()
