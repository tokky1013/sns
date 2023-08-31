# Generated by Django 4.0.5 on 2022-07-19 08:49

import datetime
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('home', '0006_message_is_notification_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='groupchatrecruitment',
            name='created_at',
            field=models.DateTimeField(default=datetime.datetime(2022, 7, 19, 17, 49, 49, 55152)),
        ),
        migrations.AlterField(
            model_name='groupchatroom',
            name='host',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='my_room', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='individualchatrecruitment',
            name='created_at',
            field=models.DateTimeField(default=datetime.datetime(2022, 7, 19, 17, 49, 49, 54888)),
        ),
        migrations.AlterField(
            model_name='message',
            name='user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL),
        ),
    ]