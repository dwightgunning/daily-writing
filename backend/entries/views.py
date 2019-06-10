from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from api.permissions import IsOwnerByUsername
from entries.serializers import EntryDetailSerializer, EntryListSerializer
from entries.models import Entry
from entries.permissions import IsEntryAuthor


class EntryViewSet(viewsets.ModelViewSet):
    lookup_field = "entry_date"

    def get_permissions(self):
        if self.action == "create":
            permission_classes = [IsAuthenticated, IsEntryAuthor]
        elif self.action == "list":
            permission_classes = [IsAuthenticated, IsOwnerByUsername]
        else:
            permission_classes = [IsAuthenticated, IsOwnerByUsername, IsEntryAuthor]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.action == "list":
            return EntryListSerializer
        else:
            return EntryDetailSerializer

    def get_queryset(self):
        return Entry.objects.filter(author__username=self.kwargs["username"]).order_by(
            "-entry_date"
        )
