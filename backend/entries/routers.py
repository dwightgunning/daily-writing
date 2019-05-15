from rest_framework.routers import Route, SimpleRouter


class EntriesRouter(SimpleRouter):
    """
    A router for entries
    """

    routes = [
        Route(
            detail=False,
            initkwargs={"suffix": "Create"},
            mapping={"post": "create"},
            name="{basename}-create",
            url=r"^{prefix}/$",
        ),
        Route(
            detail=False,
            initkwargs={"suffix": "List"},
            mapping={"get": "list"},
            name="{basename}-list",
            url=r"^{prefix}/(?P<username>[\w.@+-]+)/$",
        ),
        Route(
            detail=True,
            url=r"^{prefix}/(?P<username>[\w.@+-]+)/{lookup}/$",
            mapping={"get": "retrieve", "patch": "partial_update", "put": "update"},
            name="{basename}-detail",
            initkwargs={"suffix": "Detail"},
        ),
    ]
