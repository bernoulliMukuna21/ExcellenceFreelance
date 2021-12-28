/*
    * Author: Bernoulli Mukuna
    * created: 10/05/2020
*/
var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
var UpdateProfileChecker = require('../public/javascripts/profileUpdateController');
var UserModel = require('../models/UserModel');
var BookingModel = require('../models/BookingModel');
var { ensureAuthentication } = require('../bin/authentication');
var { emailEncode, emailDecode } = require('../bin/encodeDecode');
var { base64ToImageSrc, imageToDisplay } = require('../bin/imageBuffer');
var { stripeFindCustomerByEmail, stripeCustomerSubscription } = require('../bin/stripe-config');
var { numberOfDaysSince } = require('../bin/general-helper-functions');

// Set Storage Engine
//destination: './public/images/uploads',
let storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now()
            + path.extname(file.originalname));
    }
});

let multerUserProfilePicture = multer({
    storage: storage
}).single('user_profile_picture');


router.get('/', ensureAuthentication, function (req, res) {
    console.log('I am inside the account function')
    req.flash('error_message', 'Please login to access your account');
    res.send(req.user)//res.redirect('/users/login');
});

router.get('/client/:this_user', ensureAuthentication , async (req,
                                                               res) => {
    let loggedInUser = req.user;
    let loggedInUser_imageSrc = '';

    /* The following variables are used to help with the messasging setup
    * for two users. 'messageIdHTML' signals that there is an initiation of
    * the message from another user, so we have to show the message section in
    * the HTML. 'userToMessage' is the unique of the user to message.
    * */
    let userToMessage, userToMessageUniqueKey, userToMessageImageSrc, messageIdHTML;
    let booking_id, newBookingDetails;

    // Get the picture of the current logged in client
    loggedInUser_imageSrc = imageToDisplay(loggedInUser);

    // Messaging setup
    userToMessageUniqueKey = req.query.receiverKey;

    if (userToMessageUniqueKey) {
        try {
            userToMessage = await UserModel.find({
                email: emailDecode(userToMessageUniqueKey)}
            );
            if (userToMessage){
                userToMessage = userToMessage[0];
                userToMessageImageSrc = imageToDisplay(userToMessage);
                messageIdHTML= 'show-user-messages';
            }
        } catch (error) {
            res.send('An Error occurred!');
        }
    }

    // Booking setup
    let clientIdFromURL = req.params.this_user;
    if(emailEncode(loggedInUser.email) === clientIdFromURL){
        BookingModel.aggregate([
            { $match: {
                    $and:
                        [
                            { 'customer.uuid': clientIdFromURL },
                            { $or:
                                    [
                                        { paid: true },
                                        { bookingType: 'request_booking' }
                                    ]
                            }
                        ]
                }
            },
            { $sort: { creationDate : 1} }
        ]).then( allBookings => {
            res.render('account_client', {
                loggedInUser,
                isLogged: req.isAuthenticated(),
                loggedInUser_imageSrc,
                allBookings,
                emailEncode,
                userToMessageUniqueKey,
                messageIdHTML,
                userToMessage,
                userToMessageImageSrc
            });
        }).catch (e => {
            res.send('An Error occurred!');
        })
    }
})

