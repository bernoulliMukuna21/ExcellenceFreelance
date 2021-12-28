import * as accountsOperation from './account_operate.js';
import {ajaxFormMessage_generator} from "./account_operate.js";
import * as socketConnection from './socketio-connection-client-side.js'

/*
* The sections of the freelancer page will need to be hidden, and shown
* only the one that the user has clicked on. The 'main profile information'
* will be the default once the page has loaded.
* */

let freelancerProfileSections = $('.freelancer_account_main_side')[0].childNodes;
let freelancerAllowedPages = $('.freelancer-page-allowed')[0].childNodes;
let freelancersectionNames = $('.account-profile-information ul li');

$(document).ready(function(){
    $('.freelancer-update-infos').empty();
    let freelancersectionNames_firstChild = $('.account-profile-information ul li:first-child');
    let freelancersectionNames_lastChild = $('.account-profile-information ul li:last-child');

    if(freelancersectionNames_firstChild[0].innerText === 'Main Page'
    && freelancersectionNames_lastChild[0].innerText === 'Main Page'){
        freelancersectionNames_firstChild.hide();
    }else{
        $(freelancersectionNames).click(function(){
            accountsOperation.pageDispalyStyle(this, freelancersectionNames, freelancerAllowedPages);
        });

        let freelancerMessage_pageToGo = freelancersectionNames_lastChild[0];
        if(freelancerMessage_pageToGo.id === 'show-user-messages'){
            accountsOperation.pageDispalyStyle(freelancerMessage_pageToGo, freelancersectionNames,
                freelancerAllowedPages);
        }
    }

    // Booking
});

$(document).click(function (event) {
    let elementClicked = event.target;

    /*
     From the main page, the lines of codes below are used to navigate to the 'update information'
     section of the profile.
     */
    if(elementClicked.className === 'addProfilePicture'|| elementClicked.id == 'addDescription'
        || elementClicked.id == 'addSkills' || elementClicked.id == 'addEducation'
        || elementClicked.id == 'addService' || elementClicked.id == 'addPrice'
        || elementClicked.id == 'addServiceAndPrice'
    ){
        let pageToGo = freelancersectionNames[1];
        accountsOperation.pageDispalyStyle(pageToGo, freelancersectionNames,
            freelancerProfileSections);
    }

    /*
    * In the lines of codes below, the border lines will be removed from the input fields that produced
    * errors when the button that triggered their actions were clicked.
    * */

    // For the education fields
    /*if(elementClicked.className!=='education-input-btn'){
        $('#Schoolname, #Major, #Degree, .user-education-years select')
            .css('border-color', 'lightgrey');
    }*/

    // For service and price
    if(elementClicked.id!=='servicePriceBttn'){
        $('.user-servicePrice-container input')
            .css('border-color', 'lightgrey');
    }

    // For skills
    if(elementClicked.id!=='add-skills-button'){
        $('#userBioSkills input')
            .css('border-color', 'lightgrey');
    }

    /* Freelancer Booking*/
    let bookingDescription;
    if(elementClicked.className === 'freelancer-projects-top'||
        elementClicked.className === 'freelancer-one-project-top'){
        bookingDescription = elementClicked.parentNode.childNodes[1];
        $(bookingDescription).toggle();
    }
    else if(elementClicked.className === "freelancer-one-project"){
        bookingDescription = elementClicked.childNodes[1];
        $(bookingDescription).toggle();
    }
    else if (elementClicked.parentNode.className === 'freelancer-projects-top'||
        elementClicked.parentNode.className === "freelancer-one-project-top"){
        bookingDescription = elementClicked.parentNode.parentNode.childNodes[1];
        $(bookingDescription).toggle();
    }
    else if(elementClicked.className === 'far fa-trash-alt' &&
    (elementClicked.parentNode.parentNode.className === 'freelancer-one-project-top' ||
     elementClicked.parentNode.parentNode.className === 'freelancer-projects-top')){
        $(elementClicked.parentNode.parentNode.parentNode.childNodes[1]).toggle();
    }

    // Project Completion Modal Hide
    if(event.target.className === "freelancer-booking-completion-rejection") {
        event.target.style.display = "none";
    }
});

/* Portfolio Section Controller */
//console.log('Freelancer Page Content Height: ', $('.freelancer-page-main-container').height());
//$('.freelancer-portfolio-big-modal').height($('.freelancer-page-main-container').height());


/*
* The following codes deal with the changes and display of the profile
* of the freelancer
* */

