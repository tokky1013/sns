const totalPageNum = 5;
const iconPage = 3;     //アイコンの入力欄があるページ番号
const submitPage = 4;   //submitボタンがあるページ番号

const emailAuthentication = false;

const padding = 15;
const $cropperPage = $('#triming-page');

const $userBirthdayYear = $('#birthday-year');
const $userBirthdayMonth = $('#birthday-month');
const $userBirthdayDay = $('#birthday-day');
const yearNow = new Date().getFullYear()

let page = 0;

// 最終的に送信される入力欄のidをページごとに入れたもの
const submitedInputs = [
    ['email'],
    ['password1', 'password2'],
    ['username'],
    ['resized_icon'],
    ['area_of_residence', 'date_of_birth', 'gender', 'self_introduction'],
];
// submitedInputsのうち入力必須のもの。
const requiredInputs = [
    ['email'],
    ['password1', 'password2'],
    ['username'],
    [],
    ['area_of_residence', 'date_of_birth', 'gender'],
];
// submitedInputsのうち、別でイベント監視するものを除いたもの。
// これらはリストに入れてまとめてイベントを監視する。
// データに何らかの加工が必要な入力欄（アイコンなど）はややこしいのでここに入れずに、イベント発火時にそれぞれ別の関数を実行する。
const observedInputs = [
    ['email'],
    ['password1', 'password2'],
    ['username'],
    [],
    [],
];

// ----------------------------ページ遷移の関数--------------------------------
// 次のページへ進む
function next() {
    gotoPage(page + 1);
}
// 前のページに戻る
function previous() {
    gotoPage(page - 1);
}
// numで指定したページにいく。next()とprevious()の中で呼び出してる。
function gotoPage(pageNum) {
    if(pageNum === 0){
        $('#go-back-button').css('display', 'none');
    }else{
        $('#go-back-button').css('display', 'block');
    }
    if(pageNum < 0 || pageNum >= totalPageNum) return;
    const $form = $('#form-container');
    // const position = - pageNum * 100;
    const position = `min(-${310 * pageNum}px, -${100 * pageNum}vw)`;
    $form.animate({
        left: `-${100 * pageNum}vw`
    }, { duration: 200, queue: false });
    setTimeout(function(){
        $form.css('left', position);
    },300);

    for(let i = 0; i < totalPageNum; i++){
        $('#page'+i).css('background-color', i === pageNum ? 'gray' : 'white');
    }
    page = pageNum;
}

// ----------------------------入力内容が正しいかの確認に関する関数--------------------------------
// 指定したページのエラーメッセージを全て消す
function deleteError(pageNum) {
    for(let inputID of submitedInputs[pageNum]) {
        $('#error-' + inputID).html('');
    }
}
// そのページに空の入力必須項目があるかどうかを見る関数。throwErrors=trueでエラーメッセージを画面に表示する
function hasEmptyFields(pageNum, throwErrors=false) {
    let hasEmptyFields = false;
    for(let inputID of requiredInputs[pageNum]) {
        if(!$('#' + inputID).val()) {
            hasEmptyFields = true;
            if(throwErrors) {
                $('#error-' + inputID).html('この項目は必須です。');
            }
        }
    }
    return hasEmptyFields;
}
// 1~4ページ目の入力内容を確認する関数
function validate(pageNum) {
    deleteError(pageNum);
    if(hasEmptyFields(pageNum, throwErrors=true)) return;
    // アイコンのページなら空白でなければ次のページへ
    if(pageNum === iconPage) {
        // $cropperPage.css('display', 'none');
        next();
        return;
    }

    const fd = new FormData();
    fd.append('csrfmiddlewaretoken', $('input[name="csrfmiddlewaretoken"]').val());
    fd.append('page_num', pageNum);
    fd.append('password1', 'dummy1234');
    fd.append('password2', 'dummy1234');
    for(let inputID of submitedInputs[pageNum]) {
        fd.append(inputID, $('#' + inputID).val());
    }
    fetch(validationURLs[pageNum], {
        method: 'POST',
        body: fd,
    })
    .then(response => response.json())
    .then(data => {
        if(data.form_is_valid){
            next();
            // submitボタンの下のメッセージを書く
            if(emailAuthentication) {
                const email = $('#email').val();
                if(email) {
                    const btnName = $('#submit-button-' + submitPage).val();
                    $('#message-about-email').html(`「${btnName}」ボタンを押すと、${email}に本登録用のリンクが送信されます。`);
                }
            }
        }else{
            displayErrors(data.errors, pageNum);
        }
    })
    .catch((error) => {
        raiseError(error);
    });
}
// サーバーからエラーが返ってきた場合にそれを表示する関数
function displayErrors(errors, pageNum) {
    for(let key in errors) {
        if($('#error-'+key)){
            $('#error-'+key).html(errors[key]);
        }
        if(!submitedInputs[pageNum].includes(key)) {
            raiseError(`page${pageNum} にidが ${key} のinputタグは存在しません。`);
        }
    }
}

