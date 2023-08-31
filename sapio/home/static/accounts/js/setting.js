const $cropperPage = $('#cropper-container');
const titles = {
    'setting': '設定',
    'edit-profile': 'プロフィールの編集',
    'change-email': 'メールアドレスの変更',
    // 'blocked-users': 'ブロックしたユーザー',
};
const mediaQuery = matchMedia('(min-width: 800px)');
const padding = 15;

let displayedPageId = 'setting';

// 前のページを非表示にして指定のページにいく。pageId='setting'でメニュー一覧のページに戻る(スマホのみ)
function showPage(pageId) {
    if(displayedPageId === pageId) return;
    hide(displayedPageId);
    show(pageId);

    changeTitle(pageId);
    displayedPageId = pageId;
    document.cookie = `last_setting_view=${pageId};`;             // cookieに最後に見たページを保存

    $('#go-back-button').attr(
        'onclick',
        pageId === 'setting' || mediaQuery.matches ? 'location.href = homeURL;' : 'showPage("setting");',
    );
}
// 指定のページを表示する
function show(pageId) {
    if(pageId === 'setting') return;
    const $page = $('#' + pageId);

    if (mediaQuery.matches) {
        $page.css('display', 'block');
        $page.css('left', '300px');
    }else{
        $page.css('display', 'block');
        $page.animate({
            left: "0px"
        }, {duration: 200, queue: false});
    }
}
// 指定のページを非表示にする
function hide(pageId) {
    if(pageId === 'setting') return;
    const $page = $('#' + pageId);

    if (mediaQuery.matches) {
        $page.css('display', 'none');
    }else{
        $page.animate({
            left: "100vw"
        }, {duration: 200, queue: false});
    }
}
function changeTitle(pageId) {
    const $title = $('#title')
    $title.html(titles[pageId]);

    $title.css(
        'font-size',
        pageId=='setting' ? '35px' : '24px',
    );   
}

// -----------------------cropper---------------------------
// cropperを開始
function startCropper(img) {

    // トリミングのページの縦幅と横幅の取得
    const ch = $cropperPage.innerHeight();
    const cw = $cropperPage.innerWidth();
    console.log(ch, cw)

    // 各種パラメーターの計算
    const scale = Math.min(cw / img.width, ch / img.height);    // img要素のサイズと実際の画像の画像のサイズの比
    const l = Math.min(cw, ch) / scale;                         // 最初に画像を表示するときの画像の縦幅と横幅のうち小さい方の長さ
    const d = (Math.min(cw, ch) - padding * 2) / scale;         // 円の直径
    const v = l / Math.min(img.width, img.height);              // 画像の拡大率（元の画像ではなくimg要素の拡大率）

    // 画像の属性を設定
    const $trimedIcon = document.getElementById('triming-canvas');
    $trimedIcon.src = img.src;
    $trimedIcon.style.width = cw + 'px';
    $trimedIcon.style.height = ch + 'px';

    cropper = new Cropper($trimedIcon, {
        viewMode: 1,
        aspectRatio: 1,
        highlight: false,
        cropBoxMovable: false,
        dragMode: 'move',
        guides: false,
        cropBoxResizable: false,
        background: false,
        data: new Object({
            height: d,
            width: d,
            rotate: 0,
            scaleX: v,
            scaleY: v,
            x: (img.width * v - d) / 2,
            y: (img.height * v - d) / 2,
        })
    });
    $('#cropper-page').css('display', 'block');
}
function trimIcon() {
    let base64 = cropper.getCroppedCanvas().toDataURL();
    endCropper();
    resize(base64, setIcon, maxWidth=250);
}
// cropperを終了
function endCropper() {
    $('#cropper-page').css('display', 'none');
    // cropperや入力欄をリセット
    $('#profile-icon-input').val(null);
    cropper.destroy();
}
// #resized_iconのvalueにbase64形式のアイコン画像をセットする関数。
// #resized_iconのvalueを変えるときは必ずこの関数を使う
// ついでにプレビューの描画も行う
function setIcon(base64=null) {
    // プレビューを描画
    if(base64) {
        $('#uploaded-icon').attr('src', base64);
    }else{
        $('#uploaded-icon').attr('src', profileIconURL);
    }

    $('input[name="profile-icon"]').val() = base64;
}

$(function() {
    if(page) {
        // リクエストで最初に表示するページが指定されていたら、それを表示する。
        showPage(page);
    }else if(mediaQuery.matches) {
        // 表示するページが指定されていないかつ画面サイズがpcであれば、最後に開いた画面を開く
        const cookies = document.cookie;
        const array = cookies.split(';');
        let lastView;

        for(let value of array){
            const content = value.split('=');
            if(content[0] === 'last_setting_view') {
                lastView = content[1];
                break;
            }
        }
        if(lastView){
            // 最後に開いた画面を表示
            showPage(lastView);
        }
    }

    $('#profile-icon-input').on('change', function() {
        const file = $(this).prop("files")[0];
        if(typeof file === "undefined") return;

        let reader = new FileReader();
        reader.onload = function (e) {
            const base64 = e.target.result;
            let img = new Image();
            img.onload = function() {
                startCropper(img);
            }
            img.src = base64;
        }
        reader.readAsDataURL(file);
    });
});