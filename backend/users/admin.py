from django.contrib import admin
from .models import DailyWritingProfile


@admin.register(DailyWritingProfile)
class DailyWritingProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "timezone")
