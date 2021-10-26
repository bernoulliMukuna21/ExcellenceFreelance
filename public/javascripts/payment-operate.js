let dev_URL = 'http://localhost:3000';
let prod_URL = 'https://excellence-freelance.herokuapp.com/'
var socket = io.connect(prod_URL);

$('.cancel-subscription-popup').click(event => {
    $('.subscription-payment').hide();
})

$(window).click(function(event) {
    if(event.target.className === "subscription-payment") {
        event.target.style.display = "none";
    }
});
$(document).ready(function () {

    if (!sessionStorage.getItem('subscriptionReminder') ||
        !sessionStorage.getItem('subscriptionReminder') === "1") {

        $(".subscription-payment").show();

        if($('.subscription-payment').is(":visible")) {
            sessionStorage.setItem('subscriptionReminder', '1');
        }
    }
    else{

        $(".subscription-payment").hide();
    }
})

socket.on('taskRequest', data => {
    console.log(data);
})