// ----------------------------アイコンのトリミング関連--------------------------------
// cropperを開始
function startCropper(img) {
    $cropperPage.css('display', 'block');               // トリミングのページを表示   
    $('#go-back').attr('onclick', "endCropper();");      // 戻るボタンを押したときにキャンバスやinputをリセットするようにする
    $('.go-back').css('color', 'white');                // 戻るボタンがグレーだと見にくい時があるので、白にする
    $('footer').css('display', 'none');

    // トリミングのページの縦幅と横幅の取得
    const ch = $cropperPage.innerHeight();
    const cw = $cropperPage.innerWidth();

    // 各種パラメーターの計算
    const scale = Math.min(cw / img.width, ch / img.height);    // img要素のサイズと実際の画像の画像のサイズの比
    const l = Math.min(cw, ch) / scale;                         // 最初に画像を表示するときの画像の縦幅と横幅のうち小さい方の長さ
    const d = (Math.min(cw, ch) - padding * 2) / scale;         // 円の直径
    const v = l / Math.min(img.width, img.height);              // 画像の拡大率（元の画像ではなくimg要素の拡大率）

    // 画像の属性を設定
    $trimedIcon = document.getElementById('trimed_image');
    $trimedIcon.src = img.src;
    $trimedIcon.style.width = cw + 'px';
    $trimedIcon.style.height = ch + 'px';

    $('#completion').css('left', (cw + 0.95 * d * scale) / 2 - 50 + 'px');

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
    // startCropperで変更した内容を元に戻す。
    $cropperPage.css('display', 'none');
    $('#go-back').attr('onclick', "previous();");
    $('.go-back').css('color', 'gray');
    $('footer').css('display', 'flex');

    // cropperや入力欄をリセット
    $('#icon-file-input').val(null);
    cropper.destroy();
}
// #resized_iconのvalueにbase64形式のアイコン画像をセットする関数。
// #resized_iconのvalueを変えるときは必ずこの関数を使う
// ついでにプレビューの描画も行う
function setIcon(base64='') {
    $('#resized_icon').val(base64);

    // アイコンを設定していない場合はボタンの文字を「後で設定する」にする
    $('#submit-button-' + iconPage).val(base64 ? '次へ' : '後で設定する')
    $('#submit-button-' + iconPage).css('font-size', base64 ? '150%' : '85%')

    // プレビューを描画
    if(base64) {
        $('#error-resized_icon').html('');
        $('#icon-preview').css('background', `url(${base64}) no-repeat center/contain`);
    }else{
        $('#icon-preview').css('background', `url(${base64}) no-repeat center/contain`);
        $('#icon-preview').css('background-color', 'rgb(245, 245, 245)');
    }
    $('.plus-button').css('display', base64 ? 'none' : 'inline');
    $('.delete-button').css('display', base64 ? 'inline' : 'none');
}

// -----------------------------生年月日関連-------------------------------
// selectのoptionタグを生成するための関数
// @param {Element} elem 変更したいselectの要素
// @param {Number} val 表示される文字と値の数値
function createOptionForElements(elem, val, selected=false) {
    const $option = $('<option></option>', {
        value: val,
        text: val,
        selected: selected,
    });
    elem.append($option);
}

// 日付を変更する関数
function changeTheDay() {
    //日付の要素を削除
    $userBirthdayDay.html('');

    //選択された年月の最終日を計算
    const lastDayOfTheMonth = new Date($userBirthdayYear.val(), $userBirthdayMonth.val(), 0).getDate();

    //選択された年月の日付を生成
    for(let i = 1; i <= lastDayOfTheMonth; i++) {
        createOptionForElements($userBirthdayDay, i);
    }
}

