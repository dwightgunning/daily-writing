from allauth.account.adapter import get_adapter
from django.contrib import messages
from django.contrib.admin import helpers
from django.contrib.admin.models import LogEntry, CHANGE
from django.contrib.admin.utils import model_ngettext
from django.contrib.auth.models import Group
from django.contrib.contenttypes.models import ContentType
from django.template.response import TemplateResponse
from django.utils.translation import gettext as _, gettext_lazy


def send_invite(modeladmin, request, queryset):
    # iterate the users and filter for state
    # Send the invite via the adaptor
    # update the users' groups
    opts = modeladmin.model._meta
    app_label = opts.app_label

    # Populate invitable_objects, a data structure of all related objects that
    # will also be deleted.
    inviteable_users = queryset.filter(groups__name__in=["Invite Requested", "Invited"])
    protected = queryset.filter(groups__name__in=["Invite Accepted"])

    # The user has already confirmed the deletion.
    # Do the deletion and return None to display the change list view again.
    if request.POST.get("post") and not protected:
        n = queryset.count()
        if n:
            for obj in queryset:
                obj_display = str(obj)
                get_adapter().send_invite_email(obj)
                obj.groups.remove(Group.objects.get(name="Invite Requested"))
                obj.groups.add(Group.objects.get(name="Invited"))
                LogEntry.objects.log_action(
                    user_id=request.user.pk,
                    content_type_id=ContentType.objects.get_for_model(obj).pk,
                    object_id=obj.pk,
                    object_repr=str(obj),
                    action_flag=CHANGE,
                    change_message="Sent invite to user",
                )
            modeladmin.message_user(
                request,
                _("Successfully invited %(count)d %(items)s.")
                % {"count": n, "items": model_ngettext(modeladmin.opts, n)},
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
