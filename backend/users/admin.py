from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import DailyWritingProfile, User


@admin.register(DailyWritingProfile)
class DailyWritingProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "timezone")


admin.site.register(User, UserAdmin)
