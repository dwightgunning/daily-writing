from unittest import TestCase, mock

from api.permissions import IsOwnerByUsername


class TestIsOwnerByUsername(TestCase):
    """ Unit tests for IsOwnerByUsername permissions
    """

    def setUp(self):
        self.permission = IsOwnerByUsername()
        self.request = mock.Mock()
        self.view = mock.Mock()

    def test_has_permission(self):
        test_username = "testauthor"
        self.view.kwargs = {"username": test_username}
        self.request.user = mock.Mock(username=test_username)
        self.assertTrue(self.permission.has_permission(self.request, self.view))

    def test_has_object_permission_user_not_owner(self):
        test_username = "testauthor"
        self.view.kwargs = {"username": test_username}
        self.request.user = mock.Mock(username="anotheruser")
        self.assertFalse(self.permission.has_permission(self.request, self.view))

    def test_has_object_permission(self):
        test_username = "testauthor"
        self.view.kwargs = {"username": test_username}
        self.request.user = mock.Mock(username=test_username)
        obj = mock.Mock()
        self.assertTrue(
            self.permission.has_object_permission(self.request, self.view, obj)
        )

    def test_has_object_permission_user_not_owner(self):
        test_username = "testauthor"
        self.view.kwargs = {"username": test_username}
        self.request.user = mock.Mock(username="anotheruser")
        obj = mock.Mock()
        self.assertFalse(
            self.permission.has_object_permission(self.request, self.view, obj)
        )
