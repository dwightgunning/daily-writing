from django.contrib.auth import get_user_model
from django.contrib.auth.forms import PasswordResetForm

UserModel = get_user_model()


class DailyWritingPasswordResetForm(PasswordResetForm):
    """ PasswordResetForm extends Django's PasswordResetForm

    Overrides `get_users` to additionally filter out users that are not in the
    "Invite Accepted" group.
    """

    def get_users(self, email):
        """Given an email, return matching user(s) who should receive a reset.
        """
        active_users = UserModel._default_manager.filter(
            **{
                "%s__iexact" % UserModel.get_email_field_name(): email,
                "is_active": True,
                "groups__name__in": ["Invite Accepted"],
            }
        )
        return (u for u in active_users if u.has_usable_password())
