from django.contrib.auth import get_user_model
import pytz
from rest_framework.test import APIRequestFactory, APITestCase, force_authenticate
from rest_framework import status

from users.views import DailyWritingProfileView
from users.models import DailyWritingProfile


class TestDailyWritingProfile(APITestCase):
    """ Unit tests for DailyWritingProfile APIView
    """

    def setUp(self):
        self.test_user = get_user_model().objects.create(
            username="tester",
            first_name="test_first",
            last_name="test_last",
            email="tester@email.com",
        )
        self.test_tz_str = "Australia/Brisbane"
        self.test_user.daily_writing_profile.timezone = pytz.timezone(self.test_tz_str)
        self.test_user.daily_writing_profile.save()

    def test_retrieve(self):
        """ Profile retrieval for authenticated user returns the profile object
        """
        factory = APIRequestFactory()
        request = factory.get("/profile/")
        force_authenticate(request, user=self.test_user)

        view = DailyWritingProfileView.as_view()
        response = view(request)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            set(response.data.keys()),
            set(
                [
                    "first_name",
                    "last_name",
                    "email",
                    "timezone",
                    "target_milestone_word_count",
                ]
            ),
        )
        self.assertEqual(response.data["first_name"], self.test_user.first_name)
        self.assertEqual(response.data["last_name"], self.test_user.last_name)
        self.assertEqual(response.data["email"], self.test_user.email)
        self.assertEqual(
            response.data["timezone"],
            str(self.test_user.daily_writing_profile.timezone),
        )
        self.assertEqual(
            response.data["target_milestone_word_count"],
            self.test_user.daily_writing_profile.target_milestone_word_count,
        )

    def test_retrieve_profile_not_created(self):
        """
        Profile retrieval for authenticated user creates the profile model when necessary
        and returns the profile object.
        """
        self.test_user.daily_writing_profile.delete()

        factory = APIRequestFactory()
        request = factory.get("/profile/")
        force_authenticate(request, user=self.test_user)

        view = DailyWritingProfileView.as_view()
        response = view(request)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            response.data["target_milestone_word_count"],
            DailyWritingProfile._meta.get_field(
                "target_milestone_word_count"
            ).get_default(),
        )
        self.assertEqual(
            response.data["timezone"],
            str(DailyWritingProfile._meta.get_field("timezone").get_default()),
        )

    def test_retrieve_unauthenticated(self):
        """ Entry retrieval for user when unauthenticated returns unauthorized error
        """
        factory = APIRequestFactory()
        request = factory.get("/profile/")

        view = DailyWritingProfileView.as_view()
        response = view(request)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update(self):
        """ Updates to both profile and user model fields are handled and OK response is returned
        """
        data = {
            "first_name": "new_first_name",
            "last_name": "new_last_name",
            "timezone": "Europe/Amsterdam",
            "target_milestone_word_count": 450,
        }
        factory = APIRequestFactory()
        request = factory.put("/profile/", data)
        force_authenticate(request, user=self.test_user)

        view = DailyWritingProfileView.as_view()
        response = view(request)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(
            set(response.data.keys()),
            set(
                [
                    "first_name",
                    "last_name",
                    "email",
                    "timezone",
                    "target_milestone_word_count",
                ]
            ),
        )
        self.assertEqual(response.data["first_name"], data["first_name"])
        self.assertEqual(response.data["last_name"], data["last_name"])
        self.assertEqual(response.data["email"], self.test_user.email)
        self.assertEqual(response.data["timezone"], data["timezone"])
        self.assertEqual(
            response.data["target_milestone_word_count"],
            data["target_milestone_word_count"],
        )

    def test_update_profile_fields_only(self):
        """ Updates to profile model fields are handled and OK response is returned
        """
        data = {"timezone": "Europe/Amsterdam", "target_milestone_word_count": 450}
        factory = APIRequestFactory()
        request = factory.put("/profile/", data)
        force_authenticate(request, user=self.test_user)

        view = DailyWritingProfileView.as_view()
        response = view(request)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(
            set(response.data.keys()),
            set(
                [
                    "first_name",
                    "last_name",
                    "email",
                    "timezone",
                    "target_milestone_word_count",
                ]
            ),
        )
        self.assertEqual(response.data["first_name"], self.test_user.first_name)
        self.assertEqual(response.data["last_name"], self.test_user.last_name)
        self.assertEqual(response.data["email"], self.test_user.email)
        self.assertEqual(response.data["timezone"], data["timezone"])
        self.assertEqual(
            response.data["target_milestone_word_count"],
            data["target_milestone_word_count"],
        )

    def test_update_user_model_fields_only(self):
        """ Updates to user model fields are handled and OK response is returned
        """
        data = {"first_name": "new_first_name", "last_name": "new_last_name"}
        factory = APIRequestFactory()
        request = factory.put("/profile/", data)
        force_authenticate(request, user=self.test_user)

        view = DailyWritingProfileView.as_view()
        response = view(request)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(
            set(response.data.keys()),
            set(
                [
                    "first_name",
                    "last_name",
                    "email",
                    "timezone",
                    "target_milestone_word_count",
                ]
            ),
        )
        self.assertEqual(response.data["first_name"], data["first_name"])
        self.assertEqual(response.data["last_name"], data["last_name"])
        self.assertEqual(response.data["email"], self.test_user.email)
        self.assertEqual(
            response.data["timezone"],
            str(self.test_user.daily_writing_profile.timezone),
        )
        self.assertEqual(
            response.data["target_milestone_word_count"],
            self.test_user.daily_writing_profile.target_milestone_word_count,
        )

    def test_update_unauthenticated(self):
        """ Profile updates when unauthenticated returns unauthorized error
        """
        data = {
            "first_name": "new_first_name",
            "last_name": "new_last_name",
            "timezone": "Europe/Amsterdam",
            "target_milestone_word_count": 450,
        }
        factory = APIRequestFactory()
        request = factory.put("/profile/", data)

        view = DailyWritingProfileView.as_view()
        response = view(request)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_email(self):
        """ Email field updates are ignored while other updates are applied and an OK response is returned
        """
        data = {"first_name": "new_first_name", "email": "newemail@tester.com"}
        factory = APIRequestFactory()
        request = factory.put("/profile/", data)
        force_authenticate(request, user=self.test_user)

        view = DailyWritingProfileView.as_view()
        response = view(request)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["first_name"], data["first_name"])
        self.assertEqual(response.data["email"], self.test_user.email)

    def test_update_invalid_timezone(self):
        """ Invalid timezones returns an unprocessible error
        """
        data = {
            "first_name": "new_first_name",
            "last_name": "new_last_name",
            "email": "newemail@tester.com",
            "timezone": "invalid tz",
            "target_milestone_word_count": 450,
        }
        factory = APIRequestFactory()
        request = factory.put("/profile/", data)
        force_authenticate(request, user=self.test_user)

        view = DailyWritingProfileView.as_view()
        response = view(request)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
