let recLastGroupId = 0;
let recLastDMId = 0;
let recComponent;

// 初期化関数。募集のページを開いた直後と募集の再読み込み時に使う
function initializeRecruitment(data) {
    recComponent = data.component;
    displayRecruitments('group', initialization=true);
    displayRecruitments('individual', initialization=true);
}
// 募集を一つ追加する
function addRecruitment(recruitment, type) {
    const filledComponent = fill(recComponent, recruitment)
    $(`#${type}-recruitments`).append(filledComponent);
}
// apiを叩いてtypeで指定した募集を取ってきて全部表示する。initialization=trueで初期化した上で表示
async function displayRecruitments(type, initialization=false) {
    if(initialization) {
        $(`#${type}-recruitments`).html('')         // 募集欄のhtmlを空にする
        // 一番最後の募集のidをゼロに設定
        if(type === 'group') recLastGroupId = 0;
        else recLastDMId = 0;
    }

    // 募集を取得
    const recruitments = await getRecruitments(type);
    // 募集がなかった場合
    if(recruitments.length === 0) {
        $(`#${type}-recruitments`).html(
            `<div class="w-100 d-flex justify-content-center align-items-center" style="height: calc(100vh - 300px);">
                <p class="h4">募集はありません</p>
            </div>`
        )
        return;
    }

    // 表示
    for(let recruitment of recruitments) {
        addRecruitment(recruitment, type);
    }
    if(type === 'group') recLastGroupId = recruitments[recruitments.length - 1].id;
    else recLastDMId = recruitments[recruitments.length - 1].id;
}
// apiを叩いてtypeで指定した募集を取ってくる関数
async function getRecruitments(type) {
    let url;
    // urlの設定
    switch(type) {
        case 'group':
            url = getGroupChatRecruitmentsURL.replace('0', recLastGroupId);
            break;
        case 'individual':
            url = getIndividualChatRecruitmentsURL.replace('0', recLastDMId);
            break;
        default:
            // typeがグループでも個別でもなければエラーを出してリターン
            console.error('typeはgroupかindividualのどちらかです');
            return;
    }

    const res = await fetch(url);
    const data = await res.json();
    return data;
}

// グループか個別かを選択したときの処理
function select(selected) {
    // 選択されたタブと表示するページを変える
    if(selected === 'group'){
        $("#group-tab").addClass("selected-tab");
        $("#individual-tab").removeClass("selected-tab");
        $("#group").css('display', 'block');
        $("#individual").css('display', 'none');
    }else{
        $("#group-tab").removeClass("selected-tab");
        $("#individual-tab").addClass("selected-tab");
        $("#group").css('display', 'none');
        $("#individual").css('display', 'block');
    }
    // 検索欄のリセット
    deleteKeywords()
}

// 検索欄をリセットする関数
function deleteKeywords() {
    $('#search-box').val('')
    $('#delete').css('display', 'none')
    $('#search-button').css('color', 'gray')
}

$(function() {
    // 検索欄に文字が入っているかどうかで表示を変える
    $(document).on('keyup', '#search-box', function() {
        if($(this).val()){
            $('#delete').css('display', 'flex')
            // $('#search-button').css('color', 'rgb(0, 145, 255)')
            $('#search-button').css('color', 'rgb(0, 145, 210)')
        }else{
            $('#delete').css('display', 'none')
            $('#search-button').css('color', 'gray')
        }
    });
    
});