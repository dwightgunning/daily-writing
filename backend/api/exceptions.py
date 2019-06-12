from django.utils.translation import ugettext_lazy as _
from rest_framework import exceptions, serializers, status


class UnprocessibleError(exceptions.APIException):
    """
    Unprocessible Error indicates a request was syntactically valid but cannot be
    processed for other reasons.

    Identical to DRF ValidationError aside from setting a status of 422 instead of 400.
    """

    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = _("Invalid input.")
    default_code = "invalid"

    def __init__(self, detail=None, code=None):
        """ Initialises the UnprocessibleError with default status, detail message and code
        """
        if detail is None:
            detail = self.default_detail
        if code is None:
            code = self.default_code

        # For validation failures, we may collect many errors together,
        # so the details should always be coerced to a list if not already.
        if not isinstance(detail, dict) and not isinstance(detail, list):
            detail = [detail]

        self.detail = exceptions._get_error_details(detail, code)
