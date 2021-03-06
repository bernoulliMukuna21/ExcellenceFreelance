/*
* The following lines of codes ae functions that will help with hiding and
* showing clicked page sections(e.g. messages, main profile page, update
* information) on both the client and freelancer section.
* */
function pageNavigation(pageToShow, name_of_pages, different_pages){
    /*
    * This function is used to show the clicked page section.
    * **/

    name_of_pages.each(function(index, div_element){
        $(this).removeClass("clicked");
        if(div_element.innerText !== pageToShow.innerText){
            $(different_pages[index]).hide();
        }else{
            $(different_pages[index]).show();
        }
    });
}

function pageDispalyStyle(page, name_of_pages, different_pages){
    /*
    * This function will first call the function that handles the
    * display of the clicked page. One thing that needs to happen
    * also is that a 'clicked' needs to be added to clicked page
    * section. This will be handled in this function.
    *       Params:
    *           - page: The name of the page section to show
    *           - name_of_pages: The names of all the page sections
    *           - different_pages: The content of each of the pages
    * */

    pageNavigation(page, name_of_pages, different_pages);
    $(page).addClass("clicked");
}



/*
* In both, the client and the freelancer profile pages, the users have
* the opportunity to display their profile picture. There is a upload
* button on each of their pages. The following section is used to help
* uplaod a profile picture from a user local computer and displaying it.
* */

function readURL(input, imageHtml){
    /*
    * This function is used to upload and display file images
    * from the user.
    *       Params:
    *           - input: The input file that contains the image file
    *           - imageHtml: the section to display the image
    * */

    if(input.files && input.files[0]){

        let reader = new FileReader();
        reader.onload = function(e){

            // in the following, the file directory is added to
            // the image source for display
            $(imageHtml).attr('src', e.target.result);
            $(imageHtml).show();
        }
        reader.readAsDataURL(input.files[0])
    }
}

function profileImageChange(inputHtml, imageHtml){
    /*
    * This function hears when there is a change on the
    * input file button. This means that a file has been
    * uploaded, then this file must be processed and shown
    * */

    $(inputHtml).change(function() {
        readURL(this, imageHtml);
    });
}

function profileImageEmpty(imageHtml){
    /*
    * It is possible for some users to not have images,
    * especially when they first join the website.
    * Therefore, the image container section must be
    * hidden.
    * */

    // get the source of the image
    let source_image = $(imageHtml).attr('src');
    if(source_image.length<=0){
        // The source image is returned as a string. If it is
        // empty, then there are images to display, so hide.

        $(imageHtml).hide();
    }
}

/*
* The following section provides functions that will help with
* collecting data from the profile update forms of the client
* and the freelancer. As collecting the form data, in this
* section, the functions that will help with the submission
* of those forms are also included.
* */

function dataCollection(formHtml){
    /*
    * In this function, the data of the input form will be
    * collected. Not all of the data are collected because
    * some of them need a different way of collection.
    *       Params:
    *           - formHtml: the class or id of the form for
    *               profile update.
    * */

    let form_data = new FormData();
    let data = $(formHtml).serializeArray().reduce(function(obj, item) {
        obj[item.name] = item.value;
        return obj;
    }, {});

    for ( var key in data ) {
        form_data.append(key, data[key]);
    }

    return form_data
}
// Now, the following subsection will handle to display of the updated
// information.

function showNames(name, surname, htmlContainer){
    $(htmlContainer)[0].innerText = name + ' ' + surname;
}

function showServicesOrSkills(elements, htmlContainer) {
    elements.forEach(singleElement=>{
        let pageTag = document.createElement('p');
        pageTag.innerText = singleElement;
        $(htmlContainer).append(pageTag);
    });
}

function emptySkills(defaultText, htmlContainer) {
    let sectionTag = document.createElement('section');
    sectionTag.classList.add('default-skill');

    let pageTag = document.createElement('p');
    pageTag.id = 'addSkills';
    pageTag.innerText = defaultText;

    sectionTag.appendChild(pageTag);
    $(htmlContainer).append(sectionTag);
}

function countServices(htmlContainer){
    let allServices = $(htmlContainer).children().length;
    return allServices;
}

function showDescription(description, htmlContainer) {
    let pageTag = document.createElement('p');
    pageTag.innerText = description;
    $(htmlContainer).append(pageTag);
}
function emptyDescription(defaultText, htmlContainer) {
    let divContainer = document.createElement('div');
    divContainer.classList.add('default-description');

    let pageTag = document.createElement('p');
    pageTag.id = 'addDescription';
    pageTag.innerText = defaultText;
    
    divContainer.appendChild(pageTag);
    $(htmlContainer).append(divContainer);
}

