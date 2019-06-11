from allauth.account.models import EmailAddress, EmailConfirmationHMAC
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core import mail
from rest_auth.views import LoginView, PasswordResetView
from rest_framework import status
from rest_framework.test import APIRequestFactory, APITestCase, force_authenticate

from users.views import InviteRequestAcceptanceView, InviteRequestView

UserModel = get_user_model()


class TestInviteAPIViews(APITestCase):
    """
    Unit tests for the Invite API view
    """

    fixtures = ["dailywriting/fixtures/seed.json"]

    def setUp(self):
        self.factory = APIRequestFactory()
        self.existing_user = UserModel.objects.create(
            username="tester", email="tester@test.com"
        )
        self.existing_user.groups.add(Group.objects.get(name="Invite Accepted"))
        self.requested_invite_user = UserModel.objects.create(
            username="tester2", email="tester2@test.com"
        )
        self.requested_invite_user.groups.add(
            Group.objects.get(name="Invite Requested")
        )

    def test_request_invite(self):
        """ Request invite flow

        Returns success status, creates user and email address models, triggers emails to user and admins
        """
        test_email = "new_tester@tester.com"

        response = self.client.post(
            path="/api/auth/registration/invite/",
            data={"email": test_email},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data, {"email": test_email})
        self.assertTrue(get_user_model().objects.filter(email=test_email).exists())
        self.assertTrue(EmailAddress.objects.filter(email=test_email).exists())
        self.assertEqual(mail.outbox[0].to, [test_email])
        self.assertEqual(
            mail.outbox[1].to, [admin_tuple[1] for admin_tuple in settings.ADMINS]
        )

    def test_request_invite_with_email_already_accepted(self):
        """ Request invite flow with email address associated with an existing request

        Returns success status and re-sends the invite
        """
        test_email = self.existing_user.email

        request = self.factory.post(
            path="/api/auth/registration/invite/",
            data={"email": test_email},
            format="json",
        )
        request.session = (
            {}
        )  # Stub session as middleware doesn't run with APIRequestFactory

        view = InviteRequestView.as_view()
        response = view(request)
        response.render()

        # Response always successul to avoid exposing whether an account with the provided email exists (or not)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data, {"email": test_email})
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].subject, "[Daily Writing] Account reminder")

    def test_login_without_password(self):
        """ Login without password
        """
        request = self.factory.post(
            path="/api/auth/login/",
            data={"email": self.requested_invite_user.email},
            format="json",
        )

        view = LoginView.as_view()
        response = view(request)
        response.render()

        self.assertEqual(response.status_code, 400)
        self.assertFalse("email" in response.data)
        self.assertEqual(len(response.data["password"]), 1)
        self.assertEqual(response.data["password"][0].code, "required")

    def test_initiate_password_reset_with_requested_invite_user(self):
        """ Request password reset with user that has requested invite

        Returns success status but takes no action
        """
        response = self.client.post(
            path="/api/auth/password/reset/",
            data={"email": self.requested_invite_user.email},
            format="json",
        )

        # Response always successul to avoid exposing whether an account with the provided email exists (or not)
        self.assertEqual(response.status_code, 200)
        self.assertTrue("detail" in response.data)
        self.assertEqual(len(mail.outbox), 0)

    def test_initiate_password_reset_with_active_user(self):
        """ Request password reset with active user

        Returns success status and triggers email to user
        """
        response = self.client.post(
            path="/api/auth/password/reset/",
            data={"email": self.existing_user.email},
            format="json",
        )

        # Response always successul to avoid exposing whether an account with the provided email exists (or not)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(mail.outbox[0].to, [self.existing_user.email])


class TestInviteRequestAcceptanceView(APITestCase):
    """ Unit tests for Request Acceptance APIView
    """

    fixtures = ["dailywriting/fixtures/seed.json"]

    def setUp(self):
        self.test_user = UserModel.objects.create(
            username="tester",
            first_name="test_first",
            last_name="test_last",
            email="tester@email.com",
        )
        self.test_email_address = EmailAddress.objects.create(
            email=self.test_user.email, user=self.test_user
        )

    def test_retrieve_token(self):
        """ Retrieve an invite token in order to check it's validity
        """
        self.test_user.groups.add(Group.objects.get(name="Invited"))
        test_token = EmailConfirmationHMAC(self.test_email_address).key
        factory = APIRequestFactory()
        request = factory.get(f"auth/registration/invite/{test_token}/")

        view = InviteRequestAcceptanceView.as_view()
        response = view(request, token=test_token)
        response.render()
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)

    def test_retrieve_token_user_accepted_invite(self):
        """ Retrieve an invite token in order to check it's validity
        """
        self.test_user.groups.add(Group.objects.get(name="Invite Accepted"))
        test_token = EmailConfirmationHMAC(self.test_email_address).key
        factory = APIRequestFactory()
        request = factory.get(f"auth/registration/invite/{test_token}/")

        view = InviteRequestAcceptanceView.as_view()
        response = view(request, token=test_token)
        response.render()
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )

    def test_retrieve_token_invalid(self):
        """ Retrieve an invalid token returns a not found error
        """
        test_token = "invalid_token"
        factory = APIRequestFactory()
        request = factory.get(f"auth/registration/invite/{test_token}/")

        view = InviteRequestAcceptanceView.as_view()
        response = view(request, token=test_token)
        response.render()
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )

    def test_post(self):
        """ Post invite acceptance

        Returns success status, moves user to Invite Accepted group, and makes password usable
        """
        self.test_user.groups.add(Group.objects.get(name="Invited"))
        test_token = EmailConfirmationHMAC(self.test_email_address).key

        test_data = {
            "token": test_token,
            "username": self.test_user.username,
            "password": "#@$faXPEf24432d",
        }
        factory = APIRequestFactory()
        request = factory.post(f"auth/registration/invite/{test_token}/", test_data)

        view = InviteRequestAcceptanceView.as_view()
        response = view(request, token=test_token, data=test_data)
        response.render()
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertFalse(self.test_user.groups.filter(name="Invited").exists())
        self.assertTrue(self.test_user.groups.filter(name="Invite Accepted").exists())
        self.assertTrue(self.test_user.has_usable_password())

    def test_post_invalid_token(self):
        """ Post invite acceptance with invalid token

        Returns bad request status and makes no change to the associated test user
        """
        self.test_user.groups.add(Group.objects.get(name="Invited"))
        test_token = "invalid_token"

        test_data = {
            "token": test_token,
            "username": self.test_user.username,
            "password": "#@$faXPEf24432d",
        }
        factory = APIRequestFactory()
        request = factory.post(f"auth/registration/invite/{test_token}/", test_data)

        view = InviteRequestAcceptanceView.as_view()
        response = view(request, token=test_token, data=test_data)
        response.render()
        self.assertEqual(
            response.status_code, status.HTTP_400_BAD_REQUEST, response.data
        )
        self.assertTrue(self.test_user.groups.filter(name="Invited").exists())
        self.assertFalse(self.test_user.groups.filter(name="Invite Accepted").exists())
