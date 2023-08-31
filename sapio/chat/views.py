# from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from home import funcs
import json
from home.models import Message, IndividualChatRoom, GroupChatRoom

User = get_user_model()

# Create your views here.
@login_required
def room_view(request, type, room_id):
    template_path = 'chat/room.html'

    room_id = int(room_id)
    if type == 'group':
        room = get_object_or_404(GroupChatRoom, id=room_id)
        room_name = room.group_name
        room_icon = room.group_icon
        user = None
    else:
        room = get_object_or_404(IndividualChatRoom, id=room_id)
        if room.users.first().uuid == request.user.uuid:
            user = room.users.last()
            room_name = user.username
            room_icon = user.profile_icon
        else:
            user = room.users.first()
            room_name = user.username
            room_icon = user.profile_icon

    # ルームに参加している人か管理者じゃないとアクセスできない
    if not (room.users.filter(uuid=request.user.uuid).exists() or request.user.is_staff):
        raise PermissionDenied

    context = {
        'user': user,
        'type': type,
        'room': room,
        'room_name': room_name,
        'room_icon': room_icon,
    }
    html = funcs.render_html(template_path, context=context)

    params = {
        'html': html,
    }
    json_str = json.dumps(params, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)

@login_required
def get_messages(request, type, room_id):
    max_num = 30

    room_id = int(room_id)
    if type == 'group':
        room = get_object_or_404(GroupChatRoom, id=room_id)
    else:
        room = get_object_or_404(IndividualChatRoom, id=room_id)

    # ルームに参加している人か管理者じゃないとアクセスできない
    if not (room.users.filter(uuid=request.user.uuid).exists() or request.user.is_staff):
        raise PermissionDenied
    
    if 'last_pk' in request.GET:
        last_pk = request.GET['last_pk']
        messages = room.messages.filter(id__lt=last_pk).order_by('-pk')
    else:
        messages = room.messages.order_by('-pk')
    if len(messages) > max_num:
        messages = messages[:max_num]

    data = []
    for message in messages:
        if message.is_notification:
            dict = {
                'is_notification': True,
                'message_pk': message.pk,
                'message': message.content,
            }
        else:
            image = '' if not message.image else message.image.url
                
            dict = {
                'is_notification': False,
                'user_id': str(message.user.uuid),
                'message_pk': message.pk,
                'icon': message.user.profile_icon.url,
                'message': message.content,
                'image': image,
                'created_at': funcs.get_datetime(message.created_at),
            }
        data.append(dict)
    
    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)

# 個別チャットを開始する。チャットがなければ作成する。ルームidを返す
@login_required
def create_individual_room(request, uuid):
    friend = get_object_or_404(User, uuid=uuid)
    rooms = IndividualChatRoom.objects.filter(users__in=[request.user]).filter(users__in=[friend])

    if rooms.exists():
        room = rooms.first()
    else:
        room = IndividualChatRoom.objects.create()
        room.users.add(request.user)
        room.users.add(friend)
        room.save()

    res = {'room_id': str(room.id)}
    json_str = json.dumps(res, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)

@login_required
def create_group(request):
    pass

@login_required
def join_group(request, group_id):
    group_id = int(group_id)
    group = get_object_or_404(GroupChatRoom, id=group_id)
    user = request.user

    if not group.users.filter(uuid=user.uuid).exists():
        group.users.add(user)
        # 参加時のメッセージを作成
        notification = Message.objects.create(
            content=user.username + 'さんが参加しました',
            is_notification=True,
            content_object=group,
        )
        # notification.save()

    res = {'success': True}
    json_str = json.dumps(res, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)

def leave_group(request, group_id):
    group = get_object_or_404(GroupChatRoom, id=int(group_id))
    if group.users.filter(uuid=request.user.uuid).exists():
        group.users.remove(request.user)
        if not group.users.exists():
            group.delete()
        else:
            group.save()
            Message.objects.create(
                content=request.user.username + 'さんが退出しました',
                is_notification=True,
                content_object=group,
            )
    
    res = {'success': True}
    json_str = json.dumps(res, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)