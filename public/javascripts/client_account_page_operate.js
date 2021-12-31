import * as accountsOperation from './account_operate.js';
import * as socketConnection from './socketio-connection-client-side.js'

/*
* The sections of the freelancer page will need to be hidden, and shown
* only the one that the user has clicked on. The 'main profile information'
* will be the default once the page has loaded.
* */

let clientProfileSections = $('.client-account-middle')[0].childNodes;
let clientsectionNames = $('.client-account-left ul li');

$(document).ready(function(){
    $(clientsectionNames).click(function(){
        accountsOperation.pageDispalyStyle(this, clientsectionNames,
            clientProfileSections);
    });

    // on page load, if the intention is to message another user,
    // the following code helps to initiate the conversation.
    let clientMessage_pageToGo = clientsectionNames[2];
    if(clientMessage_pageToGo.id === 'show-user-messages'){
        accountsOperation.pageDispalyStyle(clientMessage_pageToGo, clientsectionNames,
            clientProfileSections);
    }

    /* CLient Booking Communication */
    let allClientBookings = $('.client-bookings-body')[0].childNodes;
    if(allClientBookings.length>0){
        allClientBookings.forEach(singleBooking => {
            let statusHTML = singleBooking.firstChild.firstChild.childNodes[3];
            let bookingOptionHTLM = singleBooking.childNodes[1].firstChild;
            console.log('Client single each booking: ', singleBooking)
            if(statusHTML.innerText === 'awaiting acceptance'){
                let payButtonHTML = bookingOptionHTLM.lastChild.firstChild
                $(payButtonHTML).attr('disabled' , true);
                $(payButtonHTML.firstChild).css('cursor' , 'not-allowed');
                $(payButtonHTML).css('opacity' , '50%');
            }
            if(statusHTML.innerText === 'confirm / reject'){
                let bookingDescription = statusHTML.parentNode.parentNode.nextSibling;
                $(bookingDescription.childNodes[0]).hide();
                $(bookingDescription.childNodes[1]).show();
            }
            if(statusHTML.innerText === 'confirmed'){
                let bookingDescription = statusHTML.parentNode.parentNode.nextSibling;
                $(bookingDescription.childNodes[0]).hide();
                $(bookingDescription.childNodes[1]).show();
                $(bookingDescription.childNodes[1].childNodes[0]).hide();
                $(bookingDescription.childNodes[1].childNodes[1]).hide();
                $(bookingDescription.childNodes[1].childNodes[2]).show();
            }
            if(statusHTML.innerText === 'awaiting resolution'){
                let bookingDescription = statusHTML.parentNode.parentNode.nextSibling;
                $(bookingDescription.childNodes[0]).hide();
                $(bookingDescription.childNodes[1]).show();
                $(bookingDescription.childNodes[1].childNodes[0]).hide();
                $(bookingDescription.childNodes[1].childNodes[1]).hide();
                $(bookingDescription.childNodes[1].childNodes[2]).show();
                $(bookingDescription.childNodes[1].childNodes[2].firstChild.childNodes[0]).hide();
                $(bookingDescription.childNodes[1].childNodes[2].firstChild.childNodes[1]).show();
            }
            if(statusHTML.innerText === 'cancelled'){
                let bookingDescription = statusHTML.parentNode.parentNode.nextSibling;
                $(bookingDescription.childNodes[0]).hide();
                $(bookingDescription.childNodes[1]).show();
                $(bookingDescription.childNodes[1].childNodes[0]).hide();
                $(bookingDescription.childNodes[1].childNodes[1]).show();
                $(bookingDescription.childNodes[1].childNodes[2]).hide();
            }
            if(statusHTML.innerText === 'you cancelled'){
                let bookingDescription = statusHTML.parentNode.parentNode.nextSibling;
                $(bookingDescription.childNodes[0]).hide();
                $(bookingDescription.childNodes[1]).show();
                $(bookingDescription.childNodes[1].childNodes[0]).hide();
                $(bookingDescription.childNodes[1].childNodes[1]).hide();
                $(bookingDescription.childNodes[1].childNodes[2]).show();
            }
        })
    }
})
$(document).click(function (event) {
    let elementClicked = event.target;

    if(elementClicked.className === 'addProfilePicture'){
        let pageToGo = clientsectionNames[1];
        accountsOperation.pageDispalyStyle(pageToGo, clientsectionNames,
            clientProfileSections);
    }

    /* Client Booking */
    let bookingDescription;
    if(elementClicked.parentNode.className === 'booking-main-details'){
        bookingDescription = elementClicked.parentNode.parentNode
            .childNodes[1];
        $(bookingDescription).toggle();
    }
    else if(elementClicked.parentNode.className === 'single-client-booking'){
        bookingDescription = elementClicked.parentNode
            .childNodes[1];
        $(bookingDescription).toggle();
    }
    else if(elementClicked.parentNode.parentNode.className
        === 'booking-main-details'){
        bookingDescription = elementClicked.parentNode.parentNode.
            parentNode.childNodes[1];
        $(bookingDescription).toggle();
    }
    else if(elementClicked.id === 'progressstatus'){
        bookingDescription = elementClicked.parentNode.parentNode.
            parentNode.parentNode.childNodes[1];
        $(bookingDescription).toggle();
    }
    else if(elementClicked.className === 'far fa-trash-alt' &&
        (elementClicked.parentNode.parentNode.parentNode
            .className === 'booking-main-details')){
        bookingDescription = elementClicked.parentNode.parentNode.
            parentNode.parentNode.childNodes[1];
        $(bookingDescription).toggle();
    }

    // Booking Modal Hide
    if(event.target.className === "client-account-modal") {
        event.target.style.display = "none";
    }
})

