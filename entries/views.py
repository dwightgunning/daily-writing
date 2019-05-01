from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .serializers import EntryDetailSerializer, EntryListSerializer
from .models import Entry
from .permissions import IsAuthor


class EntryViewSet(viewsets.ModelViewSet):
    lookup_field = "entry_date"
    permission_classes = (IsAuthenticated, IsAuthor)

    def get_serializer_class(self):
        if self.action == "list":
            return EntryListSerializer
        else:
            return EntryDetailSerializer

    def get_queryset(self):
        return Entry.objects.filter(author__username=self.kwargs["username"]).order_by(
            "-entry_date"
        )
