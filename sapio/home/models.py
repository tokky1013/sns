from datetime import datetime
from django.db import models
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

# Create your models here.
class IndividualChatRoom(models.Model):
    users = models.ManyToManyField(User)
    last_message_id = models.IntegerField(default=-1)
    messages = GenericRelation('Message')

    class Meta:
        verbose_name_plural = '個別チャット'

    def __str__(self):
        return self.users.first().username + ' ' + self.users.last().username
    
    def get_last_message(self):
        if self.last_message_id == -1:
            return None
        else:
            return Message.objects.get(pk=self.last_message_id)

class GroupChatRoom(models.Model):
    group_name = models.CharField(max_length=20)
    group_icon = models.ImageField(upload_to='group_icons', default='default.PNG', null=True, blank=True)
    host = models.ForeignKey(User, on_delete=models.SET_NULL, related_name='my_room', null=True)
    users = models.ManyToManyField(User)
    last_message_id = models.IntegerField(default=-1)
    messages = GenericRelation('Message')

    class Meta:
        verbose_name_plural = 'グループチャット'

    def __str__(self):
        return self.group_name
    
    def get_last_message(self):
        if self.last_message_id == -1:
            return None
        else:
            return Message.objects.get(pk=self.last_message_id)

class IndividualChatRecruitment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    explanation = models.TextField(max_length=500)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=datetime.now())

    class Meta:
        verbose_name_plural = '個別チャット募集'

    def __str__(self):
        return self.user.username

class GroupChatRecruitment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    room = models.OneToOneField(GroupChatRoom, on_delete=models.CASCADE)
    explanation = models.TextField(max_length=500)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=datetime.now())

    class Meta:
        verbose_name_plural = 'グループチャット募集'

    def __str__(self):
        return str(self.room)

# class RoomMessages(models.Model):
#     group_chat_room = models.OneToOneField(GroupChatRoom, on_delete=models.CASCADE, null=True)
#     indivisual_chat_room = models.OneToOneField(IndividualChatRoom, on_delete=models.CASCADE, null=True)
#     group = models.BooleanField()

class Message(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    content = models.TextField(null=True, blank=True)
    image = models.ImageField(upload_to='message_images', null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    is_notification = models.BooleanField(default=False)

    # room = models.ForeignKey(RoomMessages, on_delete=models.CASCADE, related_name='messages', null=True)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        verbose_name_plural = 'メッセージ'

    def __str__(self):
        content = self.content
        if not content:
            content = self.user.username + 'さんが画像を送信しました。'
        return content