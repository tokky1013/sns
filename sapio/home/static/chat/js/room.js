let $messagesContainer;
let $inputMessage;
let inputHeight;

let uploadedImage = '';
let room_type;
let room_id;
let last_pk = null;
let hasMessage = true;
let hasAllMessageLoaded = false;

// ルームの内容を読み込む
function displayRoom(type, id) {
    changePage('room', args={room_id: id, type: type});
    // ルームに参加する
    leaveChat();
    joinChat(type, id);
}
// ルームを読み込んだ後に最初に実行される初期化関数
function initializeChat(data, args) {
    // メッセージを追加する欄と入力欄を定義
    $messagesContainer = $('#messages');
    $inputMessage = $('#input_message');
    //$inputMessageのデフォルトの要素の高さを取得
    inputHeight = $inputMessage.get(0).clientHeight;
    
    // ルームの情報をセット
    uploadedImage = '';
    room_type = args.type;
    room_id = args.room_id;
    last_pk = null;
    hasMessage = true;
    hasAllMessageLoaded = false;

    // メッセージを表示する
    getMessages();

    // 入力欄の高さの調整をさせる
    // $inputMessageのinputイベント
    $inputMessage.on('input', ()=>{updateInputMessage();});

    // 上まで行ったらメッセージを読み込む
    $('#chat-container').scroll(function(){
        if(-$(this).scrollTop() + $(this).get(0).clientHeight > this.scrollHeight - 150) {
            getMessages();
        }
    });
}
// 画像をロードしてプレビューを表示する
function loadImage(obj) {
    let fileReader = new FileReader();
    fileReader.onload = (()=>{
        resize(fileReader.result, function(resizedImage) {
            uploadedImage = resizedImage;
            $('#preview').css('display', 'block');
            $('#preview').css('background', `url(${resizedImage}) no-repeat center/cover`);
            updateSpacerHeight();
            checkInput();
        });
    });
    fileReader.readAsDataURL(obj.files[0]);
}
// アップロードされた画像を消す
function deleteImage() {
    uploadedImage = '';
    $('#preview').css('display', 'none');
    updateSpacerHeight();
    checkInput();
    $('#image_upload').val(null);
}

// 入力がからかどうか判断して送信ボタンの色を変える
function checkInput() {
    // メッセージと画像の両方が空かどうかを調べる
    // 改行や空白のみの場合は空とする
    let isNotNull = $inputMessage.val().replace(/\n/g, '').replace(/\s+/g, '') || uploadedImage;

    $('#send-button').css(
        'color',
        isNotNull ? 'rgb(0, 145, 210)' : 'gray'
    );
    return isNotNull;
}
// チャットの一番下のスペーサーの高さをいい感じにする
function updateSpacerHeight() {
    $('#chat-spacer-bottom').css('margin-top', $('.input-field').get(0).clientHeight + 15 + 'px');
}
// 入力欄が変更されたときに高さや送信ボタンの色などをいい感じにしてくれる関数
function updateInputMessage() {
    //$inputMessageの要素の高さを設定（rows属性で行を指定するなら「px」ではなく「auto」で良いかも！）
    $inputMessage.css('height', inputHeight + 'px');
    //$inputMessageの入力内容の高さを取得
    let height = Math.max($inputMessage.get(0).scrollHeight, inputHeight);
    // 高さの最大値は300px
    height = Math.min(height, 300);
    //$inputMessageの高さに入力内容の高さを設定
    $inputMessage.css('height', height + 'px');
    
    updateSpacerHeight();
    checkInput();
}

// メッセージを読み込んで一番上に表示する
async function getMessages() {
    if(hasAllMessageLoaded) return;
    let url = fillURL(getMessagesURL, {type: room_type, room_id: room_id});
    url = addURLParameters(url, {last_pk: last_pk});

    const res = await fetch(url);
    const data = await res.json();

    if(data.length) {
        for(item of data) {
            let message = fillMessage(item);
            addMessageTop(message);
        }
        last_pk = data[data.length - 1].message_pk;
        return;
    }
    if(!last_pk) {
        $messagesContainer.html(
            `<div class="w-100 h-100 d-flex justify-content-center align-items-end">
                <p class="h4 mb-5">チャットを始めよう！</p>
            </div>`
        );
        hasMessage = false;
    }
    hasAllMessageLoaded = true;
}