accountsOperation.profileImageChange("#freelancer-profile-picture",
    '#imagePreview')
accountsOperation.profileImageEmpty('#imagePreview')

/*
* The following is for handling the information update process of a freelancer
* */

// The first thing is to cancel default behaviour if a user presses the enter
// keyboard. This will help cancelling the automatic submission of the
// freelancer update profile form.
accountsOperation.keyBoardAction('.update-general-information');

/*
* Add Education
* */
$('.education-input-btn').click(function (event) {
    /*
    * When this button is clicked, the education of a freelancer is added and shown.
    * */
    event.preventDefault();

    let school_name = $('#Schoolname').val();
    let major = $('#Major').val();
    let degree = $('#Degree').val();
    let start_year = $('#educationDateStart').val();
    let end_year = $('#educationDateEnd').val();

    $('#Schoolname, #Major, #Degree, #educationDateStart, #educationDateEnd')
        .css('border-color', 'lightgrey');

    if(!school_name || !major || !degree || !start_year || !end_year){
        if(!school_name){
            $('#Schoolname').css('border-color', 'red');

        }
        if(!major){
            $('#Major').css('border-color', 'red');
        }
        if(!degree){
            $('#Degree').css('border-color', 'red');
        }
        if(!start_year){
            $('#educationDateStart').css('border-color', 'red');
        }
        if(!end_year){
            $('#educationDateEnd').css('border-color', 'red');
        }
    }
    else{

        if(start_year>end_year){
            $('#educationDateStart').css('border-color', 'red');
            $('#educationDateEnd').css('border-color', 'red');
        }

        else{
            // Create a div container for education
            let educationDiv = document.createElement('div');
            educationDiv.classList.add('freelancer-single-education');

            // Create a div education to be shown
            let showEducationDiv = document.createElement('div');
            showEducationDiv.classList.add('show-section');

            // Create a hidden div education
            let hiddenEducaionDiv = document.createElement('div');
            hiddenEducaionDiv.classList.add('hide-section')
            hiddenEducaionDiv.style.display = 'none';

            // Add Course Title to show section
            let courseTitle = document.createElement('h4');
            courseTitle.innerText = major + ' ' + degree;
            showEducationDiv.appendChild(courseTitle);

            // Add School to show section
            let schoolName = document.createElement('p');
            schoolName.innerText = school_name;
            showEducationDiv.appendChild(schoolName);

            // Add Year of Education to show section
            let year = document.createElement('p');
            year.innerText = 'Year: ' + start_year + ' - ' + end_year;
            showEducationDiv.appendChild(year);

            // Add Delete Button to Show Section
            let deleteButton = document.createElement('button');
            deleteButton.innerText = 'x';
            deleteButton.classList.add('education-delete-btn');
            showEducationDiv.appendChild(deleteButton);

            // Add Course Title to Hide Section
            let hideCourseTitle = document.createElement('input');
            hideCourseTitle.type = 'text';
            hideCourseTitle.name = 'degree';
            hideCourseTitle.value = major + ' ' + degree
            hideCourseTitle.readOnly = true;
            hiddenEducaionDiv.appendChild(hideCourseTitle);

            // Add School to Hide Section
            let hideSchoolName = document.createElement('input');
            hideSchoolName.type = 'text';
            hideSchoolName.name = 'schoolName';
            hideSchoolName.value = school_name;
            hideSchoolName.readOnly = true;
            hiddenEducaionDiv.appendChild(hideSchoolName);

            // Add Year of Education to Hide Section
            let hideSchoolYear = document.createElement('input');
            hideSchoolYear.type = 'text';
            hideSchoolYear.name = 'educationYear';
            hideSchoolYear.value = start_year + ' - ' + end_year;
            hideSchoolYear.readOnly = true;
            hiddenEducaionDiv.appendChild(hideSchoolYear);

            // Now, Add both containers of shown and hidden sections
            // to the single user education div
            educationDiv.appendChild(showEducationDiv);
            educationDiv.appendChild(hiddenEducaionDiv);
            $('.saved-education').append(educationDiv);

            $('#Schoolname').val('');
            $('#Major').val('');
            $('#Degree').val('');
            $('#educationDateStart').val('');
            $('#educationDateEnd').val('');
        }

    }
})

// When an error is throw, the borders of the education fields are highlighted
// in red. When a click is made away on a blank part of the page, the border
// must return to its default color.

// Add the Possibility of a freelancer deleting their education
accountsOperation.deleteItem('.saved-education',
    'education-delete-btn');

