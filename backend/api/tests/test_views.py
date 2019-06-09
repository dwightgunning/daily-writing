import unittest

from api.views import empty_view


class ViewTests(unittest.TestCase):
    def test_empty_view(self):
        response = empty_view(None)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(len(response.content))
