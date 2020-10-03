import * as accountsOperation from './account_operate.js';

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
})
$(document).click(function (event) {
    let elementClicked = event.target;

    if(elementClicked.className === 'addProfilePicture'){
        let pageToGo = clientsectionNames[1];
        accountsOperation.pageDispalyStyle(pageToGo, clientsectionNames,
            clientProfileSections);
    }
})

/*
* The following codes deal with the changes and display of the profile
* of the client
* */
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
    formData.append('client_profile_picture', saved_clientProfile);

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

/*
import { generalInfos_checker, profilePictureChecker,
    passworChecker } from './frontUserDetails_checker.js';


function errorMessage_delete(containerHtml, button_className) {
    $(containerHtml).click(function (event) {
        let item = event.target;
        item.parentElement.remove();
    })
}

function updatePageErrorHandle(error) {
    error.forEach(error_message=>{
        errorMessage_creation(error_message.message);
    })
    errorMessage_delete('.single-error',
        'update-error-delete-btn');
}

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
    $('.client-update-form-errors').append(container);
}

function arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = [].slice.call(new Uint8Array(buffer));
    bytes.forEach(b => binary += String.fromCharCode(b));
    return window.btoa(binary);
};

*//*
$('#client-profile-update-form').submit(function (event) {
    event.preventDefault();
    console.log('Client ajax call');

    $('.client-update-form-errors')[0].childNodes.forEach(singleChild=>{
        if(singleChild.nodeType !==8 ){
            singleChild.remove()
        }
    })

    let form_data = new FormData();

    let saved_clientProfile = $('#client-profile-picture')[0].files[0];
    let data = $('#client-profile-update-form').serializeArray().reduce(function(obj, item) {
        obj[item.name] = item.value;
        return obj;
    }, {});
    let general_errors = generalInfos_checker(data.client_name, data.client_surname, data.client_phone_number);
    let picture_erros = profilePictureChecker(saved_clientProfile);
    let password_erros = passworChecker(data.client_new_password, data.client_confirm_password);


    if(general_errors.length>0 || picture_erros.length>0 || password_erros.length>0){
        if(general_errors.length>0){
            updatePageErrorHandle(general_errors);
        }
        if(picture_erros.length>0){
            updatePageErrorHandle(picture_erros);
        }
        if(password_erros.length>0){
            updatePageErrorHandle(password_erros);
        }
    }else{
        data.client_profile_picture= saved_clientProfile;

        for ( var key in data ) {
            form_data.append(key, data[key]);
        }

        $.ajax({
            type: 'PUT',
            enctype: "multipart/form-data",
            url: '/account/client/:this_user',
            data: form_data,
            contentType: false,
            processData: false,
            success: function (data) {
                console.log(data)
            },
            error: function (error) {
                throw error;
            }
        })
    }
})
*/