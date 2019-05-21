from entries.routers import EntriesRouter
from entries.views import EntryViewSet

router = EntriesRouter()
router.register(prefix=r"entries", viewset=EntryViewSet, base_name="entries")

urlpatterns = router.urls
