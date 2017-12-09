from django.contrib.auth import get_user_model
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

from timezone_field import TimeZoneField


class DailyWritingProfile(models.Model):
    user = models.OneToOneField(get_user_model(),
                                related_name='daily_writing_profile',
                                on_delete=models.PROTECT)
    timezone = TimeZoneField(default='UTC')
    target_milestone_word_count = models.PositiveIntegerField(default=700)

@receiver(post_save, sender=get_user_model())
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        DailyWritingProfile.objects.create(user=instance)
    instance.daily_writing_profile.save()
