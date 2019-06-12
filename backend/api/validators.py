from api.exceptions import UnprocessibleError
from rest_framework import validators
from rest_framework.serializers import ValidationError


class UniqueTogetherProcessableValidator(validators.UniqueTogetherValidator):
    """
    Validator that corresponds to `unique_together = (...)` on a model class.

    Should be applied to the serializer class, not to an individual field.

    Identical to DRF UniqueTogetherValidator aside from raising UnprocessibleErrors instead of ValidationErrors
    """

    def __call__(self, attrs):
        self.enforce_required_fields(attrs)
        queryset = self.queryset
        queryset = self.filter_queryset(attrs, queryset)
        queryset = self.exclude_current_instance(attrs, queryset)

        # Ignore validation if any field is None
        checked_values = [
            value for field, value in attrs.items() if field in self.fields
        ]
        if None not in checked_values and validators.qs_exists(queryset):
            field_names = ", ".join(self.fields)
            message = self.message.format(field_names=field_names)
            raise UnprocessibleError(message, code="unique")
