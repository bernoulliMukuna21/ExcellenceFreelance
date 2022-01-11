import * as accountsOperation from './account_operate.js';
import * as socketConnection from './socketio-connection-client-side.js'
import {createBookingHTML, moveProjectBooking} from "./account_operate.js";
import BookingInsertionIndex from './BookingInsertionIndex.js'

let allServicesPrices;
let freelancerListOfStatus = ['booking ongoing', 'awaiting payment', 'accept / modify', 'awaiting response',
    'please respond', 'completed', 'processing payout...', 'awaiting resolution', 'paid', 'cancelled'];

let clientListOfStatus = ['booking ongoing', 'pay now', 'awaiting acceptance', 'awaiting response',
    'please respond', 'completed', 'thank you!', 'awaiting resolution', 'cancelled'];

function emptyForm() {
    // Clear input value
    $('.booking-form div:nth-child(2)>section h1').remove();
    $('#service-booking-form>select option').remove();
    $('#service-booking-projectName').val('');
    $('#service-booking-dueDate').val('');
    $('#service-enquiry-price').val('');
    $('#service-booking-projectDescription').val('');
    $('#bookingHour').prop('selectedIndex', 0);
    $('#bookingMinute').prop('selectedIndex', 0);
    $('#bookingMeridies').prop('selectedIndex', 0);

    // Clear error css
    $('#service-booking-form>select').css('border', 'none');
    $('.booking-time-picker h5').css('color', 'black');
    $('#bookingHour').css('border', 'none');
    $('#bookingMinute').css('border', 'none');
    $('.project-enquiry-price').css('border', 'none');
    $('#booking-form-error-mssg').empty();
}

function booking_form_show(title, allServicesPrices) {

    //First, clear the form of any input
    emptyForm();

    // Create title for the current Pop Up form
    let formHeader = document.createElement('h1');
    formHeader.classList.add('booktitle');
    formHeader.style.textAlign = 'center';
    formHeader.innerText = title;
    $('.booking-form div:nth-child(2)>section').append(formHeader);

    // Get and display all the services of the clicked freelancer
    $('#service-booking-form>select').append(new Option('Select Service', '')).attr('selected', true);
    allServicesPrices.forEach(service_price =>{
        let service = service_price.childNodes[0].innerHTML;
        $('#service-booking-form>select').append(new Option(service, service));
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
            //break;
        }
    }

    return targetPrice.slice(1)
}

function buttonToShow(button) {
    if(event.target.innerText === 'Instant Book'){
        //Show book and hide enquire button
        $('#service-booking-submit-bttn').show();

        //Hide book and show enquire button
        $('#service-enquiry-submit-bttn').hide();
        $('.project-enquiry-price').hide();
    }else if(event.target.innerText === 'Request'){
        //Show book and hide enquire button
        $('#service-booking-submit-bttn').hide();

        //Hide book and show enquire button
        $('#service-enquiry-submit-bttn').show();
        $('.project-enquiry-price').show();
    }
}

$('.bottom-side button').click(event => {
    /* Get the clicked Freelancer*/
    let parentContainer = event.target.parentNode.parentNode
    let currentFreelancerName =  parentContainer.childNodes[0].
        childNodes[1].childNodes[0].innerText;

    // Create Booking Form Title
    let currentPopTitle = 'Book Service with '+ currentFreelancerName;

    // Get the clicked freelancer services and their respective prices
    allServicesPrices = parentContainer.childNodes[1].childNodes[0].childNodes;

    // Hide/Show either Book or Enquire button
    buttonToShow(event.target.innerText)

    // Show the dynamic booking form
    booking_form_show(currentPopTitle, allServicesPrices)
})

$('.public-service-enquiry .book-btn').click(event => {
    /* Get the clicked Freelancer*/
    let parentContainer = event.target.parentNode.parentNode
    let currentFreelancerName = parentContainer.childNodes[1].innerText;

    // Create Booking Form Title
    let currentPopTitle = 'Book Service with '+ currentFreelancerName;

    allServicesPrices = parentContainer.childNodes[3].childNodes;

    // Hide/Show either Book or Enquire button
    buttonToShow(event.target.innerText)

    booking_form_show(currentPopTitle, allServicesPrices)
})


$('#service-booking-form>select').change(event => {
    if($('#service-booking-submit-bttn').is(':visible') ||
        $('#service-enquiry-submit-bttn').is(':visible')){

        $('#service-booking-form>select').css('border', '.1rem solid #213e53');
        let price = priceToShow(event.target.value, allServicesPrices);
        let bookBttnText;

        if(price){
            bookBttnText = 'Instant Book '+ `(£${price})`;
        }else bookBttnText = 'Instant Book';

        $('#service-booking-submit-bttn')[0].innerText = bookBttnText;
        $('#service-booking-price').val(price);
    }
})


$('.closebook-form').click(event => {
    $('.booking').hide();
})

$(window).click(function(event) {
    if(event.target.className === "booking") {
        event.target.style.display = "none";
        $('#service-booking-form>select').css('border-color', '#213e53');
        // #213e53
    }
});
/* ~~~~~~~~~~~~~~~~ Booking Form ~~~~~~~~~~~~~~~~~~~~~~~~*/

// Validation and Submission
$(document).on('click', '#service-booking-submit-bttn', function(event) {
    // Book button is clicked, submit form
    $('#service-booking-form').submit();
})

