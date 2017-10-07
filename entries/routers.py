from rest_framework.routers import Route, SimpleRouter


class EntriesRouter(SimpleRouter):
    """
    A router for entries
    """

    routes = [
        Route(
            url=r'^{prefix}/$',
            mapping={'post': 'create'},
            name='{basename}-create',
            initkwargs={'suffix': 'Create'}
        ),
        Route(
            url=r'^{prefix}/(?P<username>[\w.@+-]+)/$',
            mapping={'get': 'list'},
            name='{basename}-list',
            initkwargs={'suffix': 'List'}
        ),
        Route(
            url=r'^{prefix}/(?P<username>[\w.@+-]+)/{lookup}/$',
            mapping={
                'get': 'retrieve',
                'patch': 'partial_update',
                'put': 'update',
            },
            name='{basename}-detail',
            initkwargs={'suffix': 'Detail'}
        ),
    ]
