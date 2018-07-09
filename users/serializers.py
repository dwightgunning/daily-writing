import pytz

from django.db import transaction
from django.utils.translation import ugettext_lazy as _

from rest_framework import serializers

from users.models import DailyWritingProfile


class TimezoneField(serializers.Field):

    def to_representation(self, obj):
        return str(obj)

    def to_internal_value(self, data):
        try:
            return pytz.timezone(str(data))
        except pytz.exceptions.UnknownTimeZoneError:
            raise serializers.ValidationError(_('Unknown timezone'))


class DailyWritingProfileSerializer(serializers.ModelSerializer):
    timezone = TimezoneField()
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email')

    class Meta:
        model = DailyWritingProfile
        fields = ('first_name', 'last_name', 'email', 'timezone', 'target_milestone_word_count',)

    def update(self, instance, validated_data):
        user_updates = validated_data.pop('user', None)
        with transaction.atomic():
            if user_updates:
                for (key, value) in user_updates.items():
                    setattr(instance.user, key, value)
                instance.user.save()
            return super(DailyWritingProfileSerializer, self).update(instance, validated_data)