$(document).on('submit', '#service-booking-form', function(event) {
    event.preventDefault();

    // Empty the error field of the booking form
    $('#booking-form-error-mssg').empty();

    let bookingButtonHTML = $('#service-booking-form>button')[0];
    let requestButtonHTML = $('#service-booking-form>button')[1];

    let formData = accountsOperation.dataCollection(this);
    let bookingDataJSON = {}

    for (var value of formData.entries()) {
        bookingDataJSON[value[0]] = value[1];
    }
    console.log('Booking Data: ', bookingDataJSON);
    if(bookingDataJSON.servicename.trim() === '' || bookingDataJSON.projectdescription.trim() === '' ||
        bookingDataJSON.projectdueTimeHour.trim() === '' || bookingDataJSON.projectdueTimeMinute.trim() === '' ||
        bookingDataJSON.projectduedate.trim() === ''){
        if(bookingDataJSON.servicename === ''){
            $('#service-booking-form>select').css('border', '.1rem solid red');
        }
        if(bookingDataJSON.projectduedate===''){
            $('#service-booking-dueDate').css('border', '.1rem solid red');
        }
        if(bookingDataJSON.projectdueTimeHour===''){
            $('.booking-time-picker h5').css('color', 'red');
            $('#bookingHour').css('border', '.1rem solid red');
        }
        if(bookingDataJSON.projectdueTimeMinute===''){
            $('.booking-time-picker h5').css('color', 'red');
            $('#bookingMinute').css('border', '.1rem solid red');
        }
    }else{
        if ($(bookingButtonHTML).is(':visible') && (bookingButtonHTML.innerText).includes('Instant Book')){
            // If the user wants to make an instant booking

            $.ajax({
                method: 'POST',
                url: `/booking/service-booking/instant_booking/${JSON.parse(bookingDataJSON.projectsupplier).freelancerEmail}`,
                data: bookingDataJSON,
                success: function (data) {
                    window.location.replace(data.paymentRoute);
                },
                error: function (error) {
                    let errorMssg = error.responseJSON.error;
                    let errorTag = document.createElement('h4');
                    errorTag.innerText = errorMssg;
                    $('#booking-form-error-mssg').append(errorTag);
                }
            })

        }else if ($(requestButtonHTML).is(':visible') && (requestButtonHTML.innerText) === 'Request'){
            // If the user wants to make a request booking

            let regex = /^\d*\.?\d{0,2}$/;
            if(regex.test(bookingDataJSON.projectenquiryprice)){
                $(this).get(0).setAttribute('action',
                    `http://localhost:3000/booking/service-booking/request_booking/${JSON.parse(bookingDataJSON.projectsupplier).freelancerEmail}`);
                event.currentTarget.submit();
            }else{
                $('.project-enquiry-price').css('border', '.1rem solid red');
            }
        }
    }
})

// Add, Update and Delete booking - helper functions
function findProject(allProjectsContainerHTML, projectID) {
    let projectAtIndex;
    let allProjects = Array.from($(allProjectsContainerHTML)[0].childNodes);
    let projectIndex = allProjects.findIndex(
        singleProject => singleProject.lastChild.value === projectID);

    if(projectIndex === -1){
        projectAtIndex = undefined;
    }else{
        projectAtIndex = allProjects[projectIndex];
    }

    // return both the correct project and its index
    return [projectAtIndex, projectIndex];
}

function timeConversion([hour, minute, ampm], date) {
    let time = (parseInt(hour) + (ampm == 'PM' ? 12 : 0)) + ':' + minute + ':00';
    time = parseInt(time.split(':')[0])>=10 ? time : '0' + time;
    let dateTime = date.trim().split("/").reverse().join("-")+'T'+time.trim()+'Z';
    let timeInMilliSecond = BookingInsertionIndex.prototype.getDueDateMilliseconds(dateTime);

    return [dateTime, timeInMilliSecond];
}

// Dealing with Request booking
socketConnection.socket.on('Booking Data to Freelancer', bookingData => {
    /* With 'Request Booking', the project is inserted to all the bookings area.
    * It never goes to NDP (Next Due Project).
    * all bookings that come here are accept/modify*/

    bookingData.status = freelancerListOfStatus[bookingData.status.freelancer];
    console.log('Request booking: ', bookingData);

    if( $('.freelancer-all-projects').is(':empty') ){
        // There are no project in all projects section
        accountsOperation.createBookingHTML(accountsOperation.createBookingTopHTML(bookingData,
            'freelancer-one-project-top', 'freelancer-one-project-details')
            , 'freelancer-one-project', $('.freelancer-all-projects'));
    }else{
        // There are some projects in the section
        let freelancerAllProjectsBooking = $('.freelancer-all-projects')[0].childNodes;
        freelancerAllProjectsBooking = Array.from(freelancerAllProjectsBooking);
        let newProjectDueDateTime = BookingInsertionIndex.prototype.getDueDateMilliseconds(bookingData.dueDateTime);

        let bookingInsertion = new BookingInsertionIndex(freelancerAllProjectsBooking,
            bookingData.status, bookingData);

        let newProjectInsertionIndex = bookingInsertion.findProjectInsertionIndex(freelancerAllProjectsBooking,
            bookingData.status, newProjectDueDateTime);
        console.log('Request booking Insertiong Index: ', newProjectInsertionIndex);
        let place = newProjectInsertionIndex.place;
        let index = newProjectInsertionIndex.index;

        accountsOperation.createBookingHTML(accountsOperation.createBookingTopHTML(bookingData,
            'freelancer-one-project-top', 'freelancer-one-project-details'),
            'freelancer-one-project', $('.freelancer-all-projects'), {place:place,
                HTML: freelancerAllProjectsBooking[index]});
    }
})