/*
* Adding Skills and Services for the Freelancer
* */

function serviceAndSkill(inputIdName, singleClassName, deleteButton,
                         containerHtml, showClass, hideClass, inputHtmlName){
    /*
    * This function is for add and showing skills and services of the freelancer
    * */

    let serviceOrSkillValue = $(inputIdName+ ' input').val().trim();
    let currentService_priceValue;

    // At the beginning of each addition of either the service and its
    // price or the skill, it must be ensure that the border of the
    // input field is in its default color.
    $(inputIdName+ ' input').css('border-color', 'lightgrey');

    if(inputHtmlName==='service'){
        // Each service must have its own price. This loop
        // is used to check if we are dealing with the service
        // because this loop is also used for the process of
        // extracting data for the skills.
        let priceValue = $('#userServicesPriceField input').val().trim();

        // default color for the input field of the price
        $('#userServicesPriceField input').css('border-color', 'lightgrey');
        $('.user-servicePrice-container section:nth-child(2) p').hide();

        // The first check to be carried on the price of the current service is
        // to find out whether the field was left empty
        if((isNaN(priceValue) && !Number(priceValue))){
            $('#userServicesPriceField input').css('border-color', 'red');
        }else{
            currentService_priceValue = priceValue;
        }
    }

    if((inputHtmlName==='service' && !currentService_priceValue)||!serviceOrSkillValue){
        if(inputHtmlName==='service' && !currentService_priceValue){
            $('#userServicesPriceField input').css('border-color', 'red');
        }
        if(!serviceOrSkillValue){
            $(inputIdName+ ' input').css('border-color', 'red');
        }
    }
    // START FROM HERE
    else{
        // Create a container for one input
        let containerDiv = document.createElement('div');
        containerDiv.classList.add(singleClassName);

        // Create a show container
        let showDiv = document.createElement('div');
        showDiv.classList.add(showClass);

        // Create a hide container
        let hideDiv = document.createElement('div');
        hideDiv.classList.add(hideClass);
        hideDiv.style.display = 'none';

        // Show childNodes
        let singleName_html = document.createElement('h4');
        singleName_html.innerText = serviceOrSkillValue;
        showDiv.appendChild(singleName_html);

        let removeButton = document.createElement('button');
        removeButton.classList.add(deleteButton);
        removeButton.innerText = 'x';

        // Hide ChildNodes
        let input_html = document.createElement('input');
        input_html.type = 'text';
        input_html.name = inputHtmlName;
        input_html.value = serviceOrSkillValue;
        input_html.readOnly = true;
        hideDiv.appendChild(input_html);

        if(inputHtmlName==='service'){
            // In this if statement, another field for the price
            // is added for each of the services
            let singlePrice_html = document.createElement('h4');
            singlePrice_html.innerText = '£'+currentService_priceValue;
            showDiv.appendChild(singlePrice_html);

            // Add the remove button on the show section
            showDiv.appendChild(removeButton);

            // On the section of the service, Add an input tag for the price
            let priceInput_html = document.createElement('input');
            priceInput_html.type = 'text';
            priceInput_html.name = 'price';
            priceInput_html.value = currentService_priceValue;
            priceInput_html.readOnly = true;
            hideDiv.appendChild(priceInput_html);
        }else{
            /*
            * here, it is when we are dealing with the skills
            * */
            // Add the remove button on the show section
            showDiv.appendChild(removeButton);
        }

        // Make the single container
        containerDiv.appendChild(showDiv);
        containerDiv.appendChild(hideDiv);
        $(containerHtml).append(containerDiv);

        // Empty the field
        $(inputIdName+ ' input').val('');
        $('#userServicesPriceField input').val('');
    }
}
// services
$('#servicePriceBttn').click(function (event) {
    event.preventDefault();

    serviceAndSkill('#userServiceField', 'single-serviceAndPrice',
        'delete-aServiceAndPrice-btn', '.saved-serviceAndPrice',
        'show-serviceAndPrice', 'hide-serviceAndPrice', 'service');
})

// Add the possibility of freelancer deleting their services
accountsOperation.deleteItem('.saved-serviceAndPrice',
    'delete-aServiceAndPrice-btn');



// skills
$('#add-skills-button').click(function (event) {
    event.preventDefault();

    serviceAndSkill('#userBioSkills', 'single-skill',
        'delete-aSkill-btn','.saved-skill', 'show-skill',
        'hidden-skill', 'skills');
});
// Add the possibility of freelancer deleting their skills
accountsOperation.deleteItem('.saved-skill',
    'delete-aSkill-btn');

