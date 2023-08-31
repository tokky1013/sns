import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.shortcuts import get_object_or_404
from django.core.exceptions import PermissionDenied

from home import funcs
from home.models import Message, GroupChatRoom, IndividualChatRoom

class ChatConsumer(AsyncWebsocketConsumer):
    # コンストラクタ
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.strGroupName = ''
        self.strUserId = ''

    async def connect(self):
        self.user = self.scope["user"]
        await self.accept()

    async def disconnect(self, close_code):
        await self.leave_chat()

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)

        # チャットへの参加時の処理
        if 'join' == text_data_json.get('data_type'):
            # 参加するルームをself.roomにセットする
            await self.set_room(text_data_json['room_type'], text_data_json['room_id'])
            # ルームに入っているユーザーなら参加させる
            if await self.user_is_member():
                # チャットへの参加
                await self.join_chat(text_data_json)
            else:
                self.room = None
                raise PermissionDenied

        # チャットからの離脱時の処理
        elif 'leave' == text_data_json.get('data_type'):
            # チャットからの離脱
            await self.leave_chat()

        # メッセージ受信時の処理
        else:
            if self.strUserId == '':
                return
            message_data = await self.save_message(text_data_json)
            data = {
                'type': 'chat_message',                 # 受信処理関数名
                'user_id': self.strUserId,
                'icon': self.user.profile_icon.url,
                'message': text_data_json['message'],
                'image': message_data['image_url'],
                'created_at': text_data_json['created_at'],
                'content': message_data['content'],     # 更新するリストのコンテントの内容
            }
            await self.channel_layer.group_send(self.strGroupName, data)

    # 拡散メッセージ受信時の処理
    # （self.channel_layer.group_send()の結果、グループ内の全コンシューマーにメッセージ拡散され、各コンシューマーは本関数で受信処理します）
    async def chat_message(self, data):
        data_json = {
            'user_id': data['user_id'],
            'icon': data['icon'],
            'message': data['message'],
            'image': data['image'],
            'created_at': data['created_at'],
            'content': data['content'],
        }

        # WebSocketにメッセージを送信します。
        # （送信されたメッセージは、ブラウザ側のJavaScript関数のsocketChat.onmessage()で受信処理されます）
        # JSONデータをテキストデータにエンコードして送ります。
        await self.send(text_data=json.dumps(data_json))

    # ユーザーがルームに参加しているかどうかをチェックする
    @database_sync_to_async
    def user_is_member(self):
        if self.user.is_staff:
            return True
        return self.room.users.filter(uuid=self.user.uuid).exists()
    
    # self.roomにルームをセットする
    @database_sync_to_async
    def set_room(self, room_type, room_id):
        self.room = get_object_or_404(
            GroupChatRoom if room_type=='group' else IndividualChatRoom,
            id=room_id
        )

    # チャットへの参加
    async def join_chat(self, data):
        # ユーザーid、room type、room id、ルーム名をクラスメンバー変数に設定
        self.strUserId = str(self.user.uuid)
        self.room_type = data['room_type']
        self.room_id = data['room_id']
        self.strGroupName = 'chat_' + self.room_type + self.room_id
        # グループに参加
        await self.channel_layer.group_add(self.strGroupName, self.channel_name)

    # チャットからの離脱
    async def leave_chat(self):
        if self.strGroupName == '':
            return

        # グループから離脱
        await self.channel_layer.group_discard(self.strGroupName, self.channel_name)

        # ルーム名を空に
        self.room_type = ''
        self.room_id = ''
        self.strGroupName = ''

    # messageを保存してついでに画像のURLとcontentとアイコンを返す
    @database_sync_to_async
    def save_message(self, message):
        if message['image']:
            pil_img = funcs.base64_to_pil(message['image'])
            filename = self.room_type + self.room_id
            image = funcs.pil_to_image_field(pil_img, filename)
        else:
            image = None

        new_message = Message.objects.create(
            user=self.user,
            content=message['message'],
            image=image,
            content_object=self.room,
        )

        self.room.last_message_id = new_message.pk
        self.room.save()

        if message['image']:
            image_url = new_message.image.url
        else:
            image_url = ''
        
        message_data = {
            'image_url': image_url,
            'content': str(new_message)
        }
        return message_data