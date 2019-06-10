from rest_framework import permissions


class IsOwnerByUsername(permissions.BasePermission):
    """
    Permissions based on resource ownership. Request User must match the View `username` kwarg
    """

    def has_permission(self, request, view):
        """
        Permissions to only allow owners of objects to access them
        """
        return view.kwargs["username"] == request.user.username

    def has_object_permission(self, request, view, obj):
        """
        Object-level permission to only allow owners of an object to access it.
        """
        return view.kwargs["username"] == request.user.username
