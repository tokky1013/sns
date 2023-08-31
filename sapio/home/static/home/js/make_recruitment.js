const $cropperPage = $('#cropper-page');
const groupInputSelectors = ['input[name="group_name"]', 'textarea[name="explanation"]'];
const individualInputSelectors = ['textarea[name="explanation"]'];
const padding = 15;

let resizedIcon = '';
let inputSelectors = groupInputSelectors;
let type = 'group';

function hasEmptyFields() {
    for(let input of inputSelectors) {
        if(!$(input).val()) return true;
    }
    return false;
}
function createRecruitment() {
    if(hasEmptyFields()) return;
    
    const fd = new FormData();
    fd.append('csrfmiddlewaretoken', $('input[name="csrfmiddlewaretoken"]').val());
    fd.append('type', type);
    for(let input of inputSelectors) {
        fd.append(input.split('"')[1], $(input).val());
    }
    if(type === 'group') fd.append('group_icon', resizedIcon);

    fetch(location.href, {
        method: 'POST',
        body: fd,
    })
    .then(response => response.json())
    .then(data => {
        if(data.form_is_valid){
            location.href = homeURL;
        }else{
            raiseError();
        }
    })
    .catch((error) => {
        raiseError();
    });
}
// 何らかの問題が発生したときに最初からやり直してもらうための関数
function raiseError() {
    alert('問題が発生しました。初めからやり直してください。');
    location.reload();
}

// ----------------------------ページ遷移の関数--------------------------------
// 次のページへ進む
function next() {
    $form = $('.page-container')
    $form.animate({
        left: '-100vw'
    }, { duration: 200, queue: false });
}
// 前のページに戻る
function previous() {
    $form = $('.page-container')
    $form.animate({
        left: '0vw'
    }, { duration: 200, queue: false });
}

// -----------------------cropper---------------------------
// cropperを開始
function startCropper(img) {

    // トリミングのページの縦幅と横幅の取得
    const ch = $cropperPage.innerHeight();
    const cw = $cropperPage.innerWidth();

    // 各種パラメーターの計算
    const scale = Math.min(cw / img.width, ch / img.height);    // img要素のサイズと実際の画像の画像のサイズの比
    const l = Math.min(cw, ch) / scale;                         // 最初に画像を表示するときの画像の縦幅と横幅のうち小さい方の長さ
    const d = (Math.min(cw, ch) - padding * 2) / scale;         // 円の直径
    const v = l / Math.min(img.width, img.height);              // 画像の拡大率（元の画像ではなくimg要素の拡大率）

    // 画像の属性を設定
    $trimedIcon = document.getElementById('triming-canvas');
    $trimedIcon.src = img.src;
    $trimedIcon.style.width = cw + 'px';
    $trimedIcon.style.height = ch + 'px';

    $('#completion').css('left', (cw + 0.95 * d * scale) / 2 - 50 + 'px');
    $('.to-home').css('display', 'none');

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
    next();
}
function trimIcon() {
    let base64 = cropper.getCroppedCanvas().toDataURL();
    endCropper();
    resize(base64, setIcon, maxWidth=250);
}
// cropperを終了
function endCropper() {
    previous()
    // cropperや入力欄をリセット
    $('#group-icon').val(null);
    cropper.destroy();
    $('#completion').css('left', '-50vw');
    $('.to-home').css('display', 'inline');
}
// #resized_iconのvalueにbase64形式のアイコン画像をセットする関数。
// #resized_iconのvalueを変えるときは必ずこの関数を使う
// ついでにプレビューの描画も行う
function setIcon(base64='') {
    // プレビューを描画
    if(base64) {
        $('#icon-preview').css('background', `url(${base64}) no-repeat center/contain`);
    }else{
        $('#icon-preview').css('background', `url(${base64}) no-repeat center/contain`);
        $('#icon-preview').css('background-color', 'white');
    }
    $('.plus-button').css('display', base64 ? 'none' : 'inline');
    $('.delete-button').css('display', base64 ? 'inline' : 'none');

    resizedIcon = base64;
}

// -----------------------イベント---------------------------
$(function() {
    $(inputSelectors.join(',')).on('keyup change', function() {
        $('#submit-button').css(
            'background-color', 
            hasEmptyFields() ? 'gray' : 'black',
        );
    });

    $('#group-icon').on('change', function() {
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

    $('.checkbox').on('click', function() {
        type = $(this).val();
        $('#group-input').css('display', type=='group' ? 'block' : 'none');
        inputSelectors = type=='group' ? groupInputSelectors : individualInputSelectors;
        $('#submit-button').val(type=='group' ? 'メンバーを募集' : '話し相手を募集');
        $('#submit-button').css(
            'background-color', 
            hasEmptyFields() ? 'gray' : 'black',
        );
    });
});