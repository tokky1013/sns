let lastIds = {};
let components = {};
let types;
let selectedTab = '';
let previousKeywords = ''
// それぞれのページにアイテムがあるかどうかを記憶する
let hasItem = {
    recruitment: {'group': true, 'individual': true},
    chat: {'group': true, 'individual': true},
    friend: {'friends': true, 'friend-requests': true},
};
// それぞれのページにあるタブの名前
const pageTypes = {
    recruitment: ['group', 'individual'],
    chat: ['group', 'individual'],
    friend: ['friends', 'friend-requests'],
};
// それぞれのページのタイトル
const titles = {
    recruitment: 'タイムライン',
    chat: 'チャット',
    friend: 'フレンド',
};
// それぞれのページのオブジェクトがなかった場合のメッセージ
const noItemMessages = {
    recruitment: {'group': 'タイムラインはありません', 'individual': 'タイムラインはありません'},
    chat: {
        'group': `参加中のグループはありません<br><br><label onclick="changePage('recruitment');" class="text-primary">参加したいグループを見つけましょう！</label>`,
        'individual': `チャットはありません<br><br><label onclick="changePage('recruitment', {typeNum: 1})" class="text-primary">話し相手を見つけましょう！</label>`
    },
    friend: {'friends': 'フレンドはいません', 'friend-requests': 'フレンド申請はありません'},
};
// それぞれのページのオブジェクトがなかった場合のメッセージ
const noItemMessagesWithKeyword = {
    recruitment: {'group': '該当するタイムラインはありません', 'individual': '該当するタイムラインはありません'},
    chat: {'group': '', 'individual': ''},
    friend: {'friends': '', 'friend-requests': ''},
};


// 初期化関数。募集のページを開いた直後と募集の再読み込み時に使う
function initializePage1(pagename, data, args={}) {
    // そのページにあるtypeをtypesに代入
    types = pageTypes[pagename];
    changeTitle(pagename);

    for(let key in data.components) {
        components[key] = data.components[key]
    }
    displayList(pagename, types[0], initialize=true);
    displayList(pagename, types[1], initialize=true);

    // typeNumが1なら、最初から右のページを表示させる
    if(args.typeNum) select(args.typeNum);
    else selectedTab = types[0];

    // チャットのページならwebsocketに接続、チャットでなければclose
    if(pagename === 'chat') {
        connect();
    }else if(g_socket != null) {
        g_socket.close();
    }

    $('#search-box').keypress(function(e) {
        if (e.keyCode == 13) {
            displayList(pages[0], selectedTab, initialize=true, keywords=$('#search-box').val());
            return false;
        }
    });
}
// ページ名を上に表示して、メニューで表示中のページのところに三角を表示
function changeTitle(pagename) {
    // 上のタイトルを変更
    $('#title').html(titles[pagename]);
    // 左のメニューの三角形を移動
    $('#selection-' + pagename).css('display', 'inline');
    if(pages[0]) {$('#selection-' + pages[0]).css('display', 'none');}
}
// itemを一つDOMに追加する
function addItem(pagename, type, item) {
    item.type = type;
    const filledComponent = fillComponent(
        pagename === 'friend' ? components[type] : components[pagename],
        item,
    );
    $(`#${type}-${pagename}`).append(filledComponent);
}
// apiを叩いてtypeで指定した募集を取ってきて全部表示する。initialize=trueで初期化した上で表示
async function displayList(pagename, type, initialize=false, keywords='') {
    if(initialize) {
        $(`#${type}-${pagename}`).html('')         // 募集欄のhtmlを空にする
        // 一番最後の募集のidをnullに設定
        lastIds[type] = null;
    }

    // 募集を取得
    const itemList = await getList(pagename, type, keywords);
    // 募集がなかった場合
    if(itemList.length === 0) {
        if(lastIds[type] === null) {
            $(`#${type}-${pagename}`).html(
                `<div class="w-100 d-flex justify-content-center align-items-center" style="height: calc(100vh - 250px);">
                    <p class="h5 text-center">
                    ${keywords ? noItemMessagesWithKeyword[pagename][type] : noItemMessages[pagename][type]}
                    </p>
                </div>`
            );
            hasItem[pagename][type] = false;
        }
        return;
    }

    // 表示
    for(let item of itemList) {
        addItem(pagename, type, item);
    }
    lastIds[type] = itemList[itemList.length - 1].id;
}
// apiを叩いてtypeで指定した募集を取ってくる関数
async function getList(pagename, type, keywords) {
    // urlの設定
    const url = addURLParameters(pageURLs[pagename][type], {
        last_pk: lastIds[type],
        keywords: keywords,
    });
    previousKeywords = keywords;

    const res = await fetch(url);
    const data = await res.json();
    return data;
}

// グループか個別かを選択したときの処理
function select(num) {
    selectedTab = types[num]
    // 選択されたタブと表示するページを変える
    if(selectedTab === types[0]){
        $(`#${types[0]}-tab`).addClass("selected-tab");
        $(`#${types[1]}-tab`).removeClass("selected-tab");
        $(`#${types[0]}`).css('display', 'block');
        $(`#${types[1]}`).css('display', 'none');
    }else{
        $(`#${types[0]}-tab`).removeClass("selected-tab");
        $(`#${types[1]}-tab`).addClass("selected-tab");
        $(`#${types[0]}`).css('display', 'none');
        $(`#${types[1]}`).css('display', 'block');
    }
    // 検索欄のリセット
    deleteKeywords();
}

// 検索欄をリセットする関数
function deleteKeywords() {
    // 検索条件なしで表示しなおす
    if(previousKeywords) displayList(pages[0], selectedTab, initialize=true);
    // 検索欄をリセット
    $('#search-box').val('');
    $('#delete').css('display', 'none');
    $('#search-button').css('color', 'gray');
}

$(function() {
    // 検索欄に文字が入っているかどうかで表示を変える
    $(document).on('keyup', '#search-box', function() {
        if($(this).val()){
            $('#delete').css('display', 'flex')
            $('#search-button').css('color', 'rgb(0, 145, 210)')
        }else{
            $('#delete').css('display', 'none')
            $('#search-button').css('color', 'gray')
        }
    });
});