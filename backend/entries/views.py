from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from api.permissions import IsOwnerByUsername
from entries.serializers import EntrySerializer
from entries.models import Entry
from entries.permissions import IsEntryAuthor


class EntryViewSet(viewsets.ModelViewSet):
    lookup_field = "entry_date"
    serializer_class = EntrySerializer

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions to be applied.

        - Create action: requesting user is the entry author.
        - List action: requesting user is the resource owner (e.g.author)
        - Other actions: all the above
        """
        if self.action == "create":
            permission_classes = [IsAuthenticated, IsEntryAuthor]
        elif self.action == "list":
            permission_classes = [IsAuthenticated, IsOwnerByUsername]
        else:
            permission_classes = [IsAuthenticated, IsOwnerByUsername, IsEntryAuthor]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        The queryset that should be used for returning objects from this view.

        Entries may be retrieved for the resource owner (e.g. author) identified in the URL
        """
        return Entry.objects.filter(author__username=self.kwargs["username"]).order_by(
            "-entry_date"
        )
