from allauth.account.models import EmailAddress
from django.contrib.admin import helpers
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.contrib.messages import get_messages
from django.core import mail
from django.template.response import TemplateResponse
from django.test import TestCase
from django.urls import reverse

from users.admin import DailyWritingUserAdmin, InviteFilter

UserModel = get_user_model()


class TestDailyWritingUserAdmin(TestCase):
    """ Unit test for Daily Writing User admin view
    """

    fixtures = ["dailywriting/fixtures/seed.json"]

    @classmethod
    def setUpTestData(cls):
        cls.superuser = UserModel.objects.create_superuser(
            username="super", password="secret", email="super@example.com"
        )

    def setUp(self):
        self.client.force_login(self.superuser)

    def test_send_user_invite_select_invite_requested(self):
        """ Users in the Invite Requested group are emailed and moved to the Invited group
        """
        u1 = UserModel.objects.create(email="tester1@tester.com", username="tester1")
        u1.groups.add(Group.objects.get(name="Invite Requested"))
        EmailAddress.objects.create(email="tester1@tester.com", user=u1)
        u2 = UserModel.objects.create(email="tester2@tester.com", username="tester2")
        u2.groups.add(Group.objects.get(name="Invite Requested"))
        EmailAddress.objects.create(email="tester2@tester.com", user=u2)
        action_data = {
            helpers.ACTION_CHECKBOX_NAME: [u1.pk, u2.pk],
            "action": "send_invite",
            "index": 0,
        }
        invite_confirmation_data = action_data.copy()
        invite_confirmation_data["post"] = "yes"
        user_changelist_url = reverse("admin:users_user_changelist")

        # A POST request to invite users displays the confirmation page
        response = self.client.post(user_changelist_url, action_data)
        self.assertIsInstance(response, TemplateResponse)
        self.assertContains(
            response,
            "<p>Are you sure you want to invite the selected users?</p>",
            html=True,
        )
        self.assertContains(response, f"<li>{u1}</li>", html=True)
        self.assertContains(response, f"<li>{u2}</li>", html=True)
        confirmation = self.client.post(user_changelist_url, invite_confirmation_data)
        self.assertRedirects(confirmation, user_changelist_url)
        self.assertTrue(
            get_user_model()
            .objects.get(pk=u1.pk)
            .groups.filter(name="Invited")
            .exists()
        )
        self.assertTrue(
            get_user_model()
            .objects.get(pk=u2.pk)
            .groups.filter(name="Invited")
            .exists()
        )
        self.assertFalse(
            get_user_model()
            .objects.get(pk=u1.pk)
            .groups.filter(name="Invite Requested")
            .exists()
        )
        self.assertFalse(
            get_user_model()
            .objects.get(pk=u2.pk)
            .groups.filter(name="Invite Requested")
            .exists()
        )
        self.assertEqual(len(mail.outbox), 2)
        self.assertEqual(
            mail.outbox[0].subject, "[Daily Writing] Your invitation to Daily Writing"
        )
        self.assertEqual(
            mail.outbox[1].subject, "[Daily Writing] Your invitation to Daily Writing"
        )

    def test_send_user_invite_select_already_invited(self):
        """ Users in the Invite Accepted group cannot be re-invited
        """
        u1 = UserModel.objects.create(email="tester1@tester.com", username="tester1")
        u1.groups.add(Group.objects.get(name="Invited"))
        EmailAddress.objects.create(email="tester1@tester.com", user=u1)
        u2 = UserModel.objects.create(email="tester2@tester.com", username="tester2")
        u2.groups.add(Group.objects.get(name="Invite Accepted"))
        EmailAddress.objects.create(email="tester2@tester.com", user=u2)
        action_data = {
            helpers.ACTION_CHECKBOX_NAME: [u1.pk, u2.pk],
            "action": "send_invite",
            "index": 0,
        }
        invite_confirmation_data = action_data.copy()
        invite_confirmation_data["post"] = "yes"
        user_changelist_url = reverse("admin:users_user_changelist")

        response = self.client.post(user_changelist_url, action_data)
        # A POST request to select protected objects displays the page which says that sending invites is prohibited.
        self.assertIsInstance(response, TemplateResponse)
        self.assertContains(
            response,
            "<p>The selected users already accepted the invitation:</p>",
            html=True,
        )
        self.assertNotContains(response, f"<li>{u1}</li>", html=True)
        self.assertContains(response, f"<li>{u2}</li>", html=True)

        response = self.client.post(user_changelist_url, invite_confirmation_data)
        # A POST request to invite protected objects displays the page which says that sending invites is prohibited.
        self.assertContains(
            response,
            "<p>The selected users already accepted the invitation:</p>",
            html=True,
        )
        self.assertTrue(
            get_user_model()
            .objects.get(pk=u1.pk)
            .groups.filter(name="Invited")
            .exists()
        )
        self.assertTrue(
            get_user_model()
            .objects.get(pk=u2.pk)
            .groups.filter(name="Invite Accepted")
            .exists()
        )

    def test_send_user_invite_select_none(self):
        """ Posting action with no users selected is a no-op
        """
        action_data = {
            helpers.ACTION_CHECKBOX_NAME: [],
            "action": "send_invite",
            "index": 0,
        }
        invite_confirmation_data = action_data.copy()
        invite_confirmation_data["post"] = "yes"
        user_changelist_url = reverse("admin:users_user_changelist")
        # A POST request to invite users with no users selected, redirects
        response = self.client.post(user_changelist_url, action_data)
        self.assertRedirects(response, user_changelist_url)
        messages = list(get_messages(response.wsgi_request))
        self.assertEqual(len(messages), 1)
        self.assertEqual(
            str(messages[0]),
            "Items must be selected in order to perform actions on them. No items have been changed.",
        )
        # A POST request to confirm inviting users with no users selected, redirects
        confirmation = self.client.post(user_changelist_url, invite_confirmation_data)
        self.assertRedirects(confirmation, user_changelist_url)
        self.assertEqual(len(mail.outbox), 0)
        messages = list(get_messages(confirmation.wsgi_request))
        self.assertEqual(len(messages), 1)
        self.assertEqual(
            str(messages[0]),
            "Items must be selected in order to perform actions on them. No items have been changed.",
        )

    def test_send_user_invite_select_unexpected_groups(self):
        """ Posting action with no users selected is a no-op
        """
        u1 = UserModel.objects.create(
            email="groupless@tester.com", username="groupless"
        )
        EmailAddress.objects.create(email="tester1@tester.com", user=u1)
        action_data = {
            helpers.ACTION_CHECKBOX_NAME: [u1.pk],
            "action": "send_invite",
            "index": 0,
        }
        invite_confirmation_data = action_data.copy()
        invite_confirmation_data["post"] = "yes"
        user_changelist_url = reverse("admin:users_user_changelist")
        # A POST request to invite users with no users selected, redirects
        response = self.client.post(user_changelist_url, action_data)
        self.assertContains(
            response,
            "<p>The selected user already accepted the invitation:</p>",
            html=True,
        )
        self.assertContains(response, f"<li>{u1}</li>", html=True)
        # A POST request to confirm inviting users with no users selected has no effect
        confirmation = self.client.post(user_changelist_url, invite_confirmation_data)
        self.assertEqual(len(mail.outbox), 0)
        messages = list(get_messages(confirmation.wsgi_request))
        self.assertEqual(len(messages), 0)


