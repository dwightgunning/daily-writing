from django.contrib.auth import get_user_model
from django.db import models

from timezone_field import TimeZoneField

from api.models import BaseModel


class Entry(BaseModel):
    author = models.ForeignKey(get_user_model())
    entry_date = models.DateField()
    entry_timezone = TimeZoneField()
    words = models.TextField(blank=True, null=True)
    word_count = models.IntegerField()
    start_time = models.DateTimeField(null=True, blank=True)
    finish_time = models.DateTimeField(null=True, blank=True)
    milestone_word_count = models.PositiveIntegerField()
    milestone_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ("author", "entry_date")
        verbose_name_plural = "entries"