router.get('/freelancer/:this_user', async function (req, res) {
    let loggedInUser, freelancerUser;
    let userToMessage, userToMessageUniqueKey, userToMessageImageSrc, messageIdHTML;
    let freelancerSubscriptionStatus;
    let allBookingToFreelancer;

    let loggedInUser_imageSrc = '';
    let freelancerIdFromURL = req.params.this_user;
    let currentFreelancerEmail = emailDecode(freelancerIdFromURL);
    let stripeCustomer = await stripeFindCustomerByEmail(currentFreelancerEmail);
    let isLogged = req.isAuthenticated();


    if (isLogged) {
        loggedInUser = req.user;

        if(freelancerIdFromURL === emailEncode(loggedInUser.email)){

            // Message Initiation setup
            userToMessageUniqueKey = req.query.receiverKey;
            if (userToMessageUniqueKey) {
                try{
                    userToMessage = await UserModel.find({
                        email: emailDecode(userToMessageUniqueKey)}
                    );
                    if(userToMessage){
                        userToMessage = userToMessage[0];
                        userToMessageImageSrc = imageToDisplay(userToMessage);
                        messageIdHTML = 'show-user-messages'
                    }
                }catch (e) {
                    res.send('An Error occurred!');
                }
            }

            // Booking Made to Freelancer retrieval
            try{
                ///allBookingToFreelancer = await BookingModel.find({'supplier.uuid': freelancerIdFromURL});
                allBookingToFreelancer = await BookingModel.aggregate(
                    [
                        { $match:
                                {
                                    $and:
                                        [
                                            { 'supplier.uuid': freelancerIdFromURL },
                                            { $or:
                                                    [
                                                        { paid: true },
                                                        { bookingType: 'request_booking' }
                                                    ]
                                            }
                                        ]
                                }
                        },
                        { $sort: { dueDateTime : 1} }
                    ]
                )
            }catch (e) {
                res.send('An Error occurred!');
            }

            console.log(allBookingToFreelancer)
        }


    }
    try {
        freelancerUser = await UserModel.find({email: currentFreelancerEmail});
        freelancerUser = freelancerUser[0];

        loggedInUser_imageSrc = imageToDisplay(freelancerUser);

        let numberOfDays = numberOfDaysSince(freelancerUser.date, new Date());
        if(!stripeCustomer){
            /* The freelancer has never made a booking nor subscribed
             In this case, we keep track of the number of days that
             they have been on the site. */
            if(numberOfDays <= 3000){
                /* Although they are yet to make any payment on the website.
                As a freelancer, they have a 30 days free trial before they
                are start being charged for being on the website. */
                freelancerSubscriptionStatus = 'trialing';
            }
        }else{

            let stripeCustomerSub = await stripeCustomerSubscription(stripeCustomer.id);

            if(!stripeCustomerSub){
                /* The freelancer has made a booking on the website before
                * but is yet to subscribe. Similarly, even though the users
                * are yet to subscribe, they have a 30 days trial period. */

                if(numberOfDays <= 3000){
                    freelancerSubscriptionStatus = 'trialing';
                }
            }
            else{
                /* The freelancer is subscribed to the website. Now, we need
                * to check what is their subscription status. */
                freelancerSubscriptionStatus = stripeCustomerSub.data[0].status;
            }
        }

        res.render('account', {
            isLogged, // The user accessing this page is logged in?
            freelancerUser, // The freelancer - profile owner
            loggedInUser, // Details of the logged in user
            loggedInUser_imageSrc,
            emailEncode,
            imageToDisplay,
            userToMessageUniqueKey,
            messageIdHTML,
            userToMessage,
            userToMessageImageSrc,
            freelancerSubscriptionStatus,
            numberOfDays,
            allBookingToFreelancer
        });
    }catch (e) {
        res.send('An Error occurred!');
    }
});

// client information update
router.put('/client/update', ensureAuthentication, multerUserProfilePicture, async function (req, res) {
    console.log('Inside client put function');
    let clientInformationChecker = new UpdateProfileChecker(req.user, req.body,
        req.file, 'client');

    let updateInfos = await clientInformationChecker.checkLoginStrategyAndReturnInformation();

    if(Object.keys(updateInfos.updateErrors).length>0){
        /*
        * If the object of the errors is bigger than 0, the update form
        * contains some errors.
        * */

        res.status(404).send(Object.values(updateInfos.updateErrors));

    }else{
        /*
        * When there are no errors, the next thing that happens is updating
        * the database for the using the user's current details.
        * */

        let upgradeUser = updateInfos.updateUser;
        let this_object = JSON.stringify(upgradeUser);
        this_object = JSON.parse(this_object);
        this_object.profileImageSrc = imageToDisplay(upgradeUser);

        upgradeUser.save(function (error) {
            if (error) throw error;
            else{
                res.json(this_object);
            }
        });
    }
})

// freelancer information update
router.put('/freelancer/update', ensureAuthentication, multerUserProfilePicture, async function (req, res) {

    let freelancerInformationChecker = new UpdateProfileChecker(req.user, req.body,
        req.file, 'freelancer');

    let updateInfos = await freelancerInformationChecker.checkLoginStrategyAndReturnInformation();
    if(Object.keys(updateInfos.updateErrors).length>0){
        /*
        * If the object of the errors is bigger than 0, the update form
        * contains some errors.
        *  */

        res.status(404).send(Object.values(updateInfos.updateErrors));


    }else{
        /*
        * When there are no errors, the next thing that happens is updating
        * the database for the using the user's current details.
        * */
        let upgradeFreelancer = updateInfos.updateUser;
        let freelancerObject = JSON.stringify(upgradeFreelancer);
        freelancerObject = JSON.parse(freelancerObject);
        freelancerObject.profileImageSrc = imageToDisplay(upgradeFreelancer);

        upgradeFreelancer.save(function (error) {
            if (error) throw error;
            else{
                res.json(freelancerObject);
            }
        });
    }
});

module.exports = router;