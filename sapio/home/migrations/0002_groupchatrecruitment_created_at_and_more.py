# Generated by Django 4.0.5 on 2022-06-26 04:58

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('home', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='groupchatrecruitment',
            name='created_at',
            field=models.DateTimeField(default=datetime.datetime(2022, 6, 26, 13, 58, 27, 87462)),
        ),
        migrations.AddField(
            model_name='individualchatrecruitment',
            name='created_at',
            field=models.DateTimeField(default=datetime.datetime(2022, 6, 26, 13, 58, 27, 86746)),
        ),
        migrations.AlterField(
            model_name='groupchatrecruitment',
            name='active',
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name='individualchatrecruitment',
            name='active',
            field=models.BooleanField(default=True),
        ),
    ]