from django.contrib import admin
from django.contrib.contenttypes.admin import GenericTabularInline
from .models import (
    IndividualChatRoom,
    GroupChatRoom,
    GroupChatRecruitment,
    IndividualChatRecruitment,
    Message,
)

# Register your models here.
class MessageInline(GenericTabularInline):
    model = Message

class IndividualChatRoomAdmin(admin.ModelAdmin):
    inlines = [MessageInline]

class GroupChatRoomAdmin(admin.ModelAdmin):
    inlines = [MessageInline]

admin.site.register(IndividualChatRoom, IndividualChatRoomAdmin)
admin.site.register(GroupChatRoom, GroupChatRoomAdmin)
admin.site.register(GroupChatRecruitment)
admin.site.register(IndividualChatRecruitment)
admin.site.register(Message)