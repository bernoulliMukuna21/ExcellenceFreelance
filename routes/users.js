/*
    * Author: Bernoulli Mukuna
    * created: 10/05/2020
*/
var express = require('express');
var bcrypt = require('bcryptjs');
var passport = require('passport');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var url = require('url');
var fs = require('fs');
var router = express.Router();
var formChecker = require('../public/javascripts/formChecker');
var UserModel = require('../models/UserModel');
var {forwardAuthentication} = require('../bin/authentication');
var {emailEncode, emailDecode} = require('../bin/encodeDecode');


/* GET users listing. */
router.get('/', function(req, res, next) {
    res.redirect('/users/login');
});

// ~~~~~~~~~~~~~~~~~ Excellence Freelancer users helper functions  ~~~~~~~~~~~~~~~~~~~

// The variable will be used to track if a user is signing up as client or freelancer
let userType_Oauth = {};

function loginSystem(req, res, user, userType, flash_message){
    console.log('Inside login system')
    /*
    * This function will be used for signing in users
    * Params:
    *       - user:
    *       - userType:
    * */

    // encode user email address
    let email_encoded = emailEncode(user.email);

    req.login(user, function (error) {
        if(error){
            res.render('error');
        }
        else{
            if(userType==='client'){
                // if sign up as a client, then direct to the homepage
                //'Welcome to Excellence.Freelancer.' +
                //                     ' Thank you for joining us!'
                req.flash('success_message', flash_message);
                res.redirect('/');
            }
            else if(userType==='freelancer'){
                res.redirect('/account/freelancer/'+email_encoded)
            }
        }
    });
}

// ~~~~~~~~~~~~~~~~~ Joining Excellence Freelance gets and posts ~~~~~~~~~~~~~~~~~~~

// get the join view page
router.get('/join', forwardAuthentication, function(req, res, next) {
    res.redirect('/users/join/client');
});

// get the join view page for freelances
router.get('/join/:userType', function(req, res, next) {
    let userType = req.params.userType;
    userType_Oauth.this_user = userType;
    console.log('I am inside here');
    res.render('joinFree', {userType: userType});
});

// Sign Up users to the database
router.post('/join/:userType', function (req, res) {
    let userType = req.params.userType;

    let {name, surname, email, password, password2} = req.body;
    let fields_errors = formChecker.passwordChecker(password, password2);

    if(fields_errors.length>0){
        // An error has occurred
        res.render('joinFree', {
            fields_errors,
            name,
            surname,
            email,
            password,
            password2,
            userType: userType
        });
    }else{
        // There are no error - proceed
        console.log('Searching in the database');
        UserModel.findOne({email:email})
            .then(user=>{
                if(user){
                    // The user is in the database
                    fields_errors = [{label:'user', message:'Email is already being used!'}]
                    res.render('joinFree',{
                        fields_errors,
                        name,
                        surname,
                        email,
                        password,
                        password2,
                        userType: userType
                    })
                }else{
                    //User is not in the database, so creat user
                    let newUser = new UserModel({name, surname, email, password,user_stature: userType});
                    // Save user in the database
                    newUser.save(function (err) {
                        if(err){
                            console.log(err);
                            res.send(err)
                        }
                        else{
                            let flash_message = `Welcome to Excellence.Freelancer, ${newUser.name} ${newUser.surname}.` +
                                ' Thank you for joining us!'
                            loginSystem(req, res, newUser, userType, flash_message);
                        }
                    });
                }
            })
            .catch(err=>res.render('error'))
    }
});

// ~~~~~~~~~~~~~~~~ Login gets and posts ~~~~~~~~~~~~~~~~~~

// get the view page for users to login
router.get('/login', forwardAuthentication, function(req, res, next) {
    res.render('login');
});