// Dealing with instant booking or paid bookings
socketConnection.socket.on('Successful Payment - send to Freelancer', successData => {
    console.log('Success Payment: ', successData)
    let nxtdue_Project = $('.freelancer-projects-top-container')[0];
    successData.status = freelancerListOfStatus[successData.status.freelancer];

    if( !$('.freelancer-all-projects').is(':empty') ){
        // First, we will check whether the project is new or is there already
        // Check for ID in the list of all projects

        let projectAtIndex = findProject('.freelancer-all-projects', successData.bookingID)[0];
        if(projectAtIndex){
            // project is already in the list of all project
            // then delete it. It has a new update
            (projectAtIndex).remove();
        }
    }

    //successData.status === 'booking ongoing' &&
    if(nxtdue_Project.childNodes[0].className === 'emptyNextDueProject'){
        // There are no 'booking ongoing' - No next due project
        $('.emptyNextDueProject').remove();
        accountsOperation.createBookingHTML(accountsOperation.createBookingTopHTML(successData,
            'freelancer-projects-top', 'freelancer-projects-top-details'),
            $('.freelancer-projects-top-container'));
    }else{

        let nxtdueProjectDueDateTime = nxtdue_Project.firstChild.childNodes[2].innerText;
        nxtdueProjectDueDateTime = BookingInsertionIndex.prototype.getDueDateMilliseconds(nxtdueProjectDueDateTime);
        let newProjectDueDateTime = BookingInsertionIndex.prototype.getDueDateMilliseconds(successData.dueDateTime);

        if(newProjectDueDateTime < nxtdueProjectDueDateTime){
            console.log('New project is due sooner');
            // New project is due sooner. So, clone the current due project and
            // send it to all projects

            // step 3: Move the previous NDP to all the projects container
            accountsOperation.createBookingHTML(accountsOperation.moveProjectBooking(nxtdue_Project,
                {bookingID: successData.bookingID},
                'freelancer-one-project-top', 'freelancer-one-project-details'),
                'freelancer-one-project', $('.freelancer-all-projects'), {place:'first'});

            // Step 1: Empty next due project(NDP) container
            $('.freelancer-projects-top-container').empty();

            // Step 2: Insert the new NDP to the top
            accountsOperation.createBookingHTML(accountsOperation.createBookingTopHTML(successData,
                'freelancer-projects-top', 'freelancer-projects-top-details'),
                $('.freelancer-projects-top-container'));
        }else{

            // New project is due after the current due project. Send the new
            // project in all due projects

            if( $('.freelancer-all-projects').is(':empty') ){
                // There is only one booking. It is 'booking ongoing' stage
                accountsOperation.createBookingHTML(accountsOperation.createBookingTopHTML(successData,
                    'freelancer-one-project-top', 'freelancer-one-project-details')
                    , 'freelancer-one-project', $('.freelancer-all-projects'));
            }else{
                let freelancerAllProjectsBooking = $('.freelancer-all-projects')[0].childNodes;
                freelancerAllProjectsBooking = Array.from(freelancerAllProjectsBooking);

                let bookingInsertion = new BookingInsertionIndex(freelancerAllProjectsBooking, successData.status,
                    newProjectDueDateTime);
                // There are multiple projects, so find the right index for insertion
                let newProjectInsertionIndex = bookingInsertion.findProjectInsertionIndex(freelancerAllProjectsBooking,
                    successData.status, newProjectDueDateTime);
                console.log('Success Payment booking Insertiong Index: ', newProjectInsertionIndex);
                let place = newProjectInsertionIndex.place;
                let index = newProjectInsertionIndex.index;

                accountsOperation.createBookingHTML(accountsOperation.createBookingTopHTML(successData,
                    'freelancer-one-project-top', 'freelancer-one-project-details'),
                    'freelancer-one-project', $('.freelancer-all-projects'), {place:place,
                        HTML: freelancerAllProjectsBooking[index]});
            }
        }
    }
})

// Freelancer has accepeted booking
socketConnection.socket.on('Accept project on Freelancer side', AcceptData => {
    let freelancerAllProjectsBooking = $('.freelancer-all-projects')[0].childNodes;
    let freelancerAllProjectsBookingHTML = freelancerAllProjectsBooking;
    freelancerAllProjectsBooking = Array.from(freelancerAllProjectsBooking);

    let updatedProject = freelancerAllProjectsBooking[AcceptData.projectIndex];
    BookingInsertionIndex.prototype.updateProjectStatus(updatedProject,
        freelancerListOfStatus[AcceptData.status]);
    let updateProjectDueTime = BookingInsertionIndex.prototype.getProjectDueTime(updatedProject);
    updateProjectDueTime = BookingInsertionIndex.prototype.getDueDateMilliseconds(
        updateProjectDueTime);
    // Update background-color of the status
    $(updatedProject.firstChild.childNodes[3]).css(
        {
            'border': '.1rem solid #8d2874',
            'background-color':'#8d2874'
        }
    )

    freelancerAllProjectsBooking.splice(AcceptData.projectIndex, 1);
    console.log('rest of projects: ', freelancerAllProjectsBooking)
    /*freelancerAllProjectsBooking = freelancerAllProjectsBooking.slice(0,AcceptData.projectIndex)
        .concat(freelancerAllProjectsBooking.slice(AcceptData.projectIndex + 1));*/

    let bookingInsertion = new BookingInsertionIndex(freelancerAllProjectsBooking,
        freelancerListOfStatus[AcceptData.status],
        updateProjectDueTime);

    if(freelancerAllProjectsBooking.length === 0){
        // There are no projects left in the list of all the projects
        accountsOperation.createBookingHTML(Array.from(updatedProject.childNodes),
            'freelancer-one-project', $('.freelancer-all-projects'));
    }else{
        // There are still porject
        let newProjectInsertionIndex = bookingInsertion.findProjectInsertionIndex(freelancerAllProjectsBooking,
            freelancerListOfStatus[AcceptData.status], updateProjectDueTime);

        let place = newProjectInsertionIndex.place;
        let index = newProjectInsertionIndex.index;

        // remove element from frontend before putting it in its new position
        $(freelancerAllProjectsBookingHTML[AcceptData.projectIndex]).remove();

        // Create `Reject` button
        let acceptButtonOptions = updatedProject.childNodes[1].childNodes[1];
        $(acceptButtonOptions).empty();
        acceptButtonOptions.innerHTML = `<button id="freelancer-booking-delete-button">`+
            `Reject</button>`


        if(AcceptData.fromStatus === 'awaiting response'){
            let originalData = updatedProject.childNodes[1].childNodes[0].childNodes[0].childNodes[1];
            console.log(updatedProject)
            console.log(originalData);
            let projectDetailsUpdate =
                `<div><h4>Creation Date: ${originalData.childNodes[0].childNodes[1].innerText}</h4>`+
                `<div class="freelancer-project-details-descritpion">`+
                `<h4>Description:</h4>`+
                `<p>${originalData.childNodes[1].childNodes[1].innerText}</p>`+
                `</div>`+
                `<h4> Price: ${originalData.childNodes[2].childNodes[1].innerText}</h4>`+
                `</div>`;
            $(updatedProject.childNodes[1].childNodes[0]).empty();
            updatedProject.childNodes[1].childNodes[0].innerHTML = projectDetailsUpdate;
        }

        console.log(updatedProject)
        // Insert Element in its position
        accountsOperation.createBookingHTML(Array.from(updatedProject.childNodes),
            'freelancer-one-project', $('.freelancer-all-projects'),
            {place:place, HTML: freelancerAllProjectsBookingHTML[index]});
    }

    if(AcceptData.fromStatus === 'awaiting response'){
        $('.freelancer-booking-completion-rejection').hide();
    }

})

