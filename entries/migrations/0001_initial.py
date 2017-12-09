# -*- coding: utf-8 -*-
# Generated by Django 1.11.4 on 2017-08-24 20:18
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import timezone_field.fields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Entry',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_date', models.DateTimeField(auto_now_add=True)),
                ('modified_date', models.DateTimeField(auto_now=True)),
                ('entry_date', models.DateField()),
                ('entry_timezone', timezone_field.fields.TimeZoneField()),
                ('words', models.TextField(blank=True, null=True)),
                ('word_count', models.IntegerField()),
                ('start_time', models.DateTimeField(blank=True, null=True)),
                ('finish_time', models.DateTimeField(blank=True, null=True)),
                ('milestone_word_count', models.PositiveIntegerField()),
                ('milestone_time', models.DateTimeField(blank=True, null=True)),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name_plural': 'entries',
            },
        ),
        migrations.AlterUniqueTogether(
            name='entry',
            unique_together=set([('author', 'entry_date')]),
        ),
    ]
