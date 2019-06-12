from allauth.account.adapter import get_adapter
from allauth.account.models import EmailAddress
from django.contrib import messages
from django.contrib.admin import helpers
from django.contrib.admin.models import CHANGE, LogEntry
from django.contrib.admin.utils import model_ngettext
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.template.response import TemplateResponse
from django.utils.translation import gettext as _
from django.utils.translation import gettext_lazy


def send_invite(modeladmin, request, queryset):
    # iterate the users and filter for state
    # Send the invite via the adaptor
    # update the users' groups
    opts = modeladmin.model._meta
    app_label = opts.app_label

    # Populate invitable_objects, a data structure of all related objects that
    # will also be deleted.
    invitable_groups = ["Invite Requested", "Invited"]
    inviteable_users = queryset.filter(groups__name__in=invitable_groups)
    protected = queryset.exclude(groups__name__in=invitable_groups)

    # The user has already confirmed the deletion.
    # Do the deletion and return None to display the change list view again.
    if request.POST.get("post") and inviteable_users and not protected:
        inviteable_user_count = inviteable_users.count()
        for user in queryset:
            obj_display = str(user)
            get_adapter().send_invite_email(user)
            user.groups.remove(Group.objects.get(name="Invite Requested"))
            user.groups.add(Group.objects.get(name="Invited"))
            LogEntry.objects.log_action(
                user_id=request.user.pk,
                content_type_id=ContentType.objects.get_for_model(user).pk,
                object_id=user.pk,
                object_repr=str(user),
                action_flag=CHANGE,
                change_message="Sent invite to user",
            )
        modeladmin.message_user(
            request,
            _("Successfully invited %(count)d %(items)s.")
            % {
                "count": inviteable_user_count,
                "items": model_ngettext(modeladmin.opts, inviteable_user_count),
            },
            messages.SUCCESS,
        )
        # Return None to display the change list page again.
        return None

    objects_name = model_ngettext(queryset)

    if protected:
        title = _("Cannot invite %(name)s") % {"name": objects_name}
    else:
        title = _("Are you sure?")

    context = {
        **modeladmin.admin_site.each_context(request),
        "title": title,
        "objects_name": str(objects_name),
        "inviteable_users": [inviteable_users],
        "queryset": queryset,
        "protected": protected,
        "opts": opts,
        "action_checkbox_name": helpers.ACTION_CHECKBOX_NAME,
        "media": modeladmin.media,
    }

    request.current_app = modeladmin.admin_site.name

    # Display the confirmation page
    return TemplateResponse(
        request,
        modeladmin.invite_selected_confirmation_template
        or ["admin/invite_selected_confirmation.html"],
        context,
    )


send_invite.short_description = "Invite selected users"