socketConnection.socket.on('Accept project on Client side', AcceptData => {
    // Update Status
    let projectToUpdate = findProject('.client-bookings-body',
        AcceptData.bookingToAcceptID)[0];
    let projectToUpdateStatus = projectToUpdate.childNodes[0].childNodes[0].childNodes[3]
        .childNodes[0];
    console.log('Status', AcceptData.status)
    projectToUpdateStatus.innerText = clientListOfStatus[AcceptData.status];
    $(projectToUpdateStatus).css(
        {
            'border': '.1rem solid #8d2874',
            'background-color':'#8d2874'
        }
    )

    // Enable pay button
    let payButtonHTM = projectToUpdate.childNodes[1].childNodes[0].lastChild.childNodes[0];
    $(payButtonHTM).attr('disabled' , false);
    $(payButtonHTM.childNodes[0]).css('cursor' , 'pointer');
    $(payButtonHTM).css('opacity' , '100%');
})

// Booking Modification
// 1. Freelancer Side
$(document).on('submit', '#booking-modification-form', function(event) {
    event.preventDefault();
    console.log('Form subitted')
    $('.freelancer-booking-modification>p').hide();

    let formData = accountsOperation.dataCollection(this);
    let bookingModifyDataJSON = {}

    for (var value of formData.entries()) {
        bookingModifyDataJSON[value[0]] = value[1];
    }
    let previousDataToModify = JSON.parse(bookingModifyDataJSON.modifyToData);
    let dataToModifyDate = bookingModifyDataJSON.bookingModificationDate;
    let dataToModifyHour = bookingModifyDataJSON.bookingHourModify;
    let dataToModifyMinute = bookingModifyDataJSON.bookingMinuteModify;//bookingMeridiesModify
    let dataToModifyAMPM = bookingModifyDataJSON.bookingMeridiesModify

    //time
    let dataToModifyTime = timeConversion([dataToModifyHour, dataToModifyMinute,
        dataToModifyAMPM], dataToModifyDate);
    let previousTime = timeConversion(previousDataToModify.modifyDueTime, previousDataToModify.modifyDueDate)

    //description
    let dataToModifyDescription = bookingModifyDataJSON.bookingModificationDescription;
    let previousDescription = previousDataToModify.modifyDescription;

    //price
    let dataToModifyPrice = bookingModifyDataJSON.modificationprice;
    let previousPrice = previousDataToModify.modifyPrice;

    // Validate form
    if(dataToModifyTime[1] === previousTime[1] && dataToModifyDescription === previousDescription
        && dataToModifyPrice === previousPrice){
        // No changes to the details, so no update
        $('.freelancer-booking-modification>p').show();
    }else if(dataToModifyDescription === '' || dataToModifyPrice === '' || !(/^\d+(?:\.\d{2})?$/.test(dataToModifyPrice))){
        if(dataToModifyDescription === ''){
            $(event.target.childNodes[1].childNodes[1]).css({'border': '0.1rem solid red'});
        }
        else{
            $(event.target.childNodes[2].childNodes[1]).css({'border': '0.1rem solid red'});
        }
    }else{
        // changes to the details, so update
        let bookingToModifyID = event.target.parentNode.parentNode.lastChild.value;
        console.log('Booking ID: ', bookingToModifyID)
        let dataToModify = {
            time: dataToModifyTime[0],
            description: dataToModifyDescription,
            price: dataToModifyPrice
        }

        $.ajax({
            method: 'POST',
            url: `/booking/project-modification/${bookingToModifyID}`,
            data: dataToModify,
            success: function (data) {
                console.log('Update was successful');
                console.log(data);
                let bookingDetailUpdate = data;
                let modifyData = data.bookingModificationConversation[data.bookingModificationConversation.length - 1];
                let singleProject = findProject('.freelancer-all-projects',
                    bookingDetailUpdate.bookingID);
                let projectAtIndex = singleProject[0];
                let singleProjectIndex = singleProject[1];

                let freelancerAllProjectsBooking = Array.from($('.freelancer-all-projects')[0].childNodes);
                $(freelancerAllProjectsBooking[singleProjectIndex]).remove();
                freelancerAllProjectsBooking.splice(singleProjectIndex, 1);

                let bookingInsertion = new BookingInsertionIndex(freelancerAllProjectsBooking,
                    freelancerListOfStatus[bookingDetailUpdate.status.freelancer],
                    bookingDetailUpdate.dueDateTime);

                let projectInsertionIndex = bookingInsertion.findProjectInsertionIndex(freelancerAllProjectsBooking,
                    freelancerListOfStatus[bookingDetailUpdate.status.freelancer], bookingDetailUpdate.dueDateTime);

                console.log('Project Insertion Index: ', projectInsertionIndex);

                // Update frontend
                let projectBookingDetails = projectAtIndex.childNodes[1].childNodes[0];
                $(projectBookingDetails).empty();
                accountsOperation.createBookingModificationHTML(data, modifyData, projectBookingDetails);
                projectAtIndex.childNodes[0].childNodes[3].innerText =
                    freelancerListOfStatus[bookingDetailUpdate.status.freelancer];
                //$(projectBookingDetails.childNodes[0]).hide();

                accountsOperation.createBookingHTML(Array.from(projectAtIndex.childNodes),
                    'freelancer-one-project', $('.freelancer-all-projects'),
                    {place: projectInsertionIndex.place,
                        HTML: freelancerAllProjectsBooking[projectInsertionIndex.index]});

                $(event.target.parentNode.parentNode.parentNode.parentNode).hide();
                console.log(projectAtIndex);
            },
            error: function (error) {
                console.log('Error occurred in Modification');
            }
        })
    }
})

