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
var {ensureAuthentication} = require('../bin/authentication');
var {base64ToImageSrc, arrayBufferToBase64} = require('../bin/imageBuffer');

// Set Storage Engine
//destination: './public/images/uploads',
let storage = multer.diskStorage({
    filename: function (req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now()
            + path.extname(file.originalname));
    }
});

let multerFreelancerData = multer({
    storage: storage
}).single('freelancer_profile_picture');

let multerClientData = multer({
    storage: storage
}).single('client_profile_picture');


router.get('/', ensureAuthentication, function (req, res) {
    console.log('I am inside the account function')
    req.flash('error_message', 'Please login to access your account');
    res.redirect('/users/login');
});

router.get('/client/:this_user', ensureAuthentication , (req, res)=>{

    let user = req.user;
    let clientImage = '';

    if(user.profile_picture.data){
        if(user.profile_picture.name === 'oauth_picture'){
            clientImage = user.profile_picture.data.toString();
        }else{
            clientImage = base64ToImageSrc(user.profile_picture);
        }
    }

    res.render('account_client', {
        user: user,
        isLogged:req.isAuthenticated(),
        userStatus: req.user.user_stature,
        userEmail_encoded: req.params.this_user,
        clientImage: clientImage
    });
})

router.get('/freelancer/:this_user', function (req, res) {
    let user = req.user;
    let freelancerImage = '';
    if(user.profile_picture.data){
        if(user.profile_picture.name === 'oauth_picture'){
            freelancerImage = user.profile_picture.data.toString();
        }else{
            freelancerImage = base64ToImageSrc(user.profile_picture);
        }
    }

    res.render('account', {
        user: user,
        isLogged:req.isAuthenticated(),
        userStatus: req.user.user_stature,
        userEmail_encoded: req.params.this_user,
        freelancerImage: freelancerImage
    });
});

// client information update
router.put('/client/update', ensureAuthentication, multerClientData, async function (req, res) {
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

        if(upgradeUser.profile_picture.data){
            if(upgradeUser.profile_picture.name === 'oauth_picture'){
                this_object.profileImageSrc = upgradeUser.profile_picture.data.toString();
            }else{
                this_object.profileImageSrc = base64ToImageSrc(upgradeUser.profile_picture);
            }
        }

        upgradeUser.save(function (error) {
            if (error) throw error;
            else{
                res.json(this_object);
            }
        });
     }
})


// freelancer information update
router.put('/freelancer/update', ensureAuthentication, multerFreelancerData, async function (req, res) {

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

        if(upgradeFreelancer.profile_picture.data){
            if(upgradeFreelancer.profile_picture.name === 'oauth_picture'){
                freelancerObject.profileImageSrc = upgradeFreelancer.profile_picture.data.toString();
            }else{
                freelancerObject.profileImageSrc = base64ToImageSrc(upgradeFreelancer.profile_picture);
            }
        }

        upgradeFreelancer.save(function (error) {
            if (error) throw error;
            else{
                res.json(freelancerObject);
            }
        });
    }
});

module.exports = router;