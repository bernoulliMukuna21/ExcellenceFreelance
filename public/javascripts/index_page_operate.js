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
    $('#service-supplier-name').val(name);
    $('#service-booking-form').get(0).setAttribute('action',
        `http://localhost:3000/booking/service-booking/${freelancerEmail}`);
})
//`http://localhost:3000/payment/create-checkout-session/booking-checkout?client_freelancer=${freelancerEmail}`); //this works