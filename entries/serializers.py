from datetime import datetime
import pytz
import re

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _

from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from entries.models import Entry
from users.serializers import TimezoneField

class EntryDetailSerializer(serializers.ModelSerializer):
    author = serializers.SlugRelatedField(
        slug_field='username', queryset=get_user_model().objects.all())
    entry_timezone = TimezoneField(required=False, read_only=True)

    class Meta:
        model = Entry
        fields = ('author',
                  'entry_date',
                  'entry_timezone',
                  'start_time',
                  'milestone_time',
                  'finish_time',
                  'milestone_word_count',
                  'words',
                  'word_count',
                  'created_date',
                  'modified_date')
        read_only_fields = ('word_count',
                            'milestone_word_count',
                            'start_time',
                            'finish_time',
                            'milestone_time',
                            'created_date',
                            'modified_date')
        extra_kwargs = {
            'milestone_word_count': {'required': False},
            'word_count': {'required': False}
        }
        validators = [
            UniqueTogetherValidator(
                queryset=Entry.objects.all(),
                fields=('author', 'entry_date')
            )
        ]

    def create(self, validated_data):
        author = validated_data['author']
        dw_profile = author.daily_writing_profile

        today = datetime.now(timezone.utc)
        if validated_data['entry_date'].strftime('%Y-%m-%d') != \
                today.strftime('%Y-%m-%d'):
            # TODO: Check best error text
            raise serializers.ValidationError(
                {'entry_date': _('Entry date must be today\'s date (UTC)')}
            )

        self.calculate_fields(validated_data, dw_profile)

        validated_data['start_time'] = validated_data['finish_time']
        validated_data['entry_timezone'] = dw_profile.timezone
        validated_data['milestone_word_count'] = \
            dw_profile.target_milestone_word_count

        return super(EntryDetailSerializer, self).create(validated_data)

    def update(self, instance, validated_data):
        author = validated_data['author']
        dw_profile = author.daily_writing_profile

        today = datetime.now(timezone.utc)
        if validated_data['entry_date'].strftime('%Y-%m-%d') != \
                today.strftime('%Y-%m-%d'):
            # TODO: Check best error text
            raise serializers.ValidationError(
                {'entry_date': _('Entry date must be today\'s date (UTC)')}
            )

        if validated_data['entry_date'] != instance.entry_date:
            # TODO: Check best error text
            raise serializers.ValidationError(
                {'entry_date': _('This field is read only')}
            )

        self.calculate_fields(validated_data, dw_profile, instance)

        return super(EntryDetailSerializer, self).update(
            instance, validated_data)

    def calculate_fields(self, validated_data, dw_profile, instance=None):
        word_count = len(re.findall(r'\w+', validated_data['words']))
        validated_data['word_count'] = word_count
        validated_data['finish_time'] = timezone.now()

        if word_count >= dw_profile.target_milestone_word_count:
            if not instance or (instance and not instance.milestone_time):
                validated_data['milestone_time'] = \
                    validated_data['finish_time']


class EntryListSerializer(serializers.ModelSerializer):
    author = serializers.SlugRelatedField(read_only=True,
                                          slug_field='username')
    entry_timezone = TimezoneField()

    class Meta:
        model = Entry
        fields = ('author',
                  'entry_date',
                  'entry_timezone',
                  'start_time',
                  'milestone_time')
