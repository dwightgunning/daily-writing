from rest_framework import permissions


class IsAuthor(permissions.BasePermission):
    def has_permission(self, request, view):
        if view.action == "create":
            return request.data["author"] == request.user.username
        elif view.action in ["update", "update_partial"]:
            return (
                request.data["author"]
                == view.kwargs["username"]
                == request.user.username
            )
        else:
            return view.kwargs["username"] == request.user.username

    """
    Object-level permission to only allow the author to edit it.
    Assumes the model instance has an `author` attribute.
    """

    def has_object_permission(self, request, view, obj):
        return obj.author == request.user
