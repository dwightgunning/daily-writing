from unittest import TestCase, mock

from entries.permissions import IsEntryAuthor


class TestIsEntryAuthor(TestCase):
    """ Unit tests for IsEntryAuthor permissions
    """

    def setUp(self):
        self.permission = IsEntryAuthor()
        self.request = mock.Mock()
        self.view = mock.Mock()

    def test_has_permissions(self):
        test_username = "testauthor"
        self.request.user = mock.Mock(username=test_username)
        self.request.data = {"author": test_username}
        self.assertTrue(self.permission.has_permission(self.request, self.view))

    def test_has_permissions_user_not_author(self):
        test_username = "testauthor"
        self.request.user = mock.Mock(username=test_username)
        self.request.data = {"author": "anotheruser"}
        self.assertFalse(self.permission.has_permission(self.request, self.view))

    def test_has_object_permission(self):
        test_user = mock.Mock(username="testauthor")
        self.request.user = test_user
        entry = mock.Mock(author=test_user)
        self.assertTrue(
            self.permission.has_object_permission(self.request, self.view, entry)
        )

    def test_has_object_permission_user_not_author(self):
        test_user = mock.Mock(username="testauthor")
        another_user = mock.Mock(username="testauthor")
        self.request.user = mock.Mock(username=test_user)
        entry = mock.Mock(author=another_user)
        self.assertFalse(
            self.permission.has_object_permission(self.request, self.view, entry)
        )
