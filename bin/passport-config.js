var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google-oauth2').Strategy;
var twitterStrategy = require('passport-twitter').Strategy;
var linkedinStrategy = require('passport-linkedin').Strategy;
var bcrypt = require('bcryptjs');
var ObjectId = require('mongodb').ObjectID;
var UserModel = require('../models/UserModel');

module.exports = function(passport) {

    // Local Passport Authentication
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {

            // Find User in the database
            UserModel.findOne({
                email: email
            }).then(user=>{
                if(!user){
                    // user email is not found in the database
                    return done(null, false, { message: 'Not-registered' });
                }
                // check if the email is linked to a facebook or google account
                if(user.email && user.authentication.authID){
                    return done(null, false, {message: 'facebook-google'});
                }

                user.comparePassword(password, (err, passwordMatch)=>{

                    if (err){
                        reject({
                            'status': 'Error',
                            'data': err
                        });
                        throw err;
                    }
                    if (passwordMatch){
                        return done(null, user);
                    }else{
                        return done(null, false, {message: 'incorrect-password'});
                    }
                })
            });
        })
    );

    /*#################  Oauth Helper function ##############*/
    function profileValidation(profile, done){
        /*
        * This function will be used to help do some basic checking of the profile
        * of the user facebook, google and other social accounts' details.
        * */

        if (profile.emails == undefined){
            // in case the user does not want to provide email
            // will return an error that will rerequest it

            return done(null, false, {message: 'email-required'});
        }

        let current_authentication =
            {
                authName: profile.idName,
                authID: profile.id
            };

        // Find the details of the user in the database
        UserModel.findOne({
            /*
            * The first step is to go through the database and find the following
            * unique details of the user: email and id (facebook or google)
            * */

            $or: [{
                email: profile.emails[0].value
            }, {
                authentication: current_authentication
            }]
        }).then(user=>{
            if(user === null){
                /*
                * if each of the details above of the user returns null, this means that
                * the current user is not registered. Then, the profile must be returned
                * */

                // add user social network details to the profile
                profile.authDetails = current_authentication;
                return done(null, profile);
            }
            else if(user.email){
                /*
                * Each user in the database (whether they signed up with any other
                * social accounts) has a unique email address. If the current user
                * returns an email adress, this means that they have already been
                * signed up. Therefore, further checkings are required.
                * */
                if(user.authentication.authID &&
                    user.authentication.authName === current_authentication.authName){
                    /*
                    * This current email is linked to a social network account
                    *  */

                    return done(null, user, {message: 'socialN-account'})
                }
                else{
                    /*
                    * This current email is not linked to any of the social account.
                    * However, this email has already been registered.
                    * */

                    return done(null, false, {message: 'email-in-use'});
                }
            }
        }).catch(error => done(null, false, {message: 'error'}))
    }

    // FacebookStrategy Passport Authentication
    passport.use(new FacebookStrategy({
            clientID: process.env.facebook_clientID,
            clientSecret: process.env.facebook_secretID,
            callbackURL: 'https://excellence-freelance.herokuapp.com/users/facebook-authentication/callback',
            profileFields: ['emails', 'name', 'displayName', 'photos']
        },
        function (accessToken, refreshToken, profile, done) {
            // introduce an id name here to be passed to the function
            profile.idName = 'facebook';
            let profilePicture = `https://graph.facebook.com/${profile.id}/picture?width=300&height=300&access_token=${accessToken}`;
            profile.photos[0].value = profilePicture;
            profileValidation(profile, done);
        })
    );

    //GoogleStrategy Passport Authentication
    passport.use(new GoogleStrategy({
        clientID: process.env.google_clientID,
        clientSecret: process.env.google_secretID,
        callbackURL: 'https://excellence-freelance.herokuapp.com/users/google-authentication/callback'
        },
        function (accessToken, refreshToken, profile, done) {
            profile.idName = 'google';
            profileValidation(profile, done);
        })
    );

    passport.serializeUser(function(user, done) {

        // setting id cookie
        // in the user's browser
        done(null, user._id);
    });

    passport.deserializeUser(function (id, done) {

        //  get the id from the cookie and use it to get user's information
        UserModel.findOne({_id: ObjectId(id)}, function (err, user) {
            done(err, user);
        });
    });
};







/*
    if (profile.emails == undefined){
        // in case the user does not want to provide email
        // will return an error that will rerequest it

        done('email-required');
        return;
    }

    UserModel.findOne({
        $or: [{
            email: profile.emails[0].value
        }, {
            facebook_id: profile.id
        }]
    }).then(user=>{
        if(user == null){
            // user facebook not registered yet

            // create an abject for saving the user facebook picture
            let facebookPicture = {
                name: 'facebook_picture',
                data_OAUTH: profile.photos[0].value
            }

            user = new UserModel({
                name: displayName[0],
                surname: displayName[1],
                email: profile.emails[0].value,
                profile_picture: facebookPicture,
                facebook_id: profile.id,
                user_stature: 'client'
            });

            user.save(function (err) {
                if(err){
                    done(err)
                }
                else{
                    done(null, user);
                }
            });
            }
            else if(user.email && user.facebook_id){
                // user's Facebook is register, so login
                return done(null, user)
            }

            else if(user.email){
                // user email is taken, so can log in
                return done('email-in-use');
            }
        }).catch(err=>{
            done(err)
        })*/


/*
            let name = profile.name;
            if(!name.familyName){
                name.familyName = ''
            }

            UserModel.findOne({
                $or: [{
                    email: profile.emails[0].value
                }, {
                    google_id: profile.id
                }]
            })
            .then(user=>{

                let googlePicture = {
                    name: 'google_picture',
                    data_OAUTH: profile.picture
                }

                if (user == null){
                    // user is not in the database, register them
                    user = new UserModel({
                        name: name.givenName,
                        surname: name.familyName,
                        email: profile.emails[0].value,
                        profile_picture: googlePicture,
                        google_id: profile.id,
                        user_stature: 'client'
                    });

                    user.save((err)=>{
                        if(err){
                            console.log(err);
                        }
                        else{
                            done(null, user);
                        }
                    })
                }

                else if(user.email && user.google_id){
                    // user's details already registered
                    return done(null, user);
                }

                else if(user.email){
                    // email has already been registerd, user can sign in
                    return done('email-in-use');
                }
            }).catch(err=>{console.log(err)})*/