from datetime import datetime, timedelta, timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, APITestCase, force_authenticate

from entries.views import EntryViewSet
from entries.models import Entry


class EntryTests(APITestCase):
    fixtures = ["entries.json"]

    def add_auth(self, request, username="tester"):
        user = get_user_model().objects.get(username=username)
        force_authenticate(request, user=user)

    def test_list_entries_empty(self):
        username = "tester"
        factory = APIRequestFactory()
        request = factory.get(f"/entries/{username}/")
        self.add_auth(request, username)

        view = EntryViewSet.as_view({"get": "list"})
        response = view(request, username=username)
        response.render()

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 0)
        self.assertEqual(len(response.data["results"]), 0)
        self.assertEqual(response.data["results"], [])

    def test_list_entries(self):
        username = "tester2"
        factory = APIRequestFactory()
        request = factory.get(f"/entries/{username}/")
        self.add_auth(request, username)

        view = EntryViewSet.as_view({"get": "list"})
        response = view(request, username=username)
        response.render()

        self.assertEqual(response.status_code, 200)
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
                ]
            ),
        )

    def test_list_entries_unauth(self):
        username = "tester"

        factory = APIRequestFactory()
        request = factory.get(f"/entries/{username}/")

        view = EntryViewSet.as_view({"get": "list"})
        response = view(request, username=username)
        response.render()

        self.assertEqual(response.status_code, 401)

    def test_list_entries_other_user(self):
        username = "tester2"
        factory = APIRequestFactory()
        request = factory.get(f"/entries/{username}/")
        self.add_auth(request, "tester")

        view = EntryViewSet.as_view({"get": "list"})
        response = view(request, username=username)
        response.render()

        self.assertEqual(response.status_code, 403)

    def test_retrieve_entry(self):
        username = "tester2"
        entry_date = "2017-08-31"

        factory = APIRequestFactory()
        request = factory.get(f"/entries/{username}/{entry_date}/")
        self.add_auth(request, username)

        view = EntryViewSet.as_view({"get": "retrieve"})
        response = view(request, username=username, entry_date=entry_date)
        response.render()

        self.assertEqual(response.status_code, 200)
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
        username = "tester2"
        entry_date = "2017-08-31"

        factory = APIRequestFactory()
        request = factory.get(f"/entries/{username}/{entry_date}/")

        view = EntryViewSet.as_view({"get": "retrieve"})
        response = view(request, username=username, entry_date=entry_date)
        response.render()

        self.assertEqual(response.status_code, 401)

    def test_retrieve_entry_other_user(self):
        username = "tester2"
        entry_date = "2017-08-31"

        factory = APIRequestFactory()
        request = factory.get(f"/entries/{username}/{entry_date}/")
        self.add_auth(request, "tester")

        view = EntryViewSet.as_view({"get": "retrieve"})
        response = view(request, username=username, entry_date=entry_date)
        response.render()

        self.assertEqual(response.status_code, 403, response.data)

    def test_create_entry(self):
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        data = {"author": "tester", "entry_date": today, "words": "My first entry..."}

        factory = APIRequestFactory()
        request = factory.post("/", data)
        self.add_auth(request, data["author"])

        view = EntryViewSet.as_view({"post": "create"})
        response = view(request, data)
        response.render()

        self.assertEqual(response.status_code, 201, response.data)

    def test_create_entry_unauth(self):
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        data = {"author": "tester", "entry_date": today, "words": "My first entry..."}

        factory = APIRequestFactory()
        request = factory.post("/", data)

        view = EntryViewSet.as_view({"post": "create"})
        response = view(request, username=data["author"])
        response.render()

        self.assertEqual(response.status_code, 401, response.data)

    def test_create_entry_other_user(self):
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        data = {"author": "tester", "entry_date": today, "words": "My first entry..."}

        factory = APIRequestFactory()
        request = factory.post("/", data)
        self.add_auth(request, "tester2")

        view = EntryViewSet.as_view({"post": "create"})
        response = view(request)
        response.render()

        self.assertEqual(response.status_code, 403, response.data)

    def test_create_entry_existing(self):
        data = {
            "author": "tester2",
            "entry_date": "2017-08-31",
            "words": "My first entry...",
        }

        factory = APIRequestFactory()
        request = factory.post("/", data)
        self.add_auth(request, "tester2")

        view = EntryViewSet.as_view({"post": "create"})
        response = view(request)
        response.render()

        self.assertEqual(response.status_code, 400, response.data)

    def test_create_entry_not_today(self):
        tomorrow_date = datetime.now(timezone.utc) + timedelta(days=1)
        tomorrow = tomorrow_date.strftime("%Y-%m-%d")

        data = {
            "author": "tester",
            "entry_date": tomorrow,
            "words": "My first entry...",
        }

        factory = APIRequestFactory()
        request = factory.post("/", data)
        self.add_auth(request, data["author"])

        view = EntryViewSet.as_view({"post": "create"})
        response = view(request)
        response.render()

        self.assertEqual(response.status_code, 400, response.data)

    def test_update_entry(self):
        today_date = datetime.now(timezone.utc)
        today = today_date.strftime("%Y-%m-%d")

        data = {"author": "tester2", "entry_date": today, "words": "My first entry..."}
        user = get_user_model().objects.get(username=data["author"])
        entry = Entry(
            author=user,
            entry_date=today,
            words="blah",
            word_count=1,
            milestone_word_count=750,
        )
        entry.save()

        data["words"] = "Updated words."

        factory = APIRequestFactory()
        request = factory.patch(
            f"/entries/{data['author']}/{data['entry_date']}/", data
        )
        self.add_auth(request, data["author"])

        view = EntryViewSet.as_view({"patch": "update"})
        response = view(request, username=data["author"], entry_date=data["entry_date"])
        response.render()

        self.assertEqual(response.status_code, 200, response.data)

    def test_update_entry_unauth(self):
        data = {
            "author": "tester2",
            "entry_date": "2017-08-31",
            "words": "My first entry...",
        }

        factory = APIRequestFactory()
        request = factory.patch(
            f"/entries/{data['author']}/{data['entry_date']}/", data
        )

        view = EntryViewSet.as_view({"patch": "update"})
        response = view(request, username=data["author"], entry_date=data["entry_date"])
        response.render()

        self.assertEqual(response.status_code, 401, response.data)

    def test_update_entry_attempt_date_change(self):
        today_date = datetime.now(timezone.utc)
        today = today_date.strftime("%Y-%m-%d")

        data = {"author": "tester2", "entry_date": today, "words": "My first entry..."}
        user = get_user_model().objects.get(username=data["author"])
        entry = Entry(
            author=user,
            entry_date=today,
            words="blah",
            word_count=1,
            milestone_word_count=750,
        )
        entry.save()

        data["entry_date"] = "2017-01-01"

        factory = APIRequestFactory()
        request = factory.patch(
            f"/entries/{data['author']}/{data['entry_date']}/", data
        )
        self.add_auth(request, data["author"])

        view = EntryViewSet.as_view({"patch": "update"})
        response = view(request, username=data["author"], entry_date=today)
        response.render()

        self.assertEqual(response.status_code, 400, response.data)

    def test_update_entry_does_not_exist(self):
        data = {
            "author": "tester2",
            "entry_date": "2017-07-31",
            "words": "My first entry...",
        }

        factory = APIRequestFactory()
        request = factory.patch(
            f"/entries/{data['author']}/{data['entry_date']}/", data
        )
        self.add_auth(request, data["author"])

        view = EntryViewSet.as_view({"patch": "update"})
        response = view(request, username=data["author"], entry_date=data["entry_date"])
        response.render()

        self.assertEqual(response.status_code, 404, response.data)

    def test_update_entry_not_today(self):
        tomorrow_date = datetime.now(timezone.utc) + timedelta(days=1)
        tomorrow = tomorrow_date.strftime("%Y-%m-%d")

        data = {
            "author": "tester2",
            "entry_date": tomorrow,
            "words": "My first entry...",
        }
        user = get_user_model().objects.get(username=data["author"])
        entry = Entry(
            author=user,
            entry_date=tomorrow,
            words="blah",
            word_count=1,
            milestone_word_count=750,
        )
        entry.save()

        factory = APIRequestFactory()
        request = factory.patch(
            f"/entries/{data['author']}/{data['entry_date']}/", data
        )
        self.add_auth(request, data["author"])

        view = EntryViewSet.as_view({"patch": "update"})
        response = view(request, username=data["author"], entry_date=data["entry_date"])
        response.render()

        self.assertEqual(response.status_code, 400, response.data)
