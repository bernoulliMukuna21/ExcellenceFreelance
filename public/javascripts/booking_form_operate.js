function booking_form_show(title, allServicesPrices) {

    //First, clear the form of any input
    $('.booking-form div:nth-child(2)>section h1').remove();
    $('#service-booking-form select option').remove();
    $('#service-booking-dueDate').val('');

    // Create title for the current Pop Up form
    let formHeader = document.createElement('h1');
    formHeader.classList.add('booktitle');
    formHeader.style.textAlign = 'center';
    formHeader.innerText = title;

    $('.booking-form div:nth-child(2)>section').append(formHeader);

    // Get and display all the services of the clicked freelancer

    allServicesPrices.forEach(service_price =>{
        let service = service_price.childNodes[0].innerHTML;
        $('#service-booking-form select').append(new Option(service, service));
    })

    $('.booking').css({
        'display': 'flex',
        'justifyContent': 'center',
        'alignItems': 'center'
    });
    $('.booking').show();
}

$('.bottom-side>button').click(event => {

    /* Get the clicked Freelancer*/
    let parentContainer = event.target.parentNode.parentNode
    let currentFreelancerName =  parentContainer.childNodes[0].
        childNodes[1].childNodes[0].innerText;

    // Create Booking Form Title
    let currentPopTitle = 'Book Service with '+ currentFreelancerName;

    // Get the clicked freelancer services and their respective prices
    let allServicesPrices = parentContainer.childNodes[1].childNodes[0].childNodes;

    // Show the dynamic booking form
    booking_form_show(currentPopTitle, allServicesPrices)
})

$('.public-service-enquiry .book-btn').click(event => {
    /* Get the clicked Freelancer*/
    let parentContainer = event.target.parentNode.parentNode
    let currentFreelancerName = parentContainer.childNodes[1].innerText;

    // Create Booking Form Title
    let currentPopTitle = 'Book Service with '+ currentFreelancerName;

    let allServicesPrices = parentContainer.childNodes[3].childNodes;
    console.log(allServicesPrices)
    booking_form_show(currentPopTitle, allServicesPrices)
})

$('.closebook-form').click(event => {
    $('.booking').hide();
})

$(window).click(function(event) {
    if(event.target.className === "booking") {
        event.target.style.display = "none";
    }
});

//console.log('The selector tag: ', $('.bookform-field'));