from django.contrib import admin
from entries.models import Entry


@admin.register(Entry)
class EntryAdmin(admin.ModelAdmin):
    list_display = ("author", "entry_date")
    readonly_fields = ("word_count", "start_time", "finish_time", "milestone_time")
