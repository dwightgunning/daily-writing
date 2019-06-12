from rest_framework import permissions


class IsEntryAuthor(permissions.BasePermission):
    """
    Permissions based on Entry authorship
    """

    def has_permission(self, request, view):
        """
        Permissions to only allow users associated with a request access to entries they authored
        """
        if request.method in permissions.SAFE_METHODS:
            return True

        return request.user.username == request.data["author"]

    def has_object_permission(self, request, view, obj):
        """
        Object level permission to only allow users associated with a request to access entries they authored.
        """
        return request.user == obj.author
