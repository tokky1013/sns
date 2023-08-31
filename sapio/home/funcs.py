from django.template import loader
from django.utils import timezone
from dateutil import tz

import base64
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile
import io
# import re
# from accounts.forms import User
# from dateutil.relativedelta import relativedelta

from accounts.models import Area, Prefecture
# from .models import Message
from django.conf import settings

# htmlをレンダリングしてjson形式で返す関数
def render_html(html_path, context={}):
    template = loader.get_template(html_path)
    html = template.render(context)
    return html

def create_prefectures():
    if Prefecture.objects.exists():
        return
    areas = [
        {'area': '北海道', 'prefectures': '北海道'},
        {'area': '東北', 'prefectures': '青森県、岩手県、秋田県、宮城県、山形県、福島県'},
        {'area': '関東', 'prefectures': '茨城県、栃木県、群馬県、埼玉県、千葉県、東京都、神奈川県'},
        {'area': '中部', 'prefectures': '新潟県、富山県、石川県、福井県、山梨県、長野県、岐阜県、静岡県、愛知県'},
        {'area': '近畿', 'prefectures': '三重県、滋賀県、京都府、大阪府、兵庫県、奈良県、和歌山県'},
        {'area': '中国', 'prefectures': '鳥取県、島根県、岡山県、広島県、山口県'},
        {'area': '四国', 'prefectures': '徳島県、香川県、愛媛県、高知県'},
        {'area': '九州沖縄', 'prefectures': '福岡県、佐賀県、長崎県、熊本県、大分県、宮崎県、鹿児島県、沖縄県'},
        {'area': '海外', 'prefectures': '海外'},
    ]
    for area in areas:
        area_object = Area.objects.create(area_name=area['area'])
        area_object.save()
        prefectures = area['prefectures'].split('、')
        for prefecture_name in prefectures:
            prefecture_object = Prefecture.objects.create(prefecture_name=prefecture_name, area=area_object)
            prefecture_object.save()

# base64をpilに変換
def base64_to_pil(img_str):
    try:
        if "base64," in img_str:
            # DARA URI の場合、data:[<mediatype>][;base64], を除く
            img_str = img_str.split(",")[1]
        img_raw = base64.b64decode(img_str)
        img = Image.open(BytesIO(img_raw))
        return img.convert('RGB')
    except:
        print('pilに変換できなかったよ...')
        return None

# pil形式の画像をImageFieldに代入可能な形式に変換
def pil_to_image_field(pil_img, filename):
    img_io = io.BytesIO()
    pil_img.save(img_io, format='JPEG')
    return InMemoryUploadedFile(img_io, field_name=None, name=filename+".jpg", content_type='image/jpeg', size=img_io.tell, charset=None)

# userをgroupに参加させる
# def join_group(group, user):
#     group.users.add(user)
#     # 参加時のメッセージを作成
#     notification = Message.objects.create(content=user.username + 'さんが参加しました', is_notification=True, content_object=group)
#     notification.save()

# 文字列がmax_lengthより長い時に…をつける関数
# def shorten(text, max_length=35):
#     if len(text) > max_length:
#         text = text[:max_length] + '…'
#     return text

# timeが現在時刻からどれくらい前なのかを文字列で返す関数
# windowsだとゼロ埋めされてしまうらしい
# クラウドに上げたときにどのosで動くかによっては注意が必要
def get_time_difference(datetime):
    td = timezone.now() - datetime
    if td.days > 365:
        return datetime.strftime('%Y/%-m/%-d')
    elif td.days >= 100:
        return datetime.strftime('%-m/%-d')
    elif td.days > 0:
        return str(td.days) + '日前'
    elif td.seconds > 3600:
        return str(td.seconds // 3600) + '時間前'
    elif td.seconds > 60:
        return str(td.seconds // 60) + '分前'
    else:
        return str(int(td.seconds)) + '秒前'

# 1日以内なら時刻のみを、それ以上前なら日付と時刻を返す
# windowsだと「%-○」みたいな感じで-をつけてもゼロ埋めされてしまうらしい
# クラウドに上げたときにどのosで動くかによっては注意が必要
def get_datetime(datetime):
    jst = tz.gettz(settings.TIME_ZONE)
    td = timezone.now() - datetime
    if td.days > 0:
        return datetime.astimezone(jst).strftime('%-m/%-d %-H:%M')
    else:
        return datetime.astimezone(jst).strftime('%-H:%M')

def filter_objects(request, objects, max_num=30, order_by='-pk'):
    if 'last_pk' in request.GET:
        last_pk = request.GET['last_pk']
        objects = objects.filter(id__lt=last_pk).order_by(order_by)
    else:
        objects = objects.order_by(order_by)

    if len(objects) > max_num:
        objects = objects[:max_num]
    return objects
