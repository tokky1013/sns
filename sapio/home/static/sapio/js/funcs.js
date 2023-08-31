// 画像をリサイズしてbase64形式でfuncで渡された関数に渡す。htmlのどこかに <canvas id="canvas-for-resize" class="d-none"></canvas> を書く
function resize(base64, func, maxWidth=2000, maxHeight=2000) {
    const resizedImage = new Image();
    resizedImage.onload = function() {
        const v = Math.min(1, maxWidth / resizedImage.width, maxHeight / resizedImage.height);
        const width = Math.floor(v * resizedImage.width);
        const height = Math.floor(v * resizedImage.height);

        const $canvas = $('#canvas-for-resize');
        $canvas.attr('width', width);
        $canvas.attr('height', height);

        const ctx = $canvas[0].getContext('2d');
        ctx.drawImage(resizedImage, 0, 0, width, height);
        const resizedBase64 = $canvas[0].toDataURL("image/png");

        func(resizedBase64);
    }
    resizedImage.src = base64;
}

// 以下テスト用の関数
function okay(message='ok') {
    console.log(message);
}
function print(message) {
}