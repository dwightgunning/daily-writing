from django.contrib import admin
from .models import DailyWordsProfile


@admin.register(DailyWordsProfile)
class DailyWordsProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'timezone')
