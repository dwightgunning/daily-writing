from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from users.admin.actions import send_invite
from users.models import DailyWritingProfile, User


class InviteFilter(admin.SimpleListFilter):
    title = _("Invites")
    parameter_name = "invite"

    def lookups(self, request, model_admin):
        return (
            ("requested", _("Requested")),
            ("invited", _("Invited")),
            ("accepted", _("Accepted")),
        )

    def queryset(self, request, queryset):
        if self.value() == "requested":
            return queryset.filter(groups__name__in=["Invite Requested"])
        if self.value() == "invited":
            return queryset.filter(groups__name__in=["Invited"])
        if self.value() == "accepted":
            return queryset.filter(groups__name__in=["Invite Accepted"])


@admin.register(User)
class DailyWritingUserAdmin(UserAdmin):
    invite_selected_confirmation_template = None
    actions = [send_invite]
    list_filter = (InviteFilter,)


@admin.register(DailyWritingProfile)
class DailyWritingProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "timezone")
