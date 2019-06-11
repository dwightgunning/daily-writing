from datetime import datetime, timedelta, timezone

from django.contrib.auth import get_user_model
from django.utils import timezone as django_timezone
from rest_framework.test import APIRequestFactory, APITestCase, force_authenticate
from rest_framework import status

from entries.views import EntryViewSet
from entries.models import Entry


class TestEntryViewSet(APITestCase):
    def setUp(self):
        # Formatted dates
        self.start_time = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f%z")
        self.today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        self.tomorrow = (datetime.now(timezone.utc) + timedelta(days=1)).strftime(
            "%Y-%m-%d"
        )

        # Test users
        self.test_user = get_user_model().objects.create(
            username="tester", email="tester@email.com"
        )
        self.other_user = get_user_model().objects.create(
            username="tester2", email="tester2@email.com"
        )

        # Test data and an initialised (but unsaved) Entry model
        self.test_data = {
            "author": self.test_user.username,
            "entry_date": self.today,
            "start_time": self.start_time,
            "words": "My first entry...",
        }
        self.test_entry = Entry(
            author=self.test_user,
            start_time=self.start_time,
            entry_date=self.today,
            words="blah",
            word_count=1,
            milestone_word_count=self.test_user.daily_writing_profile.target_milestone_word_count,
        )

    def test_list_entries_empty(self):
        """ Entries list for user with no entries returns an empty array
        """
        factory = APIRequestFactory()
        request = factory.get(f"/entries/{self.test_user.username}/")
        force_authenticate(request, user=self.test_user)

        view = EntryViewSet.as_view({"get": "list"})
        response = view(request, username=self.test_user.username)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(len(response.data["results"]), 0)
        self.assertEqual(response.data["results"], [])

    def test_list_entries(self):
        """ Entries list for user with at least one entry returns an array
        """
        self.test_entry.save()
        factory = APIRequestFactory()
        request = factory.get(f"/entries/{self.test_user.username}/")
        force_authenticate(request, user=self.test_user)

        view = EntryViewSet.as_view({"get": "list"})
        response = view(request, username=self.test_user.username)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(
            set(response.data["results"][0].keys()),
            set(
                [
                    "author",
                    "entry_date",
                    "entry_timezone",
                    "start_time",
                    "milestone_time",
                    "finish_time",
                    "milestone_word_count",
                    "words",
                    "word_count",
                    "created_date",
                    "modified_date",
                ]
            ),
        )

    def test_list_entries_unauth(self):
        """ Entries list for user when unauthenticated returns unauthorized error
        """
        factory = APIRequestFactory()
        request = factory.get(f"/entries/{self.test_user.username}/")

        view = EntryViewSet.as_view({"get": "list"})
        response = view(request, username=self.test_user.username)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_entries_other_user(self):
        """ Entries list for user another returns forbidden error
        """
        factory = APIRequestFactory()
        request = factory.get(f"/entries/{self.test_user.username}/")
        force_authenticate(request, self.other_user)

        view = EntryViewSet.as_view({"get": "list"})
        response = view(request, username=self.test_user.username)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_entry(self):
        """ Entry retrieval for existing entry returns the entry object
        """
        self.test_entry.save()
        factory = APIRequestFactory()
        request = factory.get(
            f"/entries/{self.test_user.username}/{self.test_data['entry_date']}/"
        )
        force_authenticate(request, user=self.test_user)

        view = EntryViewSet.as_view({"get": "retrieve"})
        response = view(
            request,
            username=self.test_user.username,
            entry_date=self.test_data["entry_date"],
        )
        response.render()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            set(response.data.keys()),
            set(
                [
                    "author",
                    "entry_date",
                    "entry_timezone",
                    "start_time",
                    "milestone_time",
                    "finish_time",
                    "milestone_word_count",
                    "words",
                    "word_count",
                    "created_date",
                    "modified_date",
                ]
            ),
        )

    def test_retrieve_entry_unauth(self):
        """ Entry retrieval for user when unauthenticated returns unauthorized error
        """
        factory = APIRequestFactory()
        request = factory.get(
            f"/entries/{self.test_user.username}/{self.test_data['entry_date']}/"
        )

        view = EntryViewSet.as_view({"get": "retrieve"})
        response = view(
            request,
            username=self.test_user.username,
            entry_date=self.test_data["entry_date"],
        )
        response.render()

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_retrieve_entry_other_user(self):
        """ Entry retrieval for other user returns forbidden error
        """
        factory = APIRequestFactory()
        request = factory.get(
            f"/entries/{self.test_user.username}/{self.test_data['entry_date']}/"
        )
        force_authenticate(request, self.other_user)

        view = EntryViewSet.as_view({"get": "retrieve"})
        response = view(
            request,
            username=self.test_user.username,
            entry_date=self.test_data["entry_date"],
        )
        response.render()

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_create_entry(self):
        """ Entry creation when authenticated returns created code and the entry object
        """
        factory = APIRequestFactory()
        request = factory.post("/", self.test_data)
        force_authenticate(request, user=self.test_user)

        view = EntryViewSet.as_view({"post": "create"})
        response = view(request, self.test_data)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(
            set(response.data.keys()),
            set(
                [
                    "author",
                    "entry_date",
                    "entry_timezone",
                    "start_time",
                    "milestone_time",
                    "finish_time",
                    "milestone_word_count",
                    "words",
                    "word_count",
                    "created_date",
                    "modified_date",
                ]
            ),
        )
        self.assertTrue(self.test_data.items() <= response.data.items())
        self.assertEqual(
            response.data["milestone_word_count"],
            self.test_user.daily_writing_profile.target_milestone_word_count,
        )

    def test_create_entry_unauth(self):
        """ Entry creation when unauthenticated returns unauthorized error
        """
        factory = APIRequestFactory()
        request = factory.post("/", self.test_data)

        view = EntryViewSet.as_view({"post": "create"})
        response = view(request, username=self.test_user.username)
        response.render()

        self.assertEqual(
            response.status_code, status.HTTP_401_UNAUTHORIZED, response.data
        )

    def test_create_entry_other_user(self):
        """ Entry creation for another user returns forbidden error
        """
        factory = APIRequestFactory()
        request = factory.post("/", self.test_data)
        force_authenticate(request, self.other_user)

        view = EntryViewSet.as_view({"post": "create"})
        response = view(request)
        response.render()

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN, response.data)

    def test_create_entry_existing(self):
        """ Entry creation when an entry exists for the date provided returns unprocessable error
        """
        self.test_entry.save()

        factory = APIRequestFactory()
        request = factory.post("/", self.test_data)
        force_authenticate(request, user=self.test_user)

        view = EntryViewSet.as_view({"post": "create"})
        response = view(request)
        response.render()

        self.assertEqual(
            response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY, response.data
        )

    def test_create_entry_not_today(self):
        """ Entry creation for a date other than today returns unprocessable error
        """
        self.test_data["entry_date"] = self.tomorrow

        factory = APIRequestFactory()
        request = factory.post("/", self.test_data)
        force_authenticate(request, user=self.test_user)

        view = EntryViewSet.as_view({"post": "create"})
        response = view(request)
        response.render()

        self.assertEqual(
            response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY, response.data
        )

    def test_update_entry(self):
        """ Entry update returns success code and entry object
        """
        self.test_entry.save()
        self.test_data["words"] = "Updated words."

        factory = APIRequestFactory()
        request = factory.patch(
            f"/entries/{self.test_user.username}/{self.test_data['entry_date']}/",
            self.test_data,
        )
        force_authenticate(request, user=self.test_user)

        view = EntryViewSet.as_view({"patch": "update"})
        response = view(
            request,
            username=self.test_user.username,
            entry_date=self.test_data["entry_date"],
        )
        response.render()

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertTrue(self.test_data.items() <= response.data.items())
        self.assertIsNone(response.data["milestone_time"])
        self.assertEqual(
            set(response.data.keys()),
            set(
                [
                    "author",
                    "entry_date",
                    "entry_timezone",
                    "start_time",
                    "milestone_time",
                    "finish_time",
                    "milestone_word_count",
                    "words",
                    "word_count",
                    "created_date",
                    "modified_date",
                ]
            ),
        )

    def test_update_entry_milestone_first_reached(self):
        """
        Entry update when milestone reached returns success code and entry object with the milestone_time field set
        """
        self.test_user.daily_writing_profile.target_milestone_word_count = (
            self.test_entry.milestone_word_count
        ) = 3
        self.test_user.daily_writing_profile.save()
        self.test_entry.words = ""
        self.test_entry.save()

        self.test_data["words"] = "one two three four"

        factory = APIRequestFactory()
        request = factory.patch(
            f"/entries/{self.test_user.username}/{self.test_data['entry_date']}/",
            self.test_data,
        )
        force_authenticate(request, user=self.test_user)

        view = EntryViewSet.as_view({"patch": "update"})
        response = view(
            request,
            username=self.test_user.username,
            entry_date=self.test_data["entry_date"],
        )
        response.render()

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertIsNotNone(response.data["milestone_time"])

    def test_update_entry_after_milestone_already_reached(self):
        """
        Entry update after milestone already reached does not modify the existing milestone time
        """
        self.test_user.daily_writing_profile.target_milestone_word_count = (
            self.test_entry.milestone_word_count
        ) = 3
        self.test_user.daily_writing_profile.save()
        self.test_entry.words = "one two three four"
        test_milestone_time = self.test_entry.milestone_time = (
            django_timezone.now() - timedelta(hours=1)
        ).strftime("%Y-%m-%dT%H:%M:%S.%f%z")
        self.test_entry.save()

        factory = APIRequestFactory()
        request = factory.patch(
            f"/entries/{self.test_user.username}/{self.test_data['entry_date']}/",
            self.test_data,
        )
        force_authenticate(request, user=self.test_user)

        view = EntryViewSet.as_view({"patch": "update"})
        response = view(
            request,
            username=self.test_user.username,
            entry_date=self.test_data["entry_date"],
        )
        response.render()

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data["milestone_time"], test_milestone_time)

    def test_update_entry_modify_start_time(self):
        """
        Entry updates attempting to set start_time field returns a bad request error
        """
        self.test_entry.save()
        self.test_data["start_time"] = (
            datetime.now(timezone.utc) + timedelta(days=1)
        ).strftime("%Y-%m-%dT%H:%M:%S.%f%z")

        factory = APIRequestFactory()
        request = factory.patch(
            f"/entries/{self.test_user.username}/{self.test_data['entry_date']}/",
            self.test_data,
        )
        force_authenticate(request, user=self.test_user)

        view = EntryViewSet.as_view({"patch": "update"})
        response = view(
            request,
            username=self.test_user.username,
            entry_date=self.test_data["entry_date"],
        )
        response.render()

        self.assertEqual(
            response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY, response.data
        )

    def test_update_entry_modify_milestone_time_milestone_word_count(self):
        """
        Entry updates ignore changes to milestone_time or milestone_word_count fields returns and return ok
        """
        self.test_entry.save()
        self.test_data["words"] += " With more words"
        self.test_data["milestone_word_count"] = (
            self.test_user.daily_writing_profile.target_milestone_word_count - 1
        )
        self.test_data["milestone_word_count"] = (
            datetime.now(timezone.utc) + timedelta(hours=1)
        ).strftime("%Y-%m-%dT%H:%M:%S.%f%z")

        factory = APIRequestFactory()
        request = factory.patch(
            f"/entries/{self.test_user.username}/{self.test_data['entry_date']}/",
            self.test_data,
        )
        force_authenticate(request, user=self.test_user)

        view = EntryViewSet.as_view({"patch": "update"})
        response = view(
            request,
            username=self.test_user.username,
            entry_date=self.test_data["entry_date"],
        )
        response.render()

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["words"], self.test_data["words"])
        self.assertEqual(
            response.data["milestone_word_count"],
            self.test_user.daily_writing_profile.target_milestone_word_count,
        )

    def test_update_entry_modify_date_from_today(self):
        """ Entry updates for today's date may not be modified to another date.
        """
        self.test_entry.save()

        self.test_data["entry_date"] = self.tomorrow

        factory = APIRequestFactory()
        request = factory.patch(
            f"/entries/{self.test_user.username}/{self.today}/", self.test_data
        )
        force_authenticate(request, user=self.test_user)

        view = EntryViewSet.as_view({"patch": "update"})
        response = view(
            request, username=self.test_user.username, entry_date=self.today
        )
        response.render()

        self.assertEqual(
            response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY, response.data
        )

    def test_update_entry_not_today(self):
        """ Entry for dates other than self.today may not be modified.
        """
        self.test_entry.entry_date = self.test_data["entry_date"] = self.tomorrow
        self.test_entry.save()

        factory = APIRequestFactory()
        request = factory.patch(
            f"/entries/{self.test_user.username}/{self.tomorrow}/", self.test_data
        )
        force_authenticate(request, user=self.test_user)

        view = EntryViewSet.as_view({"patch": "update"})
        response = view(
            request,
            username=self.test_user.username,
            entry_date=self.test_data["entry_date"],
        )
        response.render()

        self.assertEqual(
            response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY, response.data
        )

    def test_update_entry_unauth(self):
        """ Entry updates when unauthenticated returns unauthorized error
        """
        factory = APIRequestFactory()
        request = factory.patch(
            f"/entries/{self.test_user.username}/{self.test_data['entry_date']}/",
            self.test_data,
        )

        view = EntryViewSet.as_view({"patch": "update"})
        response = view(
            request,
            username=self.test_user.username,
            entry_date=self.test_data["entry_date"],
        )
        response.render()

        self.assertEqual(
            response.status_code, status.HTTP_401_UNAUTHORIZED, response.data
        )

    def test_update_entry_does_not_exist(self):
        """ Entry updates when entry does not exist returns not found error
        """
        factory = APIRequestFactory()
        request = factory.patch(
            f"/entries/{self.test_user.username}/{self.test_data['entry_date']}/",
            self.test_data,
        )
        force_authenticate(request, user=self.test_user)

        view = EntryViewSet.as_view({"patch": "update"})
        response = view(
            request,
            username=self.test_user.username,
            entry_date=self.test_data["entry_date"],
        )
        response.render()

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND, response.data)
