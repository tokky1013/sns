const $content = $("#content");
const $seondPage = $('#content2');
const $thirdPage = $('#third-page');
const $thirdPageContent = $('#content3');
const $checkbox = $("#menu-checkbox");
// ページ名を記憶しておくリスト。１ページ目と２ページ目をそれぞれ入れておく
let pages = ['', '', ''];
let previousArgs = ['', '', ''];
// 今1ページ目か2ページ目かを記憶する変数。
// 3ページ目を表示していても、その下が1ページ目か2ページ目かを記録する
// 3ページ目かどうかはisPage3関数で取得
let pageNum = 1;
let thirdPageHtmls = [];

// ページ遷移の関数
// function get(url) {
//     location.href = url;
// }
// pagenameで指定したページのhtmlを読み込む。pagenum=2で２ページ目を読み込んで2ページ目に移動することができる
async function changePage(pagename, args={}) {
    pagenum = getPagenum(pagename);
    // 全ての引数を一つの文字列に変換。
    // これをpreviousArgs[pagenum-1]と比べることで、前回読み込んだページと同じかどうか検証
    let strArgs = '';
    for(let key in args){
        strArgs += `${key}=${args[key]};`;
    }
    // pagenameとargsが今のページと同じだったときの処理
    // 3ページ目の場合は保持していたhtmlを表示したりするので、普通にリクエスト送る
    if(pages[pagenum-1] === pagename && previousArgs[pagenum-1] === strArgs && pagenum != 3){
        $checkbox.removeAttr("checked").prop("checked", false).change();    // メニューを閉じる
        if(pagenum === 1) gotoPage1();
        else gotoPage2();
        return;
    }
    previousArgs[pagenum-1] = strArgs;

    const data = await getPageData(pagename, args);

    // pagenum = 2ならば２ページ目にhtmlをセットしてreturn;
    if(pagenum === 2){
        gotoPage2(data.html, noAnimation=(pageNum == 2));
        initializePage2(pagename, data, args);
    }else if(pagenum == 1){
        gotoPage1(noAnimation=true)
        $content.html(data.html);
        $checkbox.removeAttr("checked").prop("checked", false).change();    // メニューを閉じる
        
        initializePage1(pagename, data, args);
        document.cookie = `last_view=${pagename};`;             // cookieに最後に見たページを保存
    }else {
        if(isPage3()) {
            thirdPageHtmls.push($thirdPageContent.html());
            $('#goback-page3').css('display', 'block');
        }
        showPage3(data.html);
        initializePage3(pagename, data);
    }
    pages[pagenum - 1] = pagename;
}

// 3ページ目に画像を表示する
function showImage(url) {
    if(isPage3()) {
        thirdPageHtmls.push($thirdPageContent.html());
        $('#goback-page3').css('display', 'block');
    }
    showPage3(`<img src="${url}" style="max-height: calc(100vh - 160px); max-width: calc(100vw - 60px);">`);
}

// pagenameから何ページ目かを取得する
function getPagenum(pagename) {
    switch(pagename) {
        case 'recruitment':
        case 'chat':
        case 'friend':
            return 1;
        case 'room':
        // case 'make_recruitment':
            return 2;
        case 'recruitment_detail':
        case 'profile':
        case 'room_detail':
            return 3;
        default:
            // pagenameに対応するページがなければエラーを出してリターン
            console.error('pagename "' + pagename + '" に対応するページは存在しません。');
            return;
    }
}
// ページの表示に必要なデータ(html, component等)を取得する関数
async function getPageData(pagename, args={}) {
    let url;
    // urlをpagenameに対応するurlにセット
    switch(pagename) {
        case 'recruitment':
            url = recruitmentURL;
            break;
        case 'chat':
            url = chatURL;
            break;
        case 'friend':
            url = friendURL;
            break;
        case 'room':
            url = fillURL(roomURL, {room_id: args.room_id, type: args.type});
            break;
        // case 'make_recruitment':
        //     url = fillURL(recruitmentCreationURL, {type: args.type});
        //     break;
        case 'recruitment_detail':
            url = fillURL(recruitmentDetailURL, {type: args.type, id: args.id});
            break;
        case 'profile':
            url = fillURL(profileURL, {uuid: args.uuid});
            break;
        case 'room_detail':
            url = fillURL(roomDetailURL, {id: args.room_id});
            break;
        default:
            // pagenameに対応するページがなければエラーを出してリターン
            console.error('pagename "' + pagename + '" に対応するページは存在しません。');
            return;
    }
    
    // 上で取得したurlにリクエストを送る。json形式でhtmlが帰ってくるはず
    const res = await fetch(url);
    const data = await res.json();
    return data;
}

// ------------------------初期化----------------------------
// ２, 3ページ目を読み込む時の初期化を振り分ける関数
function initializePage2(pagename, data, args={}) {
    switch(pagename) {
        case 'room':
            initializeChat(data, args);
            return;
        // case 'make_recruitment':
        //     return;
        default:
            // pagenameに対応するページがなければエラーを出してリターン
            console.error('2ページ目にpagename "' + pagename + '" に対応するページは存在しません。');
            return;
    }
}
function initializePage3(pagename, data, args={}) {
    $('#third-page-title').html(data.title);
    switch(pagename) {
        case 'recruitment_detail':
        case 'profile':
        case 'room_detail':
            return;
        default:
            // pagenameに対応するページがなければエラーを出してリターン
            console.error('3ページ目にpagename "' + pagename + '" に対応するページは存在しません。');
            return;
    }
}

