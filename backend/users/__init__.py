from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    # Call REST framework's default exception handler first,
    # then put the default body under an 'errors' key in the data object
    response = exception_handler(exc, context)
    response.data = {"errors": response.data}
    return response