$(document).on('click', '.public-service-enquiry button', function(event) {
    let freelancerEmail = event.target.parentNode.lastChild.lastChild.value;
    $('#service-booking-form').get(0).setAttribute('action',
        `http://localhost:3000/payment/create-checkout-session/booking-checkout?client_freelancer=${freelancerEmail}`); //this works
})

/*
* Collect the Education, Skills and Services of the freelancer
* **/
function getInputValues(mainContainerHtml){
    /*
    * This function is used to collect the education, skills an services
    * information of the freelancer.
    * */

    let listOfAllChildren = []
    let savedSection = $(mainContainerHtml)[0].childNodes;
    savedSection.forEach(singleChild=>{
        if(singleChild.nodeType == 8){
            return;
        }

        let singleChildList = [];
        let hide_section = singleChild.childNodes[1].childNodes;
        hide_section.forEach(input=>{
            singleChildList.push(input.value);
        })

        listOfAllChildren.push(singleChildList);
    })

    return JSON.stringify(listOfAllChildren);
}

$('.update-general-information').submit(function (event) {
    event.preventDefault();
    let startTime = Date.now();
    let freelancerErrorInfos = '.freelancer-update-infos';

    $(freelancerErrorInfos).empty();

    // Collect the data of the update profile form
    let formData = accountsOperation.dataCollection(this);

    // Get the profile picture uploaded by the freelancer
    let saved_profilePicture = $('#freelancer-profile-picture')[0].files[0];
    formData.append('user_profile_picture', saved_profilePicture);

    formData.append('saved_educations', getInputValues('.saved-education'));
    formData.append('saved_servicesAndPrices', getInputValues('.saved-serviceAndPrice'));
    formData.append('saved_skills', getInputValues('.saved-skill'));

    $.ajax({
        type: 'PUT',
        enctype: 'multipart/form-data',
        url: '/account/freelancer/update',
        data: formData,
        contentType: false,
        processData: false,
        success: function (data) {

            /***** display the updated profile picture of the freelancer *****/
            $('.account-profile-image img').attr('src',
                data.profileImageSrc);

            /********* display names of the freelancer *********/
            accountsOperation.showNames(data.name, data.surname,
                '.account-profile-name');

            /******** display services and skills of the freelancer ********
            *
            * The service cannot be empty. Therefore, all the
            * children under the section that the service can
            * be hidden to show the updated services.
            */
            $('.freelancer-services').children().hide();
            accountsOperation.showServicesAndPrices(data.serviceAndPrice,
                '.freelancer-services');

            /*
            * On the other hand, it is possible to have empty skills.
            * In this situation, before updating the visuals, checkings
            * must be carried to see whether the freelancer has any skills
            * listed.
            * */
            let freelancerSkills = data.skill;
            if(freelancerSkills.length>0){
               /*
               * Only update the skills frontend when the freelancer
               * has at least 1 registered
               */
                $('.user-account-skills section').children().hide();
                $('.user-account-skills h1').show();
                accountsOperation.showSkills(data.skill,
                    '.user-account-skills section');
            }else{
                $('.user-account-skills section').children().hide();
                $('.user-account-skills h1').show();
                accountsOperation.emptySkills('+ Add Your Skills',
                    '.user-account-skills');
            }

            /*************** display the description of the freelancer ***********/
            let freelancerDescription = data.description;
            if(freelancerDescription){
                $('.account-first-side').children().hide();
                $('.account-first-side h1').show();
                accountsOperation.showDescription(data.description,
                    '.account-first-side');
            }else{
                $('.account-first-side').children().hide();
                $('.account-first-side h1').show();
                accountsOperation.emptyDescription('+ Add a Description about yourself',
                    '.account-first-side');
            }

            // display the education of the freelancer
            let freelancerEducation = data.education;
            if(freelancerEducation.length>0){
                $('.account-third-side').children().hide();
                $('.account-third-side h1').show();
                accountsOperation.showEducations(freelancerEducation,
                    '.account-third-side');
            }else{
                $('.account-third-side').children().hide();
                $('.account-third-side h1').show();
                accountsOperation.emptyEducation('+ Add Education',
                    '.account-third-side');
            }

            accountsOperation.pageDispalyStyle(freelancersectionNames[0],
                freelancersectionNames, freelancerProfileSections);

            let successMessages = [[{label: 'successMessage',
                message: 'Profile successfully saved!'}]];
            accountsOperation.ajaxFormMessage_generator(successMessages,
                '.freelancer-update-infos');
            $("html, body").animate({ scrollTop: 0 }, "slow");
            $('.single-update-container').delay(5000).hide(1000);
        },
        error: function (error) {
            let errors = error.responseJSON;
            accountsOperation.ajaxFormMessage_generator(errors, freelancerErrorInfos);
            $("html, body").animate({ scrollTop: 0 }, "slow");
        }
    })
})

