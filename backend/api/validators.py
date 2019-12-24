from api.exceptions import UnprocessibleError
from rest_framework.validators import qs_exists, UniqueTogetherValidator


class UniqueTogetherProcessableValidator(UniqueTogetherValidator):
    """
    Validator that corresponds to `unique_together = (...)` on a model class.

    Should be applied to the serializer class, not to an individual field.

    Identical to DRF UniqueTogetherValidator aside from raising UnprocessibleErrors instead of ValidationErrors
    """

    def __call__(self, attrs, serializer):
        self.enforce_required_fields(attrs, serializer)
        queryset = self.queryset
        queryset = self.filter_queryset(attrs, queryset, serializer)
        queryset = self.exclude_current_instance(attrs, queryset, serializer.instance)

        # Ignore validation if any field is None
        checked_values = [
            value for field, value in attrs.items() if field in self.fields
        ]
        if None not in checked_values and qs_exists(queryset):
            field_names = ", ".join(self.fields)
            message = self.message.format(field_names=field_names)
            raise UnprocessibleError(message, code="unique")