// Login User to the application
router.post('/login', (req, res, next)=>{
    UserModel.findOne({email:req.body.email})
        .then(user=>{
            passport.authenticate('local', (err, user, info)=>{
                if(typeof info === 'undefined'){
                    let flash_message = 'Hello, '+user.name + ' ' + user.surname + '. You are logge in!'
                    loginSystem(req, res, user, user.user_stature, flash_message);
                }
                else{
                    let errorMessage = '';
                    if(info.message === 'Not-registered'){
                        errorMessage = 'Email not Recognised. Please Try again!';
                    }
                    else if(info.message === 'facebook-google'){
                        errorMessage = 'Email is already being used. Please Try again!';
                    }
                    else if(info.message === 'incorrect-password'){
                        errorMessage = 'Password is not correct. Please Try again!';
                    }

                    req.flash('error_message', errorMessage);
                    res.redirect('back');
                }
            }
            )(req, res, next);
        })
});

// ~~~~~~~~~~~~~~~~ Logout gets and posts ~~~~~~~~~~~~~~~~~~

router.get('/logout', function (req, res) {
    req.logout();
    req.flash('success_message', 'You are logged out!');
    res.redirect('/users/login');
});

// ~~~~~~~~~~~~~~~~ Forgot Password gets and posts ~~~~~~~~~~~~~~~~~~

// get the view page for the email forgot of the user (Should probably be deleted)
router.get('/forgot', function (req, res, next) {
    res.render('forgot')
});

/*
* To send an email for resetting the password, the following codes creates a gmail
* transport.
* */
let smtpTransport = nodemailer.createTransport(
    {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        //service: 'gmail',
        auth:{
            //type: "login",
            type: 'OAuth2',
            user: 'mmbernoulli@gmail.com',
            clientId: process.env.google_clientID,
            clientSecret: process.env.google_secretID,
            refreshToken: process.env.google_refreshToken,
            accessToken: null,
            expires: 1484314697598
            //pass: '#Bonsomi96'
        },
        tls: { rejectUnauthorized: false }
    });
router.post('/forgot', function (req, res, next) {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                let token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            UserModel.findOne({
                email: req.body.email
            }, function (err, user) {
                if(!user){
                    req.flash('error_message', 'No account with that email address!');
                    return res.redirect('back');
                }

                if(user.authentication.authID){
                    req.flash('error_message',
                        'Email is signed as a Facebook or Google account. ' +
                        'Please Try a different way!');
                    return res.redirect('back');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000;
                user.save(function (err) {
                    done(err, token, user);
                })
            });
        }
        ,
        function (token, user, done) {
            let reset_link = "http://"+ req.headers.host+"/users/reset/"+ token;
            let mailOptions = {
                to: 'mukunabernoulli@yahoo.com',//req.body.email,
                from: 'mmbernoulli@gmail.com',
                subject: 'Password Reset',
                text: 'Hello World '+'\n' + 'Your Password needs changing',
                html: '<h1 style="color: #213e53; font-size: 1.1rem">Excellence.Freelance Password Reset</h1>'+
                    '<p> Your are receiving this email because you (or someone else) have' +
                    ' requested to reset the password of your account.<br><i> Please click the ' +
                    'following, or paste this into your browser to complete this process.</i>' +
                    '</p>' + '<a target="_blank" style="text-decoration: underline; color: #0645AD; cursor: pointer" ' +
                    'href="'+reset_link+'">'+reset_link+'</a><br><br>' + '<p style="font-weight: bold">'+
                    'If you did not request this, please ignore this email. (link expires in 1 hour)</p><br>' + '<p ' +
                    'style="margin-top: 5rem">Admnistration Team<br>07448804768</p>'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                req.flash('success_message', 'Your email has been sent')
                done(err, 'done');
            });
        }
    ], function (err) {
        if (err) return next(err);
        res.redirect('/users/forgot');
    })
})

// ~~~~~~~~~~~~~~~~ Password Reset gets and posts ~~~~~~~~~~~~~~~~~~

/* check the validity of the link sent to the link sent to the user's
* email. The link is only valid for an hour.
* */
router.get('/reset/:token', function (req, res) {
    UserModel.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {$gt: Date.now()}},
        function (err, user) {
        if(!user){
            req.flash('error_message', 'Passwod reset token is invalid or has expired.')
            return res.redirect('/users/forgot');
        }
        res.render('reset', {token: req.params});
        }
     );
});

