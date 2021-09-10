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

    // on page load, if the intention is to message another user,
    // the following code helps to initiate the conversation.
    let clientMessage_pageToGo = clientsectionNames[2];
    if(clientMessage_pageToGo.id === 'show-user-messages'){
        accountsOperation.pageDispalyStyle(clientMessage_pageToGo, clientsectionNames,
            clientProfileSections);
    }
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

export function parameters() {
    return $('.client-account-middle')[0].childNodes;
}