class TestInviteFilter(TestCase):
    """ Unit tests fo the Invite Filter
    """

    fixtures = ["dailywriting/fixtures/seed.json"]

    def setUp(self):
        self.test_queryset = UserModel.objects.all()
        self.tester1 = UserModel.objects.create(
            username="tester1", email="tester1@test.com"
        )
        self.tester1.groups.add(Group.objects.get(name="Invite Requested"))
        self.tester2 = UserModel.objects.create(
            username="tester2", email="tester2@test.com"
        )
        self.tester2.groups.add(Group.objects.get(name="Invited"))
        self.tester3 = UserModel.objects.create(
            username="tester3", email="tester3@test.com"
        )
        self.tester3.groups.add(Group.objects.get(name="Invite Accepted"))

    def test_requested(self):
        """ Filter 'requested' returns users in the "Invite Requested" group
        """
        invite_filter = InviteFilter(
            None,
            {InviteFilter.parameter_name: "requested"},
            get_user_model(),
            DailyWritingUserAdmin,
        )
        filtered_users = invite_filter.queryset(None, self.test_queryset)
        self.assertEqual(list(filtered_users), [self.tester1])

    def test_invited(self):
        """ Filter 'invited' returns users in the "Invited" group
        """
        invite_filter = InviteFilter(
            None,
            {InviteFilter.parameter_name: "invited"},
            get_user_model(),
            DailyWritingUserAdmin,
        )
        filtered_users = invite_filter.queryset(None, self.test_queryset)
        self.assertEqual(list(filtered_users), [self.tester2])

    def test_invite_accepted(self):
        """ Filter 'accepted' keywoard returns users in the "Invite Accepted" group
        """
        invite_filter = InviteFilter(
            None,
            {InviteFilter.parameter_name: "accepted"},
            get_user_model(),
            DailyWritingUserAdmin,
        )
        filtered_users = invite_filter.queryset(None, self.test_queryset)
        self.assertEqual(list(filtered_users), [self.tester3])
