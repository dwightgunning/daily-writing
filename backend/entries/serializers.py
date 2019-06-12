import re
from datetime import datetime

from api.exceptions import UnprocessibleError
from api.validators import UniqueTogetherProcessableValidator
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _
from entries.models import Entry
from rest_framework import serializers
from users.serializers import TimezoneField


class EntrySerializer(serializers.ModelSerializer):
    """ Serializer for the Entry model

    Incorporates validation rules to ensure:
    - users may only author only one entry per day, according to the user profile timezone at time creation time
    - start time and milestone word count is taken from the user's profile upon creation
    - milestone time is set only once when the milestone word count is first achieved
    """

    author = serializers.SlugRelatedField(
        slug_field="username", queryset=get_user_model().objects.all()
    )
    entry_timezone = TimezoneField(required=False, read_only=True)

    class Meta:
        model = Entry
        fields = (
            "author",
            "entry_date",
            "entry_timezone",
            "start_time",
            "milestone_time",
            "finish_time",
            "milestone_word_count",
            "words",
            "word_count",
            "created_date",
            "modified_date",
        )
        extra_kwargs = {
            "finish_time": {"read_only": True},
            "milestone_time": {"read_only": True},
            "created_date": {"read_only": True},
            "modified_date": {"read_only": True},
            "milestone_word_count": {"read_only": True},
            "word_count": {"read_only": True},
        }
        validators = [
            UniqueTogetherProcessableValidator(
                queryset=Entry.objects.all(), fields=("author", "entry_date")
            )
        ]

    def create(self, validated_data):
        """ Prepare a new Entry based on validated data
        """
        author = validated_data["author"]
        author_profile = author.daily_writing_profile

        validated_data["entry_timezone"] = author_profile.timezone
        validated_data[
            "milestone_word_count"
        ] = author_profile.target_milestone_word_count
        self._verify_entry_for_today(validated_data["entry_date"])
        self._calculate_fields(
            validated_data, author_profile.target_milestone_word_count
        )

        return super(EntrySerializer, self).create(validated_data)

    def update(self, instance, validated_data):
        """ Prepare an update Entry based on validated data
        """
        # if "milestone_word_count" in validated_data:
        #     raise UnprocessibleError(
        #         {"milestone_word_count": _("Milestone word count may not be modified")}
        #     )
        if validated_data.get("start_time", None) != instance.start_time:
            raise UnprocessibleError(
                {"start_time": _("Start time may not be modified")}
            )

        self._verify_entry_for_today(validated_data["entry_date"], instance)
        self._calculate_fields(validated_data, instance.milestone_word_count)

        return super(EntrySerializer, self).update(instance, validated_data)

    def _verify_entry_for_today(self, entry_date, instance=None):
        if instance and instance.entry_date != entry_date:
            raise UnprocessibleError(
                {"entry_date": _("Entry Date may not be modified")}
            )
        entry_date_formated = entry_date.strftime("%Y-%m-%d")
        date_today_formated = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        if entry_date_formated != date_today_formated:
            raise UnprocessibleError(
                {"entry_date": _("Entry date must be today's date (UTC)")}
            )

    def _calculate_fields(self, validated_data, milestone_word_count):
        word_count = len(re.findall(r"\w+", validated_data["words"]))
        validated_data["word_count"] = word_count
        validated_data["finish_time"] = timezone.now()

        if word_count > milestone_word_count:
            validated_data["milestone_time"] = validated_data["finish_time"]