/*
* In the post of the reset password, the password is updated into the database
* and then an email is sent back to the user to confirm the completion of this
* process.
* */
router.post('/reset/:token', function (req, res) {
    let rstPassword = req.body.password_reset,
        rstcPassword = req.body.password_confirm;
    let resetPassordError = formChecker.passwordChecker(rstPassword, rstcPassword);

    if(resetPassordError.length>0){
        // if the new Password do not match
        resetPassordError.forEach(input=>{
            req.flash('error_message', input.message)
        });
        return res.redirect('back');
    }

    async.waterfall([
        function (done) {
            UserModel.findOne({
                    resetPasswordToken: req.params.token,
                    resetPasswordExpires:{$gt: Date.now()}},
                function(err, user){
                    if(!user){
                        req.flash('error_message', 'Password reset token is invalid or has expired')
                        return res.redirect('/users/forgot');
                    }

                    user.password = rstPassword;
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;
                    console.log('I reach the stage before saving')
                    user.save(function(err){
                        if (err) throw err;
                        done(null, user);
                    })
                }
            )
        }, function (user, done) {
            let mailOptions = {
                to: user.email,
                from: 'mmbernoulli@gmail.com',
                subject: 'Password Reset',
                text: 'Password Successfully Updated. If you do not recognise this, Please contact us as' +
                    ' soon as possible on mmbernoulli@gmail.com or 07448804768'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                req.flash('success_message', 'Your email has been sent')
                done(err, 'done');
            });
            let flash_message = 'Password successfully Reset! Well done, ' + user.name + ' '+user.surname;
            loginSystem(req, res, user, user.user_stature, flash_message);
        }
    ],  function (err) {
        res.send('An error has occurred');
    });
});

// ~~~~~~~~~~~~~~~~ User Account ~~~~~~~~~~~~~~~~~~
// redirect user to the account url if they do come here
router.get('/account', function(req, res, next) {
    res.redirect('/account');
});

// ~~~~~~~ User OAuthentication: Facebook, Google, twitter and LinkendIn ~~~~~~~~

function passportUser(req, res, user, info, current_user){
    /*
    * This function is used to take appropriate actions based on
    * the information provided for the current user.
    *   params:
    *       - user: contains the details of a user
    *       - info: information for the user
    * */

    if(info.message===undefined){
        /*
        * If the information message is undefined, then the user
        * is not signed up yet. So, the following section
        * is for signing them up.
        * */

        let oauthProfilePicture = {
            name: 'oauth_picture',
            data: user.photos[0].value
        }

        let name = user.name;
        if(!name.familyName){name.familyName = ''};

        let newUser = new UserModel({
            name: name.givenName,
            surname: name.familyName,
            email: user.emails[0].value,
            profile_picture: oauthProfilePicture,
            authentication: user.authDetails,
            user_stature: current_user
        });

        newUser.save(function (err) {
            if(err){
                console.log(err);
                res.send(err)
            }
            else{
                let flash_message = `Welcome to Excellence.Freelancer, ${newUser.name} ${newUser.surname}.` +
                    ' Thank you for joining us!';
                loginSystem(req, res, newUser, current_user, flash_message);
            }
        });
    }

    else{
        if(info.message === 'socialN-account'){
            /*
            * The user account is already signed as social Network account
            * so, login
            * */
            let flash_message = 'Hello, '+user.name + ' ' + user.surname + '. You are logge in!'

            loginSystem(req, res, user, current_user, flash_message);
        }

        else if(info.message === 'email-required'){
            /*
            * This information is linked with Facebook accounts.
            * It is possible for a user to choose not to provide their
            * email address during the authentication process. When that
            * that happens the user must be redirect back to their facebook
            * to provide their email address.
            * */

            return res.redirect('/users/facebook-authentication/rerequest');
        }
        else if(info.message === 'email-in-use'){
            /*
            * The user email is already signed as local account
            * */

            let fields_errors = [{label:'socialN', message:'Social Network signup Failed - ' +
                    'Email is already being used. Please Login!'}]
            res.render('login', {fields_errors})
        }
        else{
            let fields_errors = [{label:'socialN', message:'Social Network signup Failed. ' +
                    'Please try again!'}]
            res.render('joinFree', {fields_errors})
        }
    }
}
//facebook authentication
router.get('/facebook-authentication', function(req, res, next){
    passport.authenticate(
        'facebook',
        {scope: [ 'email' ]}
    )(req,res,next)}
);