/*** Booking ***/
$(document).on('click', '#projectCompleted', function(event) {
    let bookingDescriptionHTML = event.target.parentNode.parentNode.
        parentNode.parentNode;
    let clientSide_modal = bookingDescriptionHTML.parentNode.parentNode.
        parentNode.parentNode.nextSibling;

    console.log('confirmed ID: ', bookingDescriptionHTML.nextSibling.value)

    $(clientSide_modal).show();
    $(clientSide_modal.firstChild.firstChild.firstChild).show();
    $(clientSide_modal.firstChild.firstChild.childNodes[1]).hide();
    $(clientSide_modal.firstChild.firstChild.childNodes[2])
        .val(bookingDescriptionHTML.nextSibling.value);
})

$(document).on('click', '#projectIncomplete', function(event) {
    let bookingDescriptionHTML = event.target.parentNode.parentNode.
        parentNode.parentNode;
    let clientSide_modal = bookingDescriptionHTML.parentNode.parentNode.
        parentNode.parentNode.nextSibling;

    console.log('conflict ID: ', bookingDescriptionHTML.nextSibling.value)
    $(clientSide_modal).show();
    $(clientSide_modal.firstChild.firstChild.childNodes[1]).show();
    $(clientSide_modal.firstChild.firstChild.firstChild).hide();
    $(clientSide_modal.firstChild.firstChild.childNodes[2])
        .val(bookingDescriptionHTML.nextSibling.value);
})

$(document).on('click', '.client-booking-completion-confirmation .client-bookingCompletion-continue', function(event) {
    // Booking Completion confirmed
    let bookingCompletionConfirmedID = event.target.parentNode.parentNode.nextSibling.nextSibling.value;
    socketConnection.socket.emit('Completion Confirmed', {bookingCompletionConfirmedID})
})
$(document).on('click', '.client-booking-completion-rejection .client-bookingCompletion-continue', function(event) {
    // Booking Completion Conflict
    let bookingCompletionConflictID = event.target.parentNode.parentNode.nextSibling.value;
    socketConnection.socket.emit('Completion Conflict', {bookingCompletionConflictID})
})

$(document).on('click', '.client-booking-completion .client-bookingCompletion-cancel', function(event) {
    $(event.target.parentNode.parentNode.parentNode.parentNode.parentNode).hide();
})

$(document).on('click', '.delete-booking-bttn', function(event) {
    let deleteBttnHTML = event.target;
    let projectDetails = deleteBttnHTML.parentNode.parentNode.
        parentNode;
    let bookingToDeleteID = projectDetails.nextSibling.value;
    let freelancerBooked = bookingToDeleteID.split(':')[1];
    let projectStatus = projectDetails.previousSibling.firstChild.childNodes[3].innerText;

    if(projectStatus === 'booking ongoing'){
        socketConnection.socket.emit('Booking ongoing Delete - Client Request',
            {bookingToDeleteID, freelancerBooked, status: projectStatus});
    }else{
        socketConnection.socket.emit('Booking Delete - Client Request',
            {bookingToDeleteID, freelancerBooked, status: projectStatus});
    }
})


/*** The following codes deal with the changes and display of the profile of the client ***/
accountsOperation.profileImageChange("#client-profile-picture",
    '#client-imagePreview')
accountsOperation.profileImageEmpty('#client-imagePreview')


/*
* This section is to handle the process of the client updating their personal
* information.
* **/

$('#client-profile-update-form').submit(function (event) {
    event.preventDefault();
    console.log('Client profile update profile submission');
    let clientErrorSection = '.client-update-errors';

    // on submit of information, any of the errors display during the
    // previous this submit process should be erased from the screen.
    $(clientErrorSection).empty();

    // Collect the data of the update profile form
    let formData = accountsOperation.dataCollection(this);

    // Get the profile picture uploaded by the client
    let saved_clientProfile = $('#client-profile-picture')[0].files[0];
    formData.append('user_profile_picture', saved_clientProfile);

    $.ajax({
        type: 'PUT',
        enctype: 'multipart/form-data',
        url: '/account/client/update',
        data: formData,
        contentType: false,
        processData: false,
        success: function (data) {
            // display the updated profile picture of the client
            $('.client-profile-details img').attr('src',
                data.profileImageSrc);
            $('default-profile-image p').innerText = '+ Update Profile Picture';

            // display the updated names of te client
            accountsOperation.showNames(data.name, data.surname,
                '.client-profile-name');
        },
        error: function (error) {
            let errors = error.responseJSON;
            accountsOperation.ajaxFormError_generator(errors, clientErrorSection);
        }
    })
})