// 入力された生年月日を$('#date_of_birth')にセットする
function setTheDate() {
    const year = $userBirthdayYear.val();
    const month = $userBirthdayMonth.val();
    const day = $userBirthdayDay.val();
    const date = year + '-' + (month.length < 2 ? '0' + month : month) + '-' + (day.length < 2 ? '0' + day : day);

    $('#date_of_birth').val(date);

    const pageNum = $('#date_of_birth').data('page');           // 入力された入力欄があるページ数を取得

    $('#error-date_of_birth').html('');   // 入力された入力欄のエラーを消す
    $('#submit-button-' + pageNum).css(
        'background-color', 
        hasEmptyFields(pageNum) ? 'gray' : 'black',
    );
}

// ----------------------------アカウント作成--------------------------------
function createAccount() {
    deleteError(submitPage);
    if(hasEmptyFields(submitPage, throwErrors=true)) return;

    const fd = new FormData();
    fd.append('csrfmiddlewaretoken', $('input[name="csrfmiddlewaretoken"]').val());
    for(let inputIDs of submitedInputs) {
        for(let inputID of inputIDs) {
            fd.append(inputID, $('#' + inputID).val());
        }
    }
    fetch(createAccountURL, {
        method: 'POST',
        body: fd,
    })
    .then(response => response.json())
    .then(data => {
        if(data.form_is_valid){
            location.href = loginRedirectURL;
        }else{
            displayErrors(data.errors, submitPage);
        }
    })
    .catch((error) => {
        raiseError(error);
    });
}

// ----------------------------その他--------------------------------
// inputIDs内のIDをbeforeIDとafterIDで囲んだセレクターを作る。
function makeSelector(beforeID, inputIDs, afterID) {
    let selector = '';
    for(let inputList of inputIDs) {
        for(let inputID of inputList) {
            if(selector) selector += ',';
            selector += beforeID + inputID + afterID;
        }
    }
    return selector;
}

// 何らかの問題が発生したときに最初からやり直してもらうための関数
function raiseError(error) {
    alert('問題が発生しました。初めからやり直してください。')
    location.reload()
    // console.error(error);
}

// -----------------------------イベント-------------------------------
$(function() {
    // 拡大縮小を禁止(拡大したままcropperの画面に行くと詰むため。)
    $('meta[name="viewport"]').attr(
        'content', 
        'width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no',
    );
    // 入力欄全てを指定するセレクターを作る
    const inputsSelector = makeSelector('#', observedInputs, '')
    // inputタグの要素の入力を監視して、そのページの全ての要素が入力されていればボタンの色を黒くする。
    // ついでにその要素のエラーメッセージも消してる。
    // 入力が必須じゃない項目は上で定義してるrequiredInputsから消しておけばチェックされない。
    // resized_icon等はここではイベントが発火しない。resized_iconの値の変更には必ずsetIcon関数を使うため、そちらで同様のチェックがされる。
    $(inputsSelector).on('keyup change', function() {
        const pageNum = $(this).data('page');           // 入力された入力欄があるページ数を取得

        $('#error-' + $(this).attr('id')).html('');   // 入力された入力欄のエラーを消す
        $('#submit-button-' + pageNum).css(
            'background-color', 
            hasEmptyFields(pageNum) ? 'gray' : 'black',
        );
    });

    // アイコンがアップロードされたときの処理
    $('#icon-file-input').on('change', function() {
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
    $('.delete-button').on('click', function() {
        setIcon();
        return false;
    });

    // 空白の選択肢が含まれるselectタグが選択されたとき
    $('#gender,#area_of_residence').on('change', function() {
        const pageNum = $(this).data('page');           // 入力された入力欄があるページ数を取得
        const inputID = $(this).attr('id');

        $('#error-' + inputID).html('');     // 入力された入力欄のエラーを消す
        $('#submit-button-' + pageNum).css(
            'background-color', 
            hasEmptyFields(pageNum) ? 'gray' : 'black',
        );
        if($(this).val()) {
            $('#null-selection-' + inputID).remove();
        }
    });

    // 生年月日の選択肢の処理
    //年の生成
    for(let i = yearNow-100; i <= yearNow; i++) {
        createOptionForElements($userBirthdayYear, i, i===2000);
    }
    //月の生成
    for(let i = 1; i <= 12; i++) {
        createOptionForElements($userBirthdayMonth, i);
    }
    //日の生成
    for(let i = 1; i <= 31; i++) {
        createOptionForElements($userBirthdayDay, i);
    }

    $('#birthday-year,#birthday-month').on('change', function() {
        changeTheDay();
        setTheDate();
    });
    $('#birthday-day').on('change', function() {
        setTheDate();
    });

    $('#date_of_birth').val('2000-01-01');
});