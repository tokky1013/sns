from django.shortcuts import render, get_object_or_404
from django.http import Http404
from django.http import HttpResponse
from django.contrib.auth import login
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.conf import settings
import json
from .models import Prefecture
from . import forms
from home import funcs

User = get_user_model()

# Create your views here.
def signup_view(request):
    context = {
        'prefectures': Prefecture.objects.all(),
        'login_redirect_url': reverse(settings.LOGIN_REDIRECT_URL)
    }
    return render(request, 'accounts/signup.html', context=context)

def profile_view(request, uuid):
    user = User.objects.get(uuid=uuid)
    is_friend = user.friends.filter(uuid=request.user.uuid).exists()

    template_path = 'accounts/profile.html'
    html = funcs.render_html(template_path, context={'user': user, 'is_friend': is_friend, 'request': request})

    params = {
        'html': html,
        'title': 'プロフィール',
    }
    json_str = json.dumps(params, ensure_ascii=False, indent=2)
    return HttpResponse(json_str)

def setting_view(request):
    if 'page' in request.GET:
        page = request.GET['page']
    else:
        page = ''
    return render(request, 'accounts/setting.html', context={'page': page})

@require_http_methods(['POST'])
def validate(request, page_num):
    if page_num == 0:
        form_class = forms.ValidationForm0
    elif page_num == 1:
        form_class = forms.ValidationForm1
    elif page_num == 2:
        form_class = forms.ValidationForm2
    else:
        raise Http404(f"Page{page_num} doe's not exist.")
    
    form = form_class(request.POST or None)
    if form.is_valid():
        res = {
            'form_is_valid': True,
        }
    else:
        res = {
            'form_is_valid': False,
            'errors': form.errors,
        }
    json_str = json.dumps(res, ensure_ascii=False, indent=2) 
    return HttpResponse(json_str)

@require_http_methods(['POST'])
def create_account(request):
    form_class = forms.CustomUserCreationForm
    form = form_class(request.POST or None)

    if form.is_valid():
        user = form.save()

        icon_base64 = request.POST.get('resized_icon')
        if icon_base64 != '':
            filename = user.username
            pil_img = funcs.base64_to_pil(icon_base64)
            icon = funcs.pil_to_image_field(pil_img, filename)
            user.profile_icon = icon
            user.save()

        login(request, user)
        res = {'form_is_valid': True}

    else:
        res = {
            'form_is_valid': False,
            'errors': form.errors,
        }
    
    json_str = json.dumps(res, ensure_ascii=False, indent=2) 
    return HttpResponse(json_str)

# フレンド申請を送る。もしすでに相手から申請が来ていたらフレンドになる
@login_required
def send_friend_request(request, uuid):
    friend = get_object_or_404(User, uuid=uuid)
    user = request.user

    # すでにフレンドになっているか、フレンド申請を送っていればリターン
    if friend.friend_requests.filter(uuid=user.uuid).exists() or friend.friends.filter(uuid=user.uuid).exists():
        res = {'success': True}
        json_str = json.dumps(res, ensure_ascii=False, indent=2) 
        return HttpResponse(json_str)

    if user.friend_requests.filter(uuid=friend.uuid).exists():
        user.friend_requests.remove(friend)
        user.friends.add(friend)
        user.save()
    else:
        friend.friend_requests.add(user)
        friend.save()
    
    res = {'success': True}
    json_str = json.dumps(res, ensure_ascii=False, indent=2) 
    return HttpResponse(json_str)

# フレンド申請を断る。もしすでにフレンドなら、フレンド解除する
@login_required
def reject_friend_request(request, uuid):
    friend = get_object_or_404(User, uuid=uuid)
    user = request.user

    if user.friend_requests.filter(uuid=friend.uuid).exists():
        user.friend_requests.remove(friend)
        user.save()
    elif user.friends.filter(uuid=friend.uuid).exists():
        user.friends.remove(friend)
        user.save()
    else:
        res = {'success': True}
        json_str = json.dumps(res, ensure_ascii=False, indent=2) 
        return HttpResponse(json_str)
    
    res = {'success': True}
    json_str = json.dumps(res, ensure_ascii=False, indent=2) 
    return HttpResponse(json_str)