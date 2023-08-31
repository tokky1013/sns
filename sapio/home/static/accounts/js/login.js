$('input[name="username"],input[name="password"]').on('keyup change', function() {
    $('#error-' + $(this).attr('name')).html('');

    const inputNames = ['username', 'password'];
    for(let name of inputNames) {
        if(!$(`input[name="${name}"]`).val()) {
            $('.submit-button').css('background-color', 'gray');
            return;
        }
    }
    $('.submit-button').css('background-color', 'black');
})