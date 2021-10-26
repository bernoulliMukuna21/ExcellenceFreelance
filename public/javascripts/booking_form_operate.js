let allServicesPrices;
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
    $('#service-booking-form select').append(new Option('Select Service', '')).attr('selected', true);
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
function priceToShow(targetService, allServicesPrices) {
    let targetPrice;
    for(let i=0; i<allServicesPrices.length; i++){
        let currentServiceAndPrice = allServicesPrices[i];
        if(currentServiceAndPrice.childNodes[0].innerHTML===targetService){
            targetPrice = currentServiceAndPrice.childNodes[1].innerHTML;
            break;
        }
    }

    return targetPrice
}


$('.bottom-side>button').click(event => {

    /* Get the clicked Freelancer*/
    let parentContainer = event.target.parentNode.parentNode
    let currentFreelancerName =  parentContainer.childNodes[0].
        childNodes[1].childNodes[0].innerText;

    // Create Booking Form Title
    let currentPopTitle = 'Book Service with '+ currentFreelancerName;

    // Get the clicked freelancer services and their respective prices
    allServicesPrices = parentContainer.childNodes[1].childNodes[0].childNodes;
    // Show the dynamic booking form
    booking_form_show(currentPopTitle, allServicesPrices)
    //priceToShow();
})

$('.public-service-enquiry .book-btn').click(event => {
    /* Get the clicked Freelancer*/
    let parentContainer = event.target.parentNode.parentNode
    let currentFreelancerName = parentContainer.childNodes[1].innerText;

    // Create Booking Form Title
    let currentPopTitle = 'Book Service with '+ currentFreelancerName;

    allServicesPrices = parentContainer.childNodes[3].childNodes;
    booking_form_show(currentPopTitle, allServicesPrices)
})

$('#service-booking-form select').change(event => {
    $('#service-booking-form select').css('border', '.1rem solid #213e53');
    let price = priceToShow(event.target.value, allServicesPrices);
    let bookBttnText;

    if(price){
        bookBttnText = 'Book '+ `(${price})`;
    }else bookBttnText = 'Book ';

    $('#service-booking-submit-bttn')[0].innerText = bookBttnText;
    $('#service-booking-price').val(price);
})


$('.closebook-form').click(event => {
    $('.booking').hide();
})

$(window).click(function(event) {
    if(event.target.className === "booking") {
        event.target.style.display = "none";
        $('#service-booking-form select').css('border-color', '#213e53');
        // #213e53
    }
});

/* ~~~~~~~~~~~~~~~~ Booking Form ~~~~~~~~~~~~~~~~~~~~~~~~*/

// Validation
/*
$(document).on('submit', '#service-booking-form', function(event) {
    event.preventDefault();

    console.log('Inside the book click button JQuery')
    console.log($('#service-booking-form select').val().length);
    if($('#service-booking-form select').val().length<1){
        $('#service-booking-form select').css('border', '.1rem solid red');
        $('#service-booking-form select').click();
    }

    $(this).submit();
})*/

$('#service-booking-form').submit(event=>{
    if($('#service-booking-form select').val().length<1){
        $('#service-booking-form select').css('border', '.1rem solid red');
        $('#service-booking-form select').click();
        event.preventDefault();
    }
})