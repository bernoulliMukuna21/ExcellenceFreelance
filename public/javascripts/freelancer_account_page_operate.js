import * as accountsOperation from './account_operate.js';
import {ajaxFormMessage_generator} from "./account_operate.js";
/*
* The sections of the freelancer page will need to be hidden, and shown
* only the one that the user has clicked on. The 'main profile information'
* will be the default once the page has loaded.
* */
let freelancerProfileSections = $('.freelancer_account_main_side')[0].childNodes;
let freelancersectionNames = $('.account-profile-information ul li');;

$(document).ready(function(){
    $(freelancersectionNames).click(function(){
        accountsOperation.pageDispalyStyle(this, freelancersectionNames, freelancerProfileSections);
    });
    $('.freelancer-update-infos').empty();
});
$(document).click(function (event) {
    let elementClicked = event.target;

    if(elementClicked.className === 'addProfilePicture'|| elementClicked.id == 'addDescription'
        || elementClicked.id == 'addSkills' || elementClicked.id == 'addEducation'
        || elementClicked.id == 'addService' || elementClicked.id == 'addPrice'){
        let pageToGo = freelancersectionNames[1];
        accountsOperation.pageDispalyStyle(pageToGo, freelancersectionNames,
            freelancerProfileSections);
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

    let singleValue = $(inputIdName+ ' input').val();
    $(inputIdName+ ' input').css('border-color', 'lightgrey');

    if(!singleValue){
        $(inputIdName+ ' input').css('border-color', 'red');
    }
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
        singleName_html.innerText = singleValue;
        showDiv.appendChild(singleName_html);

        let removeButton = document.createElement('button');
        removeButton.classList.add(deleteButton);
        removeButton.innerText = 'x';
        showDiv.appendChild(removeButton);

        // Hide ChildNodes
        let input_html = document.createElement('input');
        input_html.type = 'text';
        input_html.name = inputHtmlName;
        input_html.value = singleValue;
        input_html.readOnly = true;
        hideDiv.appendChild(input_html);

        // Make the single container
        containerDiv.appendChild(showDiv);
        containerDiv.appendChild(hideDiv);
        $(containerHtml).append(containerDiv);

        $(inputIdName+ ' input').val('');
    }
}

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


// services
$('#add-services-btn').click(function (event) {
    event.preventDefault();

    serviceAndSkill('#userBioServices', 'single-service',
        'delete-aService-btn', '.saved-service', 'shown-service',
        'hidden-service', 'services');
})
// Add the possibility of freelancer deleting their services
accountsOperation.deleteItem('.saved-service',
    'delete-aService-btn');


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
    console.log('Freelancer profile update profile submission');
    let freelancerErrorInfos = '.freelancer-update-infos';

    $(freelancerErrorInfos).empty();

    // Collect the data of the update profile form
    let formData = accountsOperation.dataCollection(this);

    // Get the profile picture uploaded by the freelancer
    let saved_profilePicture = $('#freelancer-profile-picture')[0].files[0];
    formData.append('freelancer_profile_picture', saved_profilePicture);

    formData.append('saved_educations', getInputValues('.saved-education'));
    formData.append('saved_services', getInputValues('.saved-service'));
    formData.append('saved_skills', getInputValues('.saved-skill'));

    $.ajax({
        type: 'PUT',
        enctype: 'multipart/form-data',
        url: '/account/freelancer/update',
        data: formData,
        contentType: false,
        processData: false,
        success: function (data) {
            console.log(data)
            /********* display the updated profile picture of the freelancer *********/
            $('.account-profile-image img').attr('src',
                data.profileImageSrc);

            /********* display names of the freelancer *********/
            accountsOperation.showNames(data.name, data.surname,
                '.account-profile-name');

            /******** display services and skills of the freelancer ********/
            /*
            * The service cannot be empty, therefore, all the
            * children under the section that the service can
            * be hidden to show the updated services.
            */
            $('.freelancer-services').children().hide();
            accountsOperation.showServicesOrSkills(data.service,
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
                accountsOperation.showServicesOrSkills(data.skill,
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

            // display the price of the service of the freelancer
            $('.price-information').children().hide();
            accountsOperation.showPrice(data.price,
                '.price-information');


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
            console.log(errors);
            accountsOperation.ajaxFormMessage_generator(errors, freelancerErrorInfos);
            $("html, body").animate({ scrollTop: 0 }, "slow");
        }
    })
})

/*
* General Page Variables and Functions
* */
/*
import { generalInfos_checker, profilePictureChecker,
    passworChecker, otherFiels_checker } from './frontUserDetails_checker.js';

var href = document.location.href;
let current_view_page = href.split('/')[4];
let different_pages, name_of_pages;

if(current_view_page !== 'client'){
    console.log('working with freelancer')
    // Freelancer Page
    different_pages = $('.freelancer_account_main_side')[0].childNodes;
    name_of_pages = $('.account-profile-information ul li');
}
else{
    console.log('Working with client')
    // Client Page
    different_pages = $('.client-account-middle')[0].childNodes;
    name_of_pages = $('.client-account-left ul li');

    console.log(different_pages)
    console.log(name_of_pages)
}

function pageNavigation(pageToShow){
    name_of_pages.each(function(index, div_element){
        $(this).removeClass("clicked");
        if(div_element.innerText !== pageToShow.innerText){
            $(different_pages[index]).hide();
        }else{
            $(different_pages[index]).show();
        }
    });
}
function pageDispalyStyle(page){
    pageNavigation(page);
    $(page).addClass("clicked");
}

function DeleteItem(containerHtml, button_className){
    $(containerHtml).click(function (event) {
        let item = event.target;

        if(item.classList[0] === button_className){
            event.preventDefault();
            /*let container = item.parentElement;
            container.parentElement.remove();
        }
    })
}
*/
/*
function errorMessage_delete(containerHtml, button_className) {
    $(containerHtml).click(function (event) {
        let item = event.target;
        item.parentElement.remove();
    })
}

function keyBoardAction(idContainerName){
    $(idContainerName).keypress(function (event) {
        if(event.keyCode == 13) {
            event.preventDefault();
        }
    })
}
keyBoardAction('.user-general-information-three');
keyBoardAction('.user-general-information-two');
keyBoardAction('.user-general-information-one');

$(document).ready(function(){
    if(current_view_page !== 'client'){
        let mainPageId = $('.main-account-page').attr('id');
        if(typeof mainPageId === 'undefined'){
            // This is a new user

            let updatePage = $('.account-profile-information ul li')[1];
            pageDispalyStyle(updatePage);
            $('.freelancer_account_left_side').css('pointer-events', 'none');

            let updateMssgDiv = document.createElement('div');
            updateMssgDiv.classList.add('single-error');
            updateMssgDiv.setAttribute('id', 'updateInformation');

            let updateMessage = document.createElement('h4');
            updateMessage.innerText = 'Fill to Become Freelancer: - Service and Price cannot be empty!'

            let delete_btn = document.createElement('p');
            delete_btn.classList.add('.update-error-delete-btn');
            delete_btn.style.cursor = "pointer";
            delete_btn.innerText = 'x';

            updateMssgDiv.appendChild(updateMessage);
            updateMssgDiv.appendChild(delete_btn);
            $('.update-form-errors').append(updateMssgDiv);

            errorMessage_delete('.single-error', 'update-error-delete-btn');

        }else{
            $(name_of_pages).click(function(){
                pageDispalyStyle(this);
            });
        }
    }else{
        $(name_of_pages).click(function(){
            pageDispalyStyle(this);
        });
    }

});

/*
* Move to Update Information when sections of main are empty
* */
/*
$(document).click(function(event) {
    let element_Clicked = event.target;
     if(element_Clicked.id === 'addProfilePicture' || element_Clicked.id == 'addDescription'
        || element_Clicked.id == 'addSkills' || element_Clicked.id == 'addEducation'
         || element_Clicked.id == 'addService' || element_Clicked.id == 'addPrice'){

        let pageToGo = name_of_pages[1];
        pageDispalyStyle(pageToGo);
    }
});
*/
/*
*  Profile image Preview client and freelancer
* */
/*
function readURL(input, imageHtml){
    if(input.files && input.files[0]){

        let reader = new FileReader();
        reader.onload = function(e){
            //'#imagePreview'
            $(imageHtml).attr('src', e.target.result);
            $(imageHtml).show();
        }
        reader.readAsDataURL(input.files[0])
    }
}
function profileImageChange(inputHtml, imageHtml){
    $(inputHtml).change(function() {
        readURL(this, imageHtml);
    });
}
function profileImageEmpty(imageHtml){
    let source_image = $(imageHtml).attr('src');
    if(source_image.length<=0){
        $(imageHtml).hide();
    }
}
profileImageChange("#client-profile-picture", '#client-imagePreview')
profileImageEmpty('#client-imagePreview')

profileImageChange("#freelancer-profile-picture", '#imagePreview')
profileImageEmpty('#imagePreview')
*/
/*
*  Add Education
* */
/*
$('.input-group-btn').click(function (event) {
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
DeleteItem('.saved-education', 'education-delete-btn');
*/
/*
* Adding Skills and Services for the Freelancer
* */
/*
function serviceAndSkill(inputIdName, singleClassName, deleteButton, containerHtml, showClass, hideClass, inputHtmlName){
    let singleValue = $(inputIdName+ ' input').val();
    $(inputIdName+ ' input').css('border-color', 'lightgrey');

    if(!singleValue){
        $(inputIdName+ ' input').css('border-color', 'red');
    }
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
        singleName_html.innerText = singleValue;
        showDiv.appendChild(singleName_html);

        let removeButton = document.createElement('button');
        removeButton.classList.add(deleteButton);
        removeButton.innerText = 'x';
        showDiv.appendChild(removeButton);

        // Hide ChildNodes
        let input_html = document.createElement('input');
        input_html.type = 'text';
        input_html.name = inputHtmlName;
        input_html.value = singleValue;
        input_html.readOnly = true;
        hideDiv.appendChild(input_html);

        // Make the single container
        containerDiv.appendChild(showDiv);
        containerDiv.appendChild(hideDiv);
        $(containerHtml).append(containerDiv);

        $(inputIdName+ ' input').val('');
    }
}

// skills
$('#add-skills-button').click(function (event) {
    event.preventDefault();

    serviceAndSkill('#userBioSkills', 'single-skill',
        'delete-aSkill-btn','.saved-skill', 'show-skill',
        'hidden-skill', 'skills');
});

// services
$('#add-services-btn').click(function (event) {
    event.preventDefault();

    serviceAndSkill('#userBioServices', 'single-service',
        'delete-aService-btn', '.saved-service', 'shown-service',
        'hidden-service', 'services');
})

DeleteItem('.saved-skill', 'delete-aSkill-btn');
DeleteItem('.saved-service', 'delete-aService-btn');
*/
/*

// Update Information Submit

function errorMessage_creation(message) {
    let container = document.createElement('div');
    container.classList.add('single-error');

    let errorTitle = document.createElement('h4');
    errorTitle.innerText = message;

    let delete_btn = document.createElement('p');
    delete_btn.classList.add('update-error-delete-btn');
    delete_btn.innerText = 'x';

    container.appendChild(errorTitle);
    container.appendChild(delete_btn);
    $('.update-form-errors').append(container);
}

function updatePageErrorHandle(error) {
    error.forEach(error_message=>{
        errorMessage_creation(error_message.message);
    })
    errorMessage_delete('.single-error',
        'update-error-delete-btn');
}

function getInputValues(mainContainerHtml){
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

function arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = [].slice.call(new Uint8Array(buffer));
    bytes.forEach(b => binary += String.fromCharCode(b));
    return window.btoa(binary);
};

$('.update-general-information').submit(function (event) {
    event.preventDefault();
    console.log('The Ajax call is made');
    
    // The chaneg of style of the update information page happens here

    $('.update-form-errors')[0].childNodes.forEach(singleChild=>{
        if(singleChild.nodeType !==8 ){
            singleChild.remove()
        }
    })
    
    let data = new FormData();

    // Get the Profile Picture File
    let saved_profilePicture = $('#freelancer-profile-picture')[0].files[0];

    // Get all the Educations of the freelancer
    let saved_educations = getInputValues('.saved-education');

    // Get all the services of the freelancer
    let saved_services = getInputValues('.saved-service');

    // Get all the skills of the freelancer
    let saved_skills = getInputValues('.saved-skill');


    let saved_name = $('#name').val();
    let saved_surname = $('#surname').val();
    let saved_email = $('#email').val();
    let saved_phoneNumer = $('#phone-number').val();
    let saved_oldPassword = $('#old-password').val();
    let saved_newPassword = $('#new-password').val();
    let saved_newConfPassword = $('#new-repeat-password').val();
    let saved_price = $('#price').val();
    let saved_description = $('#freelancer_description').val();

    let general_errors = generalInfos_checker(saved_name, saved_surname, saved_phoneNumer);
    let picture_errors = profilePictureChecker(saved_profilePicture);
    let password_errors = passworChecker(saved_newPassword, saved_newConfPassword);
    let other_errors = otherFiels_checker(saved_price, saved_skills, saved_services, saved_educations);

    if(general_errors.length>0 || picture_errors.length>0
        || password_errors.length>0 || other_errors.length>0){
        // An error has occurred whilst updating freelancer information
        if(general_errors.length>0){
            updatePageErrorHandle(general_errors);
        }
        if(picture_errors.length>0){
            updatePageErrorHandle(picture_errors);
        }
        if(password_errors.length>0){
            updatePageErrorHandle(password_errors);
        }
        if(other_errors.length>0){
            updatePageErrorHandle(other_errors);
        }
    }else{
        // No error has occurred, information can be updated

        data.append('name', saved_name);
        data.append('surname', saved_surname);
        data.append('email', saved_email);
        data.append('phone_number', saved_phoneNumer);
        data.append('freelancer_profile_picture', saved_profilePicture);
        data.append('old_password', saved_oldPassword);
        data.append('new_password', saved_newPassword);
        data.append('newConfirm_password', saved_newConfPassword);
        data.append('freelanceEducation', saved_educations);
        data.append('price', saved_price);
        data.append('freelancer_description', saved_description);
        data.append('freelancerService', saved_services);
        data.append('freelancerSkill', saved_skills);

        $.ajax({
            type: 'PUT',
            enctype: 'multipart/form-data',
            url: '/account/freelancer/:this_user',
            data: data,
            contentType: false,
            processData: false,
            success: function (data) {
                let freelancerData = data;
                console.log(data)

                // display freelancer Profile Picture
                let profilePictureName = freelancerData.profile_picture.name;
                let profilePictureType = freelancerData.profile_picture.contentType;
                let profilePictureData = freelancerData.profile_picture.data;
                let profilePictureSrc = arrayBufferToBase64(profilePictureData.data)
                profilePictureSrc = 'data:' + profilePictureType + ';base64,' + profilePictureSrc;
                $('.account-profile-image img').attr('src', profilePictureSrc);

                // display updated freelancer names
                $('.account-profile-name')[0].innerText = freelancerData.name +
                    ' ' + freelancerData.surname;

                // display freelancer services
                freelancerData.service.forEach(singleService=>{
                    let servicePage = document.createElement('p');
                    servicePage.innerText = singleService;
                    $('.freelancer-services').append(servicePage);
                })

                // display freelancer description
                let descriptionPage = document.createElement('p');
                descriptionPage.innerText = freelancerData.description;
                $('.account-first-side').append(descriptionPage);

                // display freelancer skills
                freelancerData.skill.forEach(singleSkill=>{
                    let skillPage = document.createElement('p');
                    skillPage.innerText = singleSkill;
                    $('.user-account-skills section').append(skillPage);
                })

                // display freelancer price
                let pricePage = document.createElement('p');
                pricePage.innerText = 'Minimum Price at ';
                let priceTag = document.createElement('i');
                priceTag.style.textDecoration = 'underline';
                priceTag.innerText = '£'+freelancerData.price;
                pricePage.append(priceTag)
                $('.price-information').append(pricePage);

                // display freelancer education
                freelancerData.education.forEach(singleEducaton=>{
                    let educationPage = document.createElement('section');
                    educationPage.classList.add('each-education');

                    let degreeNamePage = document.createElement('p');
                    degreeNamePage.innerText =  singleEducaton.degreeAndCourse;
                    educationPage.appendChild(degreeNamePage);

                    let universityNamePage = document.createElement('p');
                    universityNamePage.innerText = singleEducaton.institute;
                    educationPage.appendChild(universityNamePage);

                    let educationYearPage = document.createElement('p');
                    educationYearPage.innerText = singleEducaton.educationYear;
                    educationPage.appendChild(educationYearPage);
                    $('.account-third-side').append(educationPage);
                })
            },
            error: function (error) {
                throw error;
            }
        })
    }
})
 */