// ------------------------ページ切り替えの処理----------------------------
// 2ページ目に行く関数。引数にhtmlを入れればhtmlを埋め込んだ上で移動する
function gotoPage2(html='', noAnimation=false) {
    hidePage3();
    if(noAnimation) {
        $seondPage.css('right', '0px');
    }else{
        $seondPage.animate({
            right: "0px"
        }, {duration: 200, queue: false});
    }
    if(html){
        $seondPage.html(html);
    }
    pageNum = 2;
}
// ２ページ目から戻ってくる
function gotoPage1(noAnimation=false) {
    hidePage3();
    if(noAnimation) {
        $seondPage.css('right', '-100vw');
    }else{
        $seondPage.animate({
            right: "-100vw"
        }, { duration: 200, queue: false });
    }
    pageNum = 1;
}
function showPage3(html='') {
    $('#page3-container').css('display', 'flex');
    if(html) $thirdPageContent.html(html);
}
function hidePage3() {
    $('#page3-container').css('display', 'none');
    thirdPageHtmls = [];
    $('#goback-page3').css('display', 'none');
}
function showPreviousPage3() {
    if(!thirdPageHtmls.length) return;
    $thirdPageContent.html(thirdPageHtmls.pop());
    if(!thirdPageHtmls.length) $('#goback-page3').css('display', 'none');
}
// 今３ページ目を表示しているかを取得する関数
function isPage3() {
    return $('#page3-container').css('display') != 'none';
}

// ------------------------文字の埋め込み----------------------------
// componentに色々埋め込む関数
function fillComponent(component, data) {
    for(let key in data) {
        component = component.split('${' + key + '}');
        component = component.join(data[key])
    }
    return component;
}
// urlにパラメーターを埋め込む
function fillURL(url, params) {
    for(key in params) {
        url = url.replace(`%3C${key}%3E`, params[key])
    }
    return url
}
// urlに?以降のパラメーターを入れる
function addURLParameters(url, params) {
    let strParams = '';
    for(key in params) {
        if(params[key]) {
            strParams += strParams ? `&` : '?';
            strParams += key + '=' + params[key]
        }
    }
    return url + strParams
}

// -----------------------色々---------------------------
// フレンド申請を送る。もしすでに相手から申請が来ていたらフレンドになる
async function sendFriendRequest(uuid) {
    const url =fillURL(sendFriendRequestURL, {uuid: uuid});
    await fetch(url);

    if(pages[0] === 'friend') {
        const friends = $('#friends-friend');
        const friendRequests = $('#friend-requests-friend');
        const request = $('#request-' + uuid);
    
        if(!hasItem['friend']['friends']) friends.html('');
        addItem('friend', 'friends', request.data());
        hasItem['friend']['friends'] = true;
        request.remove();
    
        if(!friendRequests.html()) {
            friendRequests.html(
                `<div class="w-100 d-flex justify-content-center align-items-center" style="height: calc(100vh - 250px);">
                    <p class="h5 text-center">
                    ${noItemMessages['friend']['friend-requests']}
                    </p>
                </div>`
            );
            hasItem['friend']['friends'] = false;
        }
    }
}
// フレンド申請を断る。もしすでにフレンドなら、フレンド解除する
async function rejectFriendRequest(uuid) {
    const url =fillURL(rejectFriendRequestURL, {uuid: uuid});
    await fetch(url);

    const friendRequests = $('#friend-requests-friend');
    const request = $('#request-' + uuid);
    
    request.remove();

    if(!friendRequests.html()) {
        friendRequests.html(
            `<div class="w-100 d-flex justify-content-center align-items-center" style="height: calc(100vh - 250px);">
                <p class="h5 text-center">
                ${noItemMessages['friend']['friend-requests']}
                </p>
            </div>`
        );
        hasItem['friend']['friends'] = false;
    }
}
async function deleteRecruitment(type, id) {
    if(!confirm('本当に削除しますか？')) return;
    
    const url =fillURL(deleteRecruitmentURL, {room_type: type, id: id});
    await fetch(url);

    hidePage3();
    displayList('recruitment', type, initialize=true);
}
// 使わんかも
async function blockUser(uuid) {

    hidePage3()
}

$(function () {
    // 最後に開いた画面を取得
    const cookies = document.cookie;
    const array = cookies.split(';');
    let lastView;

    for(let value of array){
        const content = value.split('=');
        if(content[0] === 'last_view') {
            lastView = content[1];
            break;
        }
    }
    if(!lastView) lastView = 'recruitment';
    
    // 最後に開いた画面を表示
    changePage(lastView);

    // ３ページ目をクリックした時のイベントを伝播しないようにする
    $thirdPage.on('click', function(e) {
        e.stopPropagation();
    });
});