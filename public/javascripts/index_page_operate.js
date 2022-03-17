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

$(document).on('click', '.index-serviceAndPrice', function (event) {
    let indexPageServicesHTML = event.target;

    if (indexPageServicesHTML.tagName === 'P')
        indexPageServicesHTML = indexPageServicesHTML.parentNode

    let packagesForService = JSON.parse(indexPageServicesHTML.lastChild.value);
    packagesForService = packagesForService.freelancerPackage;
    let servicePackageModal = indexPageServicesHTML.parentNode.parentNode.parentNode.parentNode.lastChild;
    console.log(packagesForService)

    servicePackageModal.firstChild.firstChild.firstChild.firstChild.innerHTML =
        `<span>${indexPageServicesHTML.firstChild.value} </span>`+
        `by ${indexPageServicesHTML.parentNode.parentNode.previousSibling.lastChild.firstChild.firstChild.firstChild.value}`;


    // Set the price for the current cliked service to be shown on the modal
    servicePackageModal.firstChild.childNodes[1].childNodes[2].firstChild.innerText = `Total Price: ${indexPageServicesHTML.childNodes[1].innerText}`

    // Finally, set the packages to be displayed
    servicePackageModal = servicePackageModal.firstChild.childNodes[1].childNodes[1];
    $(servicePackageModal).empty();

    if(packagesForService.length > 0){
        servicePackageModal.innerHTML = '<ul></ul>';
        packagesForService.forEach( singlePackage => {
            let packageUList = document.createElement('li');
            packageUList.innerText = `- ${singlePackage}`;
            servicePackageModal.firstChild.append(packageUList);
        })
    }else{
        servicePackageModal.innerHTML = '<div><p>Empty Package</p></div>'
    }

    $('.freelance-service-package-modal').css({
        'display': 'flex',
        'justifyContent': 'center',
        'alignItems': 'center'
    });
    $('.freelance-service-package-modal').show();
});


$(window).click(function(event) {
    if(!event.target.closest('.freelance-service-package-modal-container')
        && !event.target.closest('.index-serviceAndPrice')
        || event.target.className === 'closebook-form'){
        $('.freelance-service-package-modal').hide();
    }
});