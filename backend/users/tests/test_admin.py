from django.contrib.admin import helpers
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core import mail
from django.template.response import TemplateResponse
from django.test import TestCase
from django.urls import reverse


class TestDailyWritingUserAdmin(TestCase):
    fixtures = ["dailywriting/fixtures/seed.json"]

    @classmethod
    def setUpTestData(cls):
        cls.superuser = get_user_model().objects.create_superuser(
            username="super", password="secret", email="super@example.com"
        )

    def setUp(self):
        self.client.force_login(self.superuser)

    def test_send_user_invite_select_invite_requested(self):
        """ Users in the Invite Requested group are emailed and moved to the Invited group
        """
        u1 = get_user_model().objects.create(
            email="tester1@tester.com", username="tester1"
        )
        u1.groups.add(Group.objects.get(name="Invite Requested"))
        u2 = get_user_model().objects.create(
            email="tester2@tester.com", username="tester2"
        )
        u2.groups.add(Group.objects.get(name="Invite Requested"))
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
        # self.assertContains(response, 'Are you sure you want to invite the selected', html=True)
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
        u1 = get_user_model().objects.create(
            email="tester1@tester.com", username="tester1"
        )
        u1.groups.add(Group.objects.get(name="Invited"))
        u2 = get_user_model().objects.create(
            email="tester2@tester.com", username="tester2"
        )
        u2.groups.add(Group.objects.get(name="Invite Accepted"))
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
