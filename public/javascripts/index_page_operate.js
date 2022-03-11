$(document).ready(function(){
    if(!$('.bottom-side button').is(':visible')){
        $('.bottom-side .freelance-mssg-btn').css({
            'padding':'.75rem',
            'width': '12rem',
        });
    }
})
function scrollToFreelancers(){
    $('html, body').animate({
        scrollTop: $('.index-page-three').offset().top
    }, 1000);
}

$('#book-now-btn').click(function (event) {
    scrollToFreelancers();
})
let previousName = $('#book-now-btn')[0];
if(previousName.className === 'client'){
    scrollToFreelancers();
}

$(document).on('click', '.bottom-side button', function(event) {
    let mainDIV = event.target.parentNode.parentNode;
    let freelancerEmail = mainDIV.lastChild.value;
    let name = mainDIV.firstChild.lastChild.firstChild.firstChild.firstChild.innerText;
    $('#service-supplier-name').val(JSON.stringify({freelancerEmail: freelancerEmail, freelancerName: name}));

    /*$('#service-booking-form').get(0).setAttribute('action',
        `http://localhost:3000/booking/service-booking/${freelancerEmail}`);*/
})
//`http://localhost:3000/payment/create-checkout-session/booking-checkout?client_freelancer=${freelancerEmail}`); //this works