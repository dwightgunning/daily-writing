from unittest import TestCase

from api.exceptions import UnprocessibleError
from rest_framework import status


class TestUnprocessibleError(TestCase):
    """ Unit tests for UnprocessibleError custom APIException
    """

    def test_unprocessible_error_defaults(self):
        """ Unprocessible errors include a status of 422 with default info message and code
        """
        ue = UnprocessibleError()
        self.assertEqual(ue.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertEqual(str(ue.detail[0]), UnprocessibleError.default_detail)
        self.assertEqual(ue.detail[0].code, UnprocessibleError.default_code)

    def test_unprocessible_error_with_detail_code(self):
        """ Unprocessible errors accept custom error info message and code
        """
        error_info = "error info"
        error_code = "error_code"
        ue = UnprocessibleError(error_info, error_code)
        self.assertEqual(ue.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)
        self.assertEqual(str(ue.detail[0]), error_info)
        self.assertEqual(ue.detail[0].code, error_code)