function showPrice(price, htmlContainer) {
    let pricePage = document.createElement('p');
    pricePage.innerText = 'Minimum Price at ';
    let idiomaticTag = document.createElement('i');
    idiomaticTag.style.textDecoration = 'underline';
    idiomaticTag.innerText = '£ '+price;
    pricePage.append(idiomaticTag);
    $(htmlContainer).append(pricePage)
}

function showEducations(educations, htmlContainer) {
//Show the education of the freelancer here.
    educations.forEach(singleEducaton=>{
        let educationSection = document.createElement('section');
        educationSection.classList.add('each-education');

        let degreePage = document.createElement('p');
        degreePage.innerText = singleEducaton.degreeAndCourse;
        educationSection.appendChild(degreePage);

        let universityPage = document.createElement('p');
        universityPage.innerText = singleEducaton.institute;
        educationSection.appendChild(universityPage);

        let educationYearPage = document.createElement('p');
        educationYearPage.innerText = singleEducaton.educationYear;
        educationSection.appendChild(educationYearPage);

        $(htmlContainer).append(educationSection);
    })
}

function emptyEducation(defaultText, htmlContainer) {
    let sectionTag = document.createElement('section');
    sectionTag.classList.add('each-education');
    sectionTag.classList.add('default-education');

    let pageTag = document.createElement('p');
    pageTag.id = 'addEducation';
    pageTag.innerText = defaultText;

    sectionTag.appendChild(pageTag);
    $(htmlContainer).append(sectionTag);
}
/*
* General Helper Functions
* **/

function deleteItem(containerHtml, buttonHtml){
    /*
    * This function will be used to help delete added items
    *  such as education, services and skills.
    *           Params:
    *               - containerHtml: contains the information
    *               - buttonHtml: delete button
    * **/

    $(containerHtml).click(function (event) {
        event.preventDefault();
        let item = event.target; // listen to the clicked item

        if(item.classList[0] === buttonHtml){
            /*
            * If the clicked item is the delete button, then the user'
            * current information must be removed.
            * */

            let container = item.parentElement;
            if(buttonHtml === 'delete-aService-btn'){

                let numberOfServices = countServices(containerHtml);
                let parentOfContainer = container.parentElement;

                if(numberOfServices>1){
                    parentOfContainer.remove();
                }else{
                    $('.freelancer-update-infos').empty();
                    let errors = [[{label: 'updateError', message: 'Service cannot be empty!'}]];
                    ajaxFormMessage_generator(errors, '.freelancer-update-infos');
                    $("html, body").animate({ scrollTop: 0 }, "slow");
                    $('.single-update-container').delay(5000).hide(1000);
                }
            }
            else if(buttonHtml === 'update-error-delete-btn'){
                container.remove();
            }else{
                container.parentElement.remove();
            }
        }
    })
}

function keyBoardAction(containerHtml){
    /*
    * The following function is to prevent the automatic submission of the
    * update profile page when a user clicks on the Enter keyboard.
    * */
    $(containerHtml).keypress(function (event) {
        if(event.keyCode == 13) {
            event.preventDefault();
        }
    })
}

function ajaxUpdateMessage_creation(message, label, htmlContainer){
    /*
    * In this function, the error message from the update
    * form is taken and display for the user.
    * */

    // create error message container
    let container = document.createElement('div');
    container.classList.add('single-update-container');

    if(label === 'successMessage'){
        container.id = 'save-profile-success';
    }

    // create error message text
    let upgradeMessage = document.createElement('h4');
    upgradeMessage.innerText = message;

    // add possibility of user deleting the error message
    let delete_btn = document.createElement('p');
    delete_btn.classList.add('update-delete-btn');
    delete_btn.innerText = 'x';

    // add the error to their container
    container.appendChild(upgradeMessage);
    container.appendChild(delete_btn);

    // add the container to be display on the page
    $(htmlContainer).append(container);
}

function ajaxFormMessage_generator(dataJSON, htmlContainer){
    dataJSON.forEach(data=>{
        ajaxUpdateMessage_creation(data[0].message, data[0].label, htmlContainer);
    });
    deleteItem('.single-update-container', 'update-delete-btn');
}

export{pageDispalyStyle, pageNavigation, profileImageChange, profileImageEmpty,
    dataCollection, showNames, showServicesOrSkills, emptySkills, countServices,
    showDescription, emptyDescription, showPrice, showEducations, emptyEducation,
    deleteItem, keyBoardAction, ajaxFormMessage_generator}