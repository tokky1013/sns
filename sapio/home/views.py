from django.shortcuts import render, get_object_or_404
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.db.models import Q
from . import funcs
# from . import forms
import json
import re
from .models import (
    # Message,
    IndividualChatRoom,
    GroupChatRoom,
    IndividualChatRecruitment,
    GroupChatRecruitment,
)

# Create your views here.
# ------------------トップページ---------------------
def index_view(request):
    return render(request, 'home/index.html')

# ------------------ホーム画面---------------------
@login_required
def home_view(request):
    return render(request, 'home/home.html')

# ------------------1ページ目---------------------
@login_required
def recruitment_view(request):
    template_path = 'home/recruitment.html'
    html = funcs.render_html(template_path)
    component_path = 'home/components/component_reqruitment.html'
    components = {'recruitment': funcs.render_html(component_path)}

    params = {
        'html': html,
        'components': components,
    }
    json_str = json.dumps(params, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)

@login_required
def chat_view(request):
    template_path = 'home/chat.html'
    html = funcs.render_html(template_path)
    components = {
        'chat': funcs.render_html('home/components/component_chat.html'),
        'msg_left': funcs.render_html('chat/components/component_message_left.html', context={'msg': True, 'img': False}),
        'msg_right': funcs.render_html('chat/components/component_message_right.html', context={'msg': True, 'img': False}),
        'img_left': funcs.render_html('chat/components/component_message_left.html', context={'msg': False, 'img': True}),
        'img_right': funcs.render_html('chat/components/component_message_right.html', context={'msg': False, 'img': True}),
        'msg_img_left': funcs.render_html('chat/components/component_message_left.html', context={'msg': True, 'img': True}),
        'msg_img_right': funcs.render_html('chat/components/component_message_right.html', context={'msg': True, 'img': True}),
        'notification': funcs.render_html('chat/components/component_notification.html'),
    }

    params = {
        'html': html,
        'components': components,
    }
    json_str = json.dumps(params, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)

@login_required
def friend_view(request):
    template_path = 'home/friend.html'
    html = funcs.render_html(template_path)
    components = {
        'friends': funcs.render_html('home/components/component_friend.html'),
        'friend-requests': funcs.render_html('home/components/component_friend_request.html'),
    }

    params = {
        'html': html,
        'components': components,
    }
    json_str = json.dumps(params, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)

# ---------------1ページ目のリスト表示用---------------------
# グループの募集をjsonで返す
@login_required
def get_group_chat_recruitments(request):
    # last_pkが０なら最新のものから順にとる。そうでなければ前回とったものの次から取る
    recruitments = GroupChatRecruitment.objects

    # urlにキーワードがあれば絞り込む
    if 'keywords' in request.GET:
        keywords = re.split('[ 　]', request.GET['keywords'])
        for keyword in keywords:
            recruitments = recruitments.filter(Q(explanation__icontains=keyword) | Q(room__group_name__icontains=keyword))

    recruitments = funcs.filter_objects(request, recruitments)
    
    data = []
    for recruitment in recruitments:

        group = recruitment.room
        dict = {
            'id': recruitment.id,
            'icon': group.group_icon.url,
            'name': group.group_name,
            'created_at': funcs.get_time_difference(recruitment.created_at),
            'content': recruitment.explanation,
        }
        data.append(dict)
    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)

# 個別の募集をjsonで返す。中身はget_group_chat_recruitmentsとほぼ同じ
@login_required
def get_individual_chat_recruitments(request):
    recruitments = IndividualChatRecruitment.objects
    if 'keywords' in request.GET:
        keywords = re.split('[ 　]', request.GET['keywords'])
        for keyword in keywords:
            recruitments = recruitments.filter(Q(explanation__icontains=keyword) | Q(user__username__icontains=keyword))

    recruitments = funcs.filter_objects(request, recruitments)

    data = []
    for recruitment in recruitments:
        user = recruitment.user

        dict = {
            'id': recruitment.id,
            'icon': user.profile_icon.url,
            'name': user.username,
            'created_at': funcs.get_time_difference(recruitment.created_at),
            'content': recruitment.explanation,
        }
        data.append(dict)
    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)

@login_required
def get_group_chat_rooms(request):
    rooms = funcs.filter_objects(request, request.user.groupchatroom_set, order_by='-last_message_id')

    data = []
    for room in rooms:
        last_message = room.get_last_message()
        dict = {
            'id': room.id,
            'icon': room.group_icon.url,
            'name': room.group_name,
            'created_at': funcs.get_time_difference(last_message.created_at) if last_message is not None else '',
            'content': str(last_message) if last_message is not None else '',
        }
        data.append(dict)
    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)