// fillMessageで埋まったメッセージを一番上に追加
function addMessageTop(message) {
    // メッセージがなければ最初に画面をリセット
    if(!hasMessage) {
        $messagesContainer.html('');
        hasMessage = true;
    }

    $messagesContainer.prepend(message);
}
// fillMessageで埋まったメッセージを一番下に追加
function addMessageBottom(message) {
    // メッセージがなければ最初に画面をリセット
    if(!hasMessage) {
        $messagesContainer.html('');
        hasMessage = true;
    }

    $messagesContainer.append(message);
}
// myMessage(true/false)はメッセージが自分のかどうかを表す
function fillMessage(message) {
    let componentName;
    if(message.is_notification) {
        componentName = 'notification'
    }else{
        componentName = message.message.replace(/\n/g, '').replace(/\s+/g, '') ? 'msg_' : '';
        if(message.image) componentName += 'img_';
        componentName = message.user_id === userId ? componentName + 'right' : componentName + 'left';
    }
    // if('user_id' in message) message.profile_url = fillURL(profileURL, {uuid: message.user_id});
    return fillComponent(components[componentName], message);
}

// １ページ目に移動して内容を更新する
function gotoRoomListPage() {
    gotoPage1();

    // １ページ目の内容を更新
    displayList(pages[0], types[0], initialize=true);
    displayList(pages[0], types[1], initialize=true);
}

// typeとroomIdを指定してルームのページを表示する
// chatのページ以外から行く可能性がある場合に使う
function gotoRoomPage(type, roomId) {
    // すでにチャットのページにいるなら、そのままルームに入る
    if(pages[0] === 'chat') {
        displayRoom(type, roomId);
        return;
    }

    // チャットのページにいく
    let promise = function(){
        return new Promise(async (resolve ,reject)=>{
            await changePage('chat', args={typeNum: type == 'group' ? 0 : 1});
            resolve();
        });
    };
    
    // トークルームを表示する
    promise().then(()=>{
        // なぜか少し待たないとうまくいかなかったので待ってる
        setTimeout(
            ()=>{
                displayRoom(type, roomId);
            } , 120
        );
    });
}

// --------------------------参加やらなんやら---------------------------------
// 個別チャットを開始する。チャットがなければ作成する。
async function startIndividualChat(uuid) {
    // リクエストを送って、トークルームがなければ作ってもらう
    const url = fillURL(startIndividualChatURL, {uuid: uuid});
    // ルームidを含んだデータが返ってくる
    const res = await fetch(url);
    const data = await res.json();

    gotoRoomPage('individual', data.room_id);
}
// グループに参加する。
async function joinGroupChat(groupId) {
    const url = fillURL(joinGroupURL, {group_id: groupId});
    // ルームidを含んだデータが返ってくる
    await fetch(url);

    gotoRoomPage('group', groupId);
}
// グループを作成する。
async function createGroup() {

}
async function leaveGroup(groupId) {
    if(!confirm('グループから退出しますか？')) return;

    const url = fillURL(leaveGroupURL, {group_id: groupId});
    // ルームidを含んだデータが返ってくる
    await fetch(url);

    hidePage3();
    if(pageNum == 2 && pages[1] == 'room') gotoRoomListPage();
}


// -------------------------以下websocket関連----------------------------------
// WebSocketオブジェクト
const ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
let g_socket;

// websocketに接続してイベントを設定
function connect() {
    g_socket = new WebSocket(ws_scheme + "://" + window.location.host + "/ws/chat/");

    // WebSocketからメッセージ受信時の処理
    g_socket.onmessage = (event) => {
        // テキストデータをJSONデータにデコード
        const data = JSON.parse(event.data);

        // 自分のメッセージじゃなければ表示する
        if(data['user_id'] === userId) return;
        addMessageBottom(fillMessage(data));
        // リストに表示される最後のメッセージの内容を更新
        $(`#${room_type}${room_id} > div > small`).html(data.content);
    };

    // WebSocketクローズ時の処理
    g_socket.onclose = (event) => {
        // チャットのページ内でのウェブページを閉じたとき以外のWebSocketクローズは想定外
        if(pages[0] === 'chat') console.error("Unexpected : Chat socket closed.");
        else console.log("Chat socket closed.");
    };
}

// 送信ボタンを押したときの処理
function sendMessage() {
    // 入力が空ならreturn
    if(!checkInput()) return;

    const message = {
        'message': $inputMessage.val(),
        'image': uploadedImage,
        'created_at': getTime(),
    };

    // WebSocketを通したメッセージの送信
    g_socket.send(JSON.stringify(message));

    // メッセージを表示する
    message.user_id = userId;
    addMessageBottom(fillMessage(message));

    // 入力欄をリセット
    deleteImage();
    $inputMessage.val('');
    updateInputMessage();
}

function joinChat(type, id) {
    // サーバーに"join"を送信
    g_socket.send(JSON.stringify({
        "data_type": "join",
        "room_type": type,
        'room_id': id,
    }));
}
function leaveChat() {
    // サーバーに"leave"を送信
    g_socket.send(JSON.stringify({"data_type": "leave"}));
}

// 現在時刻を取得
function getTime() {
    const now = new Date();
    let hour = now.getHours();
    let min = now.getMinutes();
    if(min <= 9) min = '0' + min;
    return hour + ':' + min;
}
