$(document).ready(function(){
    if( $('.bottom-side').is(':empty') ){
        $('.middle-side').css('border-bottom', 'none');
    }
})
function scrollToFreelancers(){
    $('html, body').animate({
        scrollTop: $('.index-page-three').offset().top
    }, 1000);
}
/*
$('#book-now-btn').click(function (event) {
    scrollToFreelancers();
})
let previousName = $('#book-now-btn')[0];
if(previousName.className === 'client'){
    scrollToFreelancers();
}*/

$(document).on('click', '.bottom-side button', function(event) {
    let mainDIV = event.target.parentNode.parentNode;
    let freelancerEmail = mainDIV.lastChild.value;
    let name = mainDIV.firstChild.lastChild.firstChild.firstChild.firstChild.innerText;
    $('#service-supplier-name').val(JSON.stringify({freelancerEmail: freelancerEmail, freelancerName: name}));

    console.log(freelancerEmail);
    console.log(name);

})

$(document).on('click', '.feedbackText', function(event) {
    $('.feedback-modal-container').toggle();
})