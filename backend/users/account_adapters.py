import logging

from allauth.account.adapter import DefaultAccountAdapter
from allauth.account.models import EmailAddress, EmailConfirmationHMAC
from allauth.account.utils import setup_user_email
from allauth.utils import email_address_exists
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core import mail
from django.urls import reverse

logger = logging.getLogger(__name__)


class DailyWritingAccountAdapter(DefaultAccountAdapter):
    """ Daily writing account adapter

    Adds invite capabilities to the standard AllAuth account adapter
    """

    def new_user_invite_request(self, request, form):
        """
        Returns a User model representing the user that requested an invite.
        Triggers appropriate emails to the user and/or admins.

        3x Groups relating to invites: Invite Requested, Invite Approved, Invite Accepted
        """
        data = form.cleaned_data
        email = self.clean_email(data["email"])
        if email_address_exists(email):
            # Retrieve the user and carry on
            user = get_user_model().objects.get(email=email)
        else:
            # Create the user
            user = self.new_user(request)
            self.save_user(request, user, form)
            user.groups.add(Group.objects.get(name="Invite Requested"))
            setup_user_email(request, user, [])

        # (Re-)Send emails to user and admin as appropriate
        if user.groups.filter(name="Invite Requested").exists():
            self.send_invite_request_received_email(user)
        elif user.is_active:
            # Ignore active accounts
            if user.groups.filter(name="Invited").exists():
                self.send_invite_email(user)
            else:
                self.send_account_username_email_address_reminder_email(user)
        return user

    def send_invite_request_received_email(self, user):
        try:
            mail.send_mail(
                from_email=settings.DEFAULT_FROM_EMAIL,
                message="Hi,\n\nWe've received your request for an invitation. We will review it shortly and be in contact by email with updates.\n\nRegards,\n\nTeam Daily Writing",
                recipient_list=[user.email],
                subject="[Daily Writing] Invitation request received",
            )
        except:
            logger.exception("Error sending user email")

        try:
            mail.mail_admins(
                message=f"Invite requested by {user.email}.",
                subject="[Daily Writing] Invite requested",
            )
        except:
            logger.exception("Error sending admin email")

    def get_invite_acceptance_url(self, email_confirmation):
        """Constructs the invite acceptance url."""
        return f"{settings.SITE_BASE_URL}/invite/{email_confirmation.key}/"

    def send_invite_email(self, user):
        email_address = EmailAddress.objects.get(user=user)
        confirmation_hmac = EmailConfirmationHMAC(email_address)
        invite_acceptance_url = self.get_invite_acceptance_url(confirmation_hmac)

        try:
            mail.send_mail(
                from_email=settings.DEFAULT_FROM_EMAIL,
                message=f"Hi,\n\nWe've approved your request for an invitation to Daily Writing.\n\n Please visit {invite_acceptance_url}.\n\nRegards,\n\nTeam Daily Writing",
                recipient_list=[email_address.email],
                subject="[Daily Writing] Your invitation to Daily Writing",
            )
        except:
            logger.exception("Error sending user email")

    def send_account_username_email_address_reminder_email(self, user):
        try:
            mail.send_mail(
                from_email=settings.DEFAULT_FROM_EMAIL,
                message=f"Hi,\n\nAs a quick reminder, your username is '{user.username}' and the primary email address associated with your account is '{user.email}'.\n\nRegards,\n\nTeam Daily Writing",
                recipient_list=[user.email],
                subject="[Daily Writing] Account reminder",
            )
        except:
            logger.exception("Error sending user email")