// 1. Client Side
socketConnection.socket.on('Booking Modification to Client', modificationData => {
    let projectToUpdate = findProject('.client-bookings-body',
        modificationData.bookingID)[0];
    let projectToUpdateStatus = projectToUpdate.childNodes[0].childNodes[0].childNodes[3]
        .childNodes[0];
    projectToUpdateStatus.innerText = clientListOfStatus[modificationData.status.client];
    let projectDetailsTopContainer = projectToUpdate.childNodes[1].childNodes[0].childNodes[0];
    $(projectDetailsTopContainer).empty();
})
/*
socketConnection.socket.on('Booking Completion - Request to Freelancer', finishData => {
    let nxtdue_Project = $('.freelancer-projects-top-container')[0];
    if(finishData.bookingFinishID === nxtdue_Project.lastChild.value){
        // Next Due project is completed
        BookingInsertionIndex.prototype.updateProjectStatus(nxtdue_Project, 'awaiting confirmation');
        console.log('Nxt Due Project awaiting confirmation: ', nxtdue_Project);
        projectBookingCompletion_cssUpdate(nxtdue_Project);

        accountsOperation.createBookingHTML(accountsOperation.moveProjectBooking(nxtdue_Project,
            {bookingID: finishData.bookingFinishID},
            'freelancer-one-project-top', 'freelancer-one-project-details'),
            'freelancer-one-project', $('.freelancer-all-projects'));
        $('.freelancer-projects-top-container').empty();

        if( $('.freelancer-all-projects').is(':empty') ){
            let emptyNextDueProjectHTML = document.createElement('p');
            emptyNextDueProjectHTML.classList.add('emptyNextDueProject');
            emptyNextDueProjectHTML.innerText = 'No Next Due Project'
            $('.freelancer-projects-top-container').append(emptyNextDueProjectHTML);
        }else{
            let freelancerAllProjectsBooking = $('.freelancer-all-projects')[0];
            let singleProject = freelancerAllProjectsBooking.childNodes[0];

            if(BookingInsertionIndex.prototype.getProjectStatus(singleProject)==='booking ongoing'){
                // Send the project from the list of all projects to the Next Due project
                accountsOperation.createBookingHTML(accountsOperation.moveProjectBooking(singleProject,
                    {bookingID: singleProject.lastChild.value},
                    'freelancer-projects-top', 'freelancer-projects-top-details'),
                    $('.freelancer-projects-top-container'));
                $(singleProject).remove();
            }else{
                let emptyNextDueProjectHTML = document.createElement('p');
                emptyNextDueProjectHTML.classList.add('emptyNextDueProject');
                emptyNextDueProjectHTML.innerText = 'No Next Due Project'
                $('.freelancer-projects-top-container').append(emptyNextDueProjectHTML);
            }
        }
    }else{
        // The project completed is in the list of all the project.

        // Find the project
        let freelancerAllProjectsBooking = $('.freelancer-all-projects')[0].childNodes;
        freelancerAllProjectsBooking = Array.from(freelancerAllProjectsBooking);

        let projectIndex = freelancerAllProjectsBooking.findIndex(
            singleProject => singleProject.lastChild.value === finishData.bookingFinishID);

        let singleProject = freelancerAllProjectsBooking[projectIndex];
        BookingInsertionIndex.prototype.updateProjectStatus(singleProject, 'awaiting confirmation');
        projectBookingCompletion_cssUpdate(singleProject);

        $(singleProject).clone().appendTo($('.freelancer-all-projects'));
        $(singleProject).remove();
    }

    // Hide Completion Conversation Modal
    $('.freelancer-booking-completion-rejection').hide();
})

socketConnection.socket.on('Booking Completion - Request to Client', finishData => {
    console.log('Client side: ', finishData);
    let allprojects = Array.from($('.client-bookings-body')[0].childNodes);

    let projectIndex = allprojects.findIndex(singleProject =>
        singleProject.lastChild.value === finishData.bookingFinishID);
    let singleProject = allprojects[projectIndex];
    console.log('Project Index: ', projectIndex);

    singleProject.firstChild.firstChild.childNodes[3].firstChild.innerText= 'confirm / reject';
    $(singleProject.firstChild.firstChild.childNodes[3].firstChild).css(
        {
            'border': '.1rem solid #308634',
            'background-color':'#308634'
        }
    )
    $(singleProject.childNodes[1].childNodes[0]).hide();
    $(singleProject.childNodes[1].childNodes[1]).show();
    $(singleProject.childNodes[1].childNodes[1].childNodes[0]).show();
    $(singleProject.childNodes[1].childNodes[1].childNodes[1]).hide();
    $(singleProject.childNodes[1].childNodes[1].childNodes[2]).hide();
    $(singleProject).clone().appendTo($('.client-bookings-body'));
    $(singleProject).remove();
})

function projectBookingCompletion_cssUpdate(html) {
    $(html.firstChild.childNodes[3]).css(
        {
            'border': '.1rem solid #308634',
            'background-color':'#308634'
        }
    )

    $(html.childNodes[1].childNodes[1].firstChild).attr('disabled','disabled');
    $(html.childNodes[1].childNodes[1].lastChild).attr('disabled','disabled');

    $(html.childNodes[1].childNodes[1].firstChild).css(
        {
            'cursor':'not-allowed',
            'opacity':'50%'
        }
    )
    $(html.childNodes[1].childNodes[1].lastChild).css(
        {
            'disabled': 'true',
            'cursor':'not-allowed',
            'opacity':'50%'
        }
    )
    $(html.childNodes[1].childNodes[0]).hide();
    $(html.childNodes[1].childNodes[1]).hide();
    $(html.childNodes[1].childNodes[2]).show();
    $(html.childNodes[1].childNodes[2].childNodes[0]).show();
    $(html.childNodes[1].childNodes[2].childNodes[0].childNodes[1]).hide();
}

// Booking Completion

// 1: Confirmation
socketConnection.socket.on('Booking Completion Confirmation - to Client', confirmData => {
    console.log('booking compeltion confirmation (client): ', confirmData);
    let allprojects = Array.from($('.client-bookings-body')[0].childNodes);

    let projectIndex = allprojects.findIndex(singleProject =>
        singleProject.lastChild.value === confirmData.bookingCompletionConfirmedID);

    let singleProject = allprojects[projectIndex];
    singleProject.firstChild.firstChild.childNodes[3].firstChild.innerText= 'confirmed';

    $(singleProject.childNodes[1].childNodes[0]).hide();
    $(singleProject.childNodes[1].childNodes[1]).show();
    $(singleProject.childNodes[1].childNodes[1].childNodes[0]).hide();
    $(singleProject.childNodes[1].childNodes[1].childNodes[1]).hide();
    $(singleProject.childNodes[1].childNodes[1].childNodes[2]).show();

    // Close modal
    $(singleProject.parentNode.parentNode.parentNode.nextSibling).hide();
})

socketConnection.socket.on('Booking Completion Confirmation - to Freelancer', confirmData => {
    console.log('booking compeltion confirmation (Freelancer): ', confirmData);
    // Find the project
    let freelancerAllProjectsBooking = $('.freelancer-all-projects')[0].childNodes;
    freelancerAllProjectsBooking = Array.from(freelancerAllProjectsBooking);

    let projectIndex = freelancerAllProjectsBooking.findIndex(
        singleProject => singleProject.lastChild.value === confirmData.bookingCompletionConfirmedID);

    let singleProject = freelancerAllProjectsBooking[projectIndex];
    BookingInsertionIndex.prototype.updateProjectStatus(singleProject, 'confirmed, well done!');
})

// 2: Conflict

socketConnection.socket.on('Booking Completion Conflict - to Client', conflictData => {
    let allprojects = Array.from($('.client-bookings-body')[0].childNodes);

    let projectIndex = allprojects.findIndex(singleProject =>
        singleProject.lastChild.value === conflictData.bookingCompletionConflictID);

    let singleProject = allprojects[projectIndex];
    singleProject.firstChild.firstChild.childNodes[3].firstChild.innerText= 'awaiting resolution';
    $(singleProject.firstChild.firstChild.childNodes[3].firstChild).css(
        {
            'border': '.1rem solid #FF0000',
            'background-color':'#FF0000'
        }
    )

    $(singleProject.childNodes[1].childNodes[0]).hide();
    $(singleProject.childNodes[1].childNodes[1]).show();
    $(singleProject.childNodes[1].childNodes[1].childNodes[0]).hide();
    $(singleProject.childNodes[1].childNodes[1].childNodes[1]).hide();
    $(singleProject.childNodes[1].childNodes[1].childNodes[2]).show();
    $(singleProject.childNodes[1].childNodes[1].childNodes[2].firstChild.childNodes[0]).hide();
    $(singleProject.childNodes[1].childNodes[1].childNodes[2].firstChild.childNodes[1]).show();

    // Close modal
    $(singleProject.parentNode.parentNode.parentNode.nextSibling).hide();
})

socketConnection.socket.on('Booking Completion Conflict - to Freelancer', conflictData => {
    // Find the project
    let freelancerAllProjectsBooking = $('.freelancer-all-projects')[0].childNodes;
    freelancerAllProjectsBooking = Array.from(freelancerAllProjectsBooking);

    let projectIndex = freelancerAllProjectsBooking.findIndex(
        singleProject => singleProject.lastChild.value === conflictData.bookingCompletionConflictID);

    let singleProject = freelancerAllProjectsBooking[projectIndex];
    BookingInsertionIndex.prototype.updateProjectStatus(singleProject, 'awaiting resolution');
    $(singleProject.firstChild.childNodes[3]).css(
        {
            'border': '.1rem solid #FF0000',
            'background-color':'#FF0000'
        }
    )
    $(singleProject.childNodes[1].childNodes[2].firstChild.childNodes[1]).show();
})


// Booking Rejection
socketConnection.socket.on('Delete project on Freelancer side', deleteData => {
    console.log('Data Deletion (Freelancer Side): ', deleteData)
    let freelancerAllProjectsBooking = $('.freelancer-all-projects')[0].childNodes;
    freelancerAllProjectsBooking = Array.from(freelancerAllProjectsBooking);

    let projectIndex = freelancerAllProjectsBooking.findIndex(
        singleProject => singleProject.lastChild.value === deleteData.projectToCancelID);

    let singleProject = freelancerAllProjectsBooking[projectIndex];
    $(singleProject).remove();
})

socketConnection.socket.on('Delete project on Client side', deleteData => {
    console.log('Data Deletion (Client Side): ', deleteData)
    let allprojects = Array.from($('.client-bookings-body')[0].childNodes);

    let projectIndex = allprojects.findIndex(singleProject =>
        singleProject.lastChild.value === deleteData.projectToCancelID);
    let singleProject = allprojects[projectIndex];
    $(singleProject).remove();
})

// 'Booking Ongoing' Cancelled
socketConnection.socket.on('Ongoing Project Cancel on Freelancer side', cancelData => {
    console.log('Booking ongoing Cancel freelancer side: ', cancelData);
    let nxtdue_Project = $('.freelancer-projects-top-container')[0];
    if(cancelData.projectToCancelID === nxtdue_Project.lastChild.value){
        // Next Due project is cancelled
        BookingInsertionIndex.prototype.updateProjectStatus(nxtdue_Project, 'cancelled');
        projectCancellation_cssUpdate(nxtdue_Project);

        accountsOperation.createBookingHTML(accountsOperation.moveProjectBooking(nxtdue_Project,
            {bookingID: cancelData.projectToCancelID},
            'freelancer-one-project-top', 'freelancer-one-project-details'),
            'freelancer-one-project', $('.freelancer-all-projects'));
        $('.freelancer-projects-top-container').empty();

        if( $('.freelancer-all-projects').is(':empty') ){
            let emptyNextDueProjectHTML = document.createElement('p');
            emptyNextDueProjectHTML.classList.add('emptyNextDueProject');
            emptyNextDueProjectHTML.innerText = 'No Next Due Project'
            $('.freelancer-projects-top-container').append(emptyNextDueProjectHTML);
        }else{
            let freelancerAllProjectsBooking = $('.freelancer-all-projects')[0];
            let singleProject = freelancerAllProjectsBooking.childNodes[0];

            if(BookingInsertionIndex.prototype.getProjectStatus(singleProject)==='booking ongoing'){
                // Send the project from the list of all projects to the Next Due project
                accountsOperation.createBookingHTML(accountsOperation.moveProjectBooking(singleProject,
                    {bookingID: singleProject.lastChild.value},
                    'freelancer-projects-top', 'freelancer-projects-top-details'),
                    $('.freelancer-projects-top-container'));
                $(singleProject).remove();
            }else{
                let emptyNextDueProjectHTML = document.createElement('p');
                emptyNextDueProjectHTML.classList.add('emptyNextDueProject');
                emptyNextDueProjectHTML.innerText = 'No Next Due Project'
                $('.freelancer-projects-top-container').append(emptyNextDueProjectHTML);
            }
        }
    }else{
        // The porject is not in the Next Due section, so go to all projects

        // Find the project
        let freelancerAllProjectsBooking = $('.freelancer-all-projects')[0].childNodes;
        freelancerAllProjectsBooking = Array.from(freelancerAllProjectsBooking);

        let projectIndex = freelancerAllProjectsBooking.findIndex(
            singleProject => singleProject.lastChild.value === cancelData.projectToCancelID);

        let singleProject = freelancerAllProjectsBooking[projectIndex];
        BookingInsertionIndex.prototype.updateProjectStatus(singleProject, 'cancelled');
        projectCancellation_cssUpdate(singleProject);

        $(singleProject).clone().appendTo($('.freelancer-all-projects'));
        $(singleProject).remove();
    }
})

function projectCancellation_cssUpdate(html) {
    let allprojectsContainer = html.parentNode.parentNode;
    $(html.firstChild.childNodes[3]).css(
        {
            'border': '.1rem solid #FF0000',
            'background-color':'#FF0000'
        }
    )

    if(allprojectsContainer.className !== 'booking-section-container'){
        allprojectsContainer = allprojectsContainer.parentNode;
    }

    $(html.childNodes[1].childNodes[1]).hide();
    $(allprojectsContainer.nextSibling).hide();
}

socketConnection.socket.on('Ongoing Project Cancel on Client side', cancelData => {
    console.log('Booking ongoing Cancel client side: ', cancelData)
    let allprojects = Array.from($('.client-bookings-body')[0].childNodes);

    let projectIndex = allprojects.findIndex(singleProject =>
        singleProject.lastChild.value === cancelData.projectToCancelID);
    let singleProject = allprojects[projectIndex];
    singleProject.firstChild.firstChild.childNodes[3].firstChild.innerText= 'cancelled';
    $(singleProject.firstChild.firstChild.childNodes[3].firstChild).css(
        {
            'border': '.1rem solid #FF0000',
            'background-color':'#FF0000'
        }
    )
    $(singleProject.childNodes[1].childNodes[0]).hide();
    $(singleProject.childNodes[1].childNodes[1]).show();
    $(singleProject.childNodes[1].childNodes[1].childNodes[0]).hide();
    $(singleProject.childNodes[1].childNodes[1].childNodes[1]).show();
    $(singleProject.childNodes[1].childNodes[1].childNodes[2]).hide();
    $(singleProject).clone().appendTo($('.client-bookings-body'));
    $(singleProject).remove();
})

socketConnection.socket.on('Booking ongoing Cancel on Client side', cancelData => {
    console.log('Cancel Data (Client Side): ', cancelData)
    let allprojects = Array.from($('.client-bookings-body')[0].childNodes);

    let projectIndex = allprojects.findIndex(singleProject =>
        singleProject.lastChild.value === cancelData.bookingToDeleteID);
    let singleProject = allprojects[projectIndex];
    singleProject.firstChild.firstChild.childNodes[3].firstChild.innerText= 'cancelled';
    $(singleProject.firstChild.firstChild.childNodes[3].firstChild).css(
        {
            'border': '.1rem solid #FF0000',
            'background-color':'#FF0000'
        }
    )
    $(singleProject.childNodes[1].childNodes[0]).hide();
    $(singleProject.childNodes[1].childNodes[1]).show();
    $(singleProject.childNodes[1].childNodes[1].childNodes[0]).hide();
    $(singleProject.childNodes[1].childNodes[1].childNodes[1]).hide();
    $(singleProject.childNodes[1].childNodes[1].childNodes[2]).show();
    $(singleProject.childNodes[1].childNodes[1].childNodes[2].firstChild.childNodes[0]).show();
    $(singleProject.childNodes[1].childNodes[1].childNodes[2].firstChild.childNodes[1]).hide();
    $(singleProject).clone().appendTo($('.client-bookings-body'));
    $(singleProject).remove();
})

socketConnection.socket.on('Booking ongoing Cancel on Freelancer side', cancelData => {
    console.log('Cancel Data (Freelancer Side): ', cancelData);
    let nxtdue_Project = $('.freelancer-projects-top-container')[0];
    if(cancelData.bookingToDeleteID === nxtdue_Project.lastChild.value){
        // Next Due project is cancelled
        BookingInsertionIndex.prototype.updateProjectStatus(nxtdue_Project, 'cancelled');
        clientprojectCancellation_cssUpdate(nxtdue_Project);

        accountsOperation.createBookingHTML(accountsOperation.moveProjectBooking(nxtdue_Project,
            {bookingID: cancelData.projectToCancelID},
            'freelancer-one-project-top', 'freelancer-one-project-details'),
            'freelancer-one-project', $('.freelancer-all-projects'));
        $('.freelancer-projects-top-container').empty();

        if( $('.freelancer-all-projects').is(':empty') ){
            let emptyNextDueProjectHTML = document.createElement('p');
            emptyNextDueProjectHTML.classList.add('emptyNextDueProject');
            emptyNextDueProjectHTML.innerText = 'No Next Due Project';
            $('.freelancer-projects-top-container').append(emptyNextDueProjectHTML);
        }else{
            let freelancerAllProjectsBooking = $('.freelancer-all-projects')[0];
            let singleProject = freelancerAllProjectsBooking.childNodes[0];

            if(BookingInsertionIndex.prototype.getProjectStatus(singleProject)==='booking ongoing'){
                // Send the project from the list of all projects to the Next Due project
                accountsOperation.createBookingHTML(accountsOperation.moveProjectBooking(singleProject,
                    {bookingID: singleProject.lastChild.value},
                    'freelancer-projects-top', 'freelancer-projects-top-details'),
                    $('.freelancer-projects-top-container'));
                $(singleProject).remove();
            }else{
                let emptyNextDueProjectHTML = document.createElement('p');
                emptyNextDueProjectHTML.classList.add('emptyNextDueProject');
                emptyNextDueProjectHTML.innerText = 'No Next Due Project';
                $('.freelancer-projects-top-container').append(emptyNextDueProjectHTML);
            }
        }
    }else{
        // The porject is not in the Next Due section, so go to all projects

        // Find the project
        let freelancerAllProjectsBooking = $('.freelancer-all-projects')[0].childNodes;
        freelancerAllProjectsBooking = Array.from(freelancerAllProjectsBooking);

        let projectIndex = freelancerAllProjectsBooking.findIndex(
            singleProject => singleProject.lastChild.value === cancelData.bookingToDeleteID);

        let singleProject = freelancerAllProjectsBooking[projectIndex];
        BookingInsertionIndex.prototype.updateProjectStatus(singleProject, 'cancelled');
        clientprojectCancellation_cssUpdate(singleProject);

        $(singleProject).clone().appendTo($('.freelancer-all-projects'));
        $(singleProject).remove();
    }
})

function clientprojectCancellation_cssUpdate(html) {
    let allprojectsContainer = html.parentNode.parentNode;
    $(html.firstChild.childNodes[3]).css(
        {
            'border': '.1rem solid #FF0000',
            'background-color':'#FF0000'
        }
    )

    if(allprojectsContainer.className !== 'booking-section-container'){
        allprojectsContainer = allprojectsContainer.parentNode;
    }

    $(html.childNodes[1].childNodes[0]).hide();
    $(html.childNodes[1].childNodes[1]).hide();
    $(html.childNodes[1].childNodes[2]).show();
    console.log('Client cancel show mssg: ', html.childNodes[1].childNodes[2])
    $(html.childNodes[1].childNodes[2].childNodes[0]).hide();
    $(html.childNodes[1].childNodes[2].childNodes[1]).show();
    $(allprojectsContainer.nextSibling).hide();
}

socketConnection.socket.on('Booking Delete on Client side - Client Request', deleteData => {
    console.log('Data Deletion (Client Side): ', deleteData)
    let allprojects = Array.from($('.client-bookings-body')[0].childNodes);

    let projectIndex = allprojects.findIndex(singleProject =>
        singleProject.lastChild.value === deleteData.bookingToDeleteID);
    let singleProject = allprojects[projectIndex];
    $(singleProject).remove();
})

socketConnection.socket.on('Booking Delete on Freelancer side - Client Request', deleteData => {
    console.log('Data Deletion (Freelancer Side): ', deleteData)
    let freelancerAllProjectsBooking = $('.freelancer-all-projects')[0].childNodes;
    freelancerAllProjectsBooking = Array.from(freelancerAllProjectsBooking);

    let projectIndex = freelancerAllProjectsBooking.findIndex(
        singleProject => singleProject.lastChild.value === deleteData.bookingToDeleteID);

    let singleProject = freelancerAllProjectsBooking[projectIndex];
    $(singleProject).remove();
})*/