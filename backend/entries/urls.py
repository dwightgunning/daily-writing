from entries.routers import EntriesRouter
from entries.views import EntryViewSet

router = EntriesRouter()
router.register(prefix=r"entries", viewset=EntryViewSet, basename="entries")

urlpatterns = router.urls