@login_required
def get_individual_chat_rooms(request):
    rooms = funcs.filter_objects(request, request.user.individualchatroom_set, order_by='-last_message_id')

    data = []
    for room in rooms:
        user = room.users.first()
        if user.uuid == request.user.uuid:
            user = room.users.last()
        
        last_message = room.get_last_message()

        dict = {
            'id': room.id,
            'icon': user.profile_icon.url,
            'name': user.username,
            'created_at': funcs.get_time_difference(last_message.created_at) if last_message is not None else '',
            'content': str(last_message) if last_message is not None else '',
        }
        data.append(dict)
    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)

@login_required
def get_friends(request):
    friends = request.user.friends.all()
    data = []
    for friend in friends:
        dict = {
            'id': str(friend.uuid),
            'icon': friend.profile_icon.url,
            'name': friend.username,
            # 'created_at': '',
            'content': friend.self_introduction,
        }
        data.append(dict)
    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)

@login_required
def get_friend_requests(request):
    friends = request.user.friend_requests.all()
    data = []
    for friend in friends:
        dict = {
            'id': str(friend.uuid),
            'icon': friend.profile_icon.url,
            'name': friend.username,
            'created_at': '',
            'content': friend.self_introduction,
        }
        data.append(dict)
    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)

# ------------------2ページ目---------------------

# ------------------3ページ目---------------------
@login_required
def recruitment_detail_view(request, type, id):
    recruitment = get_object_or_404(
        GroupChatRecruitment if type=='group' else IndividualChatRecruitment,
        id=int(id)
    )
    template_path = 'home/recruitment_detail.html'

    # 参加ボタンの表示を切り替えるための変数
    if type == 'group':
        is_member = recruitment.room.users.filter(uuid=request.user.uuid).exists()
    else:
        is_member = True

    html = funcs.render_html(template_path, {
        'request': request,
        'recruitment': recruitment,
        'type': type,
        'is_member': is_member,
        'user_count': 0 if type=='individual' else recruitment.room.users.count(),
    })

    params = {
        'html': html,
        'title': '詳細'
    }
    json_str = json.dumps(params, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)

@login_required
def room_detail_view(request, id):
    room = get_object_or_404(GroupChatRoom, id=int(id))
    template_path = 'home/room_detail.html'
    html = funcs.render_html(template_path, {
        'request': request,
        'room': room,
        'user_count': room.users.count(),
    })

    params = {
        'html': html,
        'title': f'<img src="{room.group_icon.url}" class="icon-small me-2">詳細 　'
    }
    json_str = json.dumps(params, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)
# ------------------その他のページ---------------------
@login_required
def recruitment_creation_view(request):
    if request.method == 'GET':
        return render(request, 'home/make_recruitment.html')
    else:
        if request.POST.get('type') == 'group':
            group = GroupChatRoom.objects.create(
                group_name=request.POST.get('group_name'),
                host = request.user,
            )
            group.users.add(request.user)

            icon_base64 = request.POST.get('group_icon')
            if icon_base64:
                print(icon_base64[:20])
                filename = group.group_name
                pil_img = funcs.base64_to_pil(icon_base64)
                icon = funcs.pil_to_image_field(pil_img, filename)
                group.group_icon = icon
            group.save()
        
        if request.POST.get('type') == 'group':
            GroupChatRecruitment.objects.create(
                user=request.user,
                room=group,
                explanation=request.POST.get('explanation')
            )
        else:
            IndividualChatRecruitment.objects.create(
                user=request.user,
                explanation=request.POST.get('explanation')
            )
        res = {'form_is_valid': True}
    
    json_str = json.dumps(res, ensure_ascii=False, indent=2) 
    return HttpResponse(json_str)

@login_required
def delete_recruitment(request, room_type, id):
    recruitment_model = GroupChatRecruitment if room_type == 'group' else IndividualChatRecruitment
    recruitment = get_object_or_404(recruitment_model, id=int(id))

    if request.user.uuid != recruitment.user.uuid:
        raise PermissionDenied
    else:
        recruitment.delete()

        res = {'form_is_valid': True}
        json_str = json.dumps(res, ensure_ascii=False, indent=2)
        return HttpResponse(json_str)


# ------------------その他---------------------
@login_required
def create_prefectures(request):
    funcs.create_prefectures()
    return render(request, 'home/home.html')

def test(request):
    return render(request, 'home/home.html')
    