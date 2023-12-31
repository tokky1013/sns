# Generated by Django 4.0.5 on 2022-07-15 13:40

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_alter_user_self_introduction'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='friend_requests',
            field=models.ManyToManyField(blank=True, related_name='requested_by', to=settings.AUTH_USER_MODEL),
        ),
    ]