/*** Freelancer side - projects bookings ***/

// Accept Booking
$(document).on('click', '.freelancer-booking-accept-button', function(event) {
    let freelancerAcceptBttnHTML = event.target;
    let singleProjectContainer =  freelancerAcceptBttnHTML.parentNode.parentNode;
    let bookingToAcceptID = singleProjectContainer.parentNode.lastChild.value;
    let clientThatBooked = bookingToAcceptID.split(':')[0];
    let projectIndex = Array.from(singleProjectContainer.parentNode.parentNode.childNodes)
        .findIndex(singleProject => singleProject.lastChild.value === bookingToAcceptID)

    socketConnection.socket.emit('Accept project',
        {projectIndex, bookingToAcceptID, clientThatBooked});
})

$(document).on('click', '.freelancer-booking-finish-button', function(event) {
    projectCompletionShow(event);
})

$(document).on('click', '.freelancer-booking-delete-button', function(event) {

    let projectDetails = event.target.parentNode.parentNode;
    let projectTop = projectDetails.previousSibling;
    let projectStatus = projectTop.childNodes[3];
    let projectToCancelID = projectDetails.nextSibling.value;
    let clientThatBooked = projectToCancelID.split(':')[0];

    if(projectStatus.innerText === 'booking ongoing'){
        projectCompletionShow(event)
    }else{
        console.log('Please go ahead and delete project');
        socketConnection.socket.emit('Delete project',
            {projectToCancelID, clientThatBooked, status: projectStatus});
    }
})


function projectCompletionShow(event) {
    let buttonHTML = event.target;
    let singleProjectHTML = buttonHTML.parentNode.parentNode.parentNode;
    let allBookingsContainerHTML = singleProjectHTML.parentNode.parentNode;
    let bookingID = singleProjectHTML.lastChild.value;

    if(allBookingsContainerHTML.className !== 'booking-section-container'){
        allBookingsContainerHTML = allBookingsContainerHTML.parentNode;
    }
    let bookingCompletionHTML = allBookingsContainerHTML.nextSibling;
    $(bookingCompletionHTML.firstChild.firstChild.childNodes[1].firstChild.lastChild.firstChild).val('');
    $(bookingCompletionHTML.firstChild.firstChild.lastChild).val(bookingID);
    $(bookingCompletionHTML).show();

    bookingCompletionHTML = bookingCompletionHTML.firstChild.firstChild;
    let indexToShow, indexToHide;
    if(buttonHTML.className === 'freelancer-booking-finish-button'){
        indexToShow = 1;
        indexToHide = 0;
    }else if(buttonHTML.className === 'freelancer-booking-delete-button'){
        indexToShow = 0;
        indexToHide = 1;
    }
    $(bookingCompletionHTML.childNodes[indexToShow]).hide();
    $(bookingCompletionHTML.childNodes[indexToHide]).show();
}


// Cancel the process
$(document).on('click', '.project-finish-cancel', function(event) {
    $('.freelancer-booking-completion-rejection').hide();
})

$(document).on('click', '.project-cancellation-cancel', function(event) {
    $('.freelancer-booking-completion-rejection').hide();
})

// Continue with the process
$(document).on('click', '.project-finish-continue', function(event) {
    let bookingFinishID = event.target.parentNode.parentNode.
        parentNode.lastChild.value;
    socketConnection.socket.emit('Project Completion Finish',
        {bookingFinishID: bookingFinishID});
})

$(document).on('click', '.project-cancellation-continue', function(event) {
    let bookingModaldeletion = event.target.parentNode.parentNode;
    let deletionReason = bookingModaldeletion.firstChild.lastChild.firstChild.value;
    let projectToCancelID = bookingModaldeletion.nextSibling.value;
    let clientThatBooked = projectToCancelID.split(':')[0];
    let minimumLength = 1; //100;

    if( deletionReason.length >= minimumLength ){
        socketConnection.socket.emit('Ongoing Project Cancel - Freelancer',
            {projectToCancelID, clientThatBooked});
    }
})