router.get('/facebook-authentication/callback', (req, res, next)=>{
    let current_user = 'client';
    if(userType_Oauth.this_user){
        current_user = userType_Oauth.this_user;
    }
    passport.authenticate('facebook', (err, user, info)=>{
        passportUser(req, res, user, info, current_user)
    })(req, res, next);
})

router.get('/facebook-authentication/rerequest',
    passport.authenticate('facebook', {
            scope: ['email'],
            authType: 'rerequest'
    })
);

// Google authentication
router.get('/google-authentication', passport.authenticate('google', {
    scope: [ 'profile', 'email' ]
}));

router.get('/google-authentication/callback', (req, res, next)=>{
    let current_user = 'client';
    if(userType_Oauth.this_user){
        current_user = userType_Oauth.this_user;
    }

    passport.authenticate('google', (err, user, info)=>{
        passportUser(req, res, user, info, current_user)
    })(req, res, next);
});

module.exports = router;



/*
res.redirect(url.format({
                    pathname: '/',
                    query: {
                        this_user: user.name+'.'+user.surname
                    }
                }))
*/
/*
        console.log('Inside callback authenticate')
        if (err) {
            if(err == 'email-required') res.redirect('/users/facebook-authentication/rerequest');
            else if(err == 'email-in-use'){
                let fields_errors = [{label:'facebook', message:'Facebook signup FAILED - ' +
                        'Email is already being used. PLease Login!'}]
                res.render('login', {fields_errors})
            }
            else{
                let fields_errors = [{label:'facebook', message:'Facebook signup Failed. ' +
                        'Please try again!'}]
                res.render('joinFree', {fields_errors})
            }
            return;
        }
        if (!user) {
            req.flash('error_message', 'Error Occurred! Please try again');
            return res.redirect('back');
        }
        else{

              If there are not any errors and the user is correctly returned,
             the next thing before logging them is to check if they will rather
             sign in as a freelancer. This behave is obtained from the url
             clicked to trigger this facebook authentication. The variable
             'current_user' contains this information

             /*if(current_user === 'freelancer' && !user.user_stature){
                user.user_stature = 'freelancer';
                user.save(function (err) {
                    if(err) throw err;
                })
            }
}
    req.logIn(user, function(err) {
        if (err) { next(err); }
        else if(current_user === 'client'){
            req.flash('success_message', 'Welcome to Excellence.Freelancer.' +
                ' Thank you for joining us!');
            res.redirect(url.format({
                pathname: '/',
                query: {
                    this_user: user.name+'.'+user.surname
                }
            }))
        }
        else if(current_user === 'freelancer'){
            res.redirect('/account/freelancer/'+user.name+'.'+user.surname)
        }
    });
}*/

/* if(err){
     if(err=='email-in-use'){
         let fields_errors = [{label:'facebook', message:'Google signup FAILED - ' +
                 'Email is already being used. PLease Login!'}]
         res.render('login', {fields_errors})
     }
     else{
         let fields_errors = [{label:'facebook', message:'Facebook signup Failed. ' +
                 'Please try again!'}]
         res.render('joinFree', {fields_errors})
     }
     return;
 }

 if (!user) {
     req.flash('error_message', 'Error Occurred! Please try again');
     return res.redirect('back');
 }

 else{

     if(current_user === 'freelancer' && !user.user_stature){
         user.user_stature = 'freelancer';
         user.save(function (err) {
             if(err) throw err;
         })
     }

     req.logIn(user, function(err) {
         if (err) { return next(err); }
         else if(current_user === 'client'){
             req.flash('success_message', 'Welcome to Excellence.Freelancer.' +
                 ' Thank you for joining us!');
             res.redirect(url.format({
                 pathname: '/',
                 query: {
                     this_user: user.name+'.'+user.surname
                 }
             }))
         }
         else if(current_user === 'freelancer'){
             res.redirect('/account/freelancer/'+user.name+'.'+user.surname)
         }
     });
 }*/