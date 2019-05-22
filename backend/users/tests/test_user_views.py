from allauth.account.models import EmailAddress
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core import mail
from rest_framework.test import APIRequestFactory, APITestCase
from rest_auth.views import LoginView, PasswordResetView

from users.views import InviteRequestView


class UserAPITests(APITestCase):
    """
    User API View tests using APITestFactory focussed on testing response status and data
    """

    fixtures = ["dailywriting/fixtures/seed.json", "test_users.json"]

    def setUp(self):
        self.factory = APIRequestFactory()
        self.user_model = get_user_model()
        self.existing_user = self.user_model.objects.get(
            email="existing_user@tester.com"
        )

    def test_request_invite(self):
        test_email = "new_tester@tester.com"

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

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data, {"email": test_email})

    def test_request_invite_with_existing_email(self):
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

    def test_login_with_requested_invite_user(self):
        requested_invite_user = self.user_model.objects.get(
            email="requested_invite_user@tester.com"
        )

        request = self.factory.post(
            path="/api/auth/login/",
            data={"email": requested_invite_user.email},
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
        requested_invite_user = self.user_model.objects.get(
            email="requested_invite_user@tester.com"
        )

        request = self.factory.post(
            path="/api/auth/password/reset/",
            data={"email": requested_invite_user.email},
            format="json",
        )

        view = PasswordResetView.as_view()
        response = view(request)
        response.render()

        # Response always successul to avoid exposing whether an account with the provided email exists (or not)
        self.assertEqual(response.status_code, 200)
        self.assertTrue("detail" in response.data)


class UserAPIE2ETests(APITestCase):
    """
    User API View E2E tests using the TestClient
    """

    fixtures = ["dailywriting/fixtures/seed.json", "test_users.json"]

    def setUp(self):
        self.user_model = get_user_model()
        self.existing_user = self.user_model.objects.get(
            email="existing_user@tester.com"
        )

    def test_request_invite(self):
        test_email = "new_tester@tester.com"

        response = self.client.post(
            path="/api/auth/registration/invite/",
            data={"email": test_email},
            format="json",
        )

        self.assertEqual(response.status_code, 201)

        self.user_model.objects.get(email=test_email)
        EmailAddress.objects.get(email=test_email)
        self.assertEqual(mail.outbox[0].to, [test_email])
        self.assertEqual(
            mail.outbox[1].to, [admin_tuple[1] for admin_tuple in settings.ADMINS]
        )

    def test_initiate_password_reset_with_requested_invite_user(self):
        requested_invite_user = self.user_model.objects.get(
            email="requested_invite_user@tester.com"
        )

        response = self.client.post(
            path="/api/auth/password/reset/",
            data={"email": requested_invite_user.email},
            format="json",
        )

        # Response always successul to avoid exposing whether an account with the provided email exists (or not)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)

    def test_initiate_password_reset_with_active_user(self):
        active_user = self.user_model.objects.get(email="existing_user@tester.com")

        response = self.client.post(
            path="/api/auth/password/reset/",
            data={"email": active_user.email},
            format="json",
        )

        # Response always successul to avoid exposing whether an account with the provided email exists (or not)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(mail.outbox[0].to, [active_user.email])
