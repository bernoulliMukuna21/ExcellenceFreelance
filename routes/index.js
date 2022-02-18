/*
    * Author: Bernoulli Mukuna
    * created: 10/05/2020
*/
var express = require('express');
var router = express.Router();
var url = require('url');
var UserModel = require('../models/UserModel');
var {ensureAuthentication} = require('../bin/authentication');
var {emailEncode, emailDecode} = require('../bin/encodeDecode');
var {base64ToImageSrc, imageToDisplay} = require('../bin/imageBuffer');
var BinData = require('bindata');

/* GET home page. */
router.get('/', async function (req, res, next) {
    try{
        let loggedInUser;
        let loggedInUser_imageSrc;
        let allFreelancers;

        let trial_days = 228;
        let findFreelancersQuery = [{
            user_stature: 'freelancer'
        },{
            "serviceAndPrice.0": { $exists: true }
        },{
            $or:[
                {is_subscribed: true},
                {
                    $and:[
                        {is_subscribed: false},
                        {
                            $expr:{
                                $lte: [
                                    {
                                        $trunc: {
                                            $divide: [{"$subtract":["$$NOW","$date"]}, 1000 * 60 * 60 * 24]
                                        }
                                    },
                                    trial_days
                                ]
                            }
                        }
                    ]
                }
            ]
        }];

        if (req.isAuthenticated()) {
            loggedInUser = req.user;
            loggedInUser_imageSrc = imageToDisplay(loggedInUser);

            findFreelancersQuery.push(
                {
                    email: { $ne: loggedInUser.email }
                }
            );
            allFreelancers = await UserModel.find({
                $and: findFreelancersQuery
            });
        }else{
            allFreelancers = await UserModel.find({
                $and: findFreelancersQuery
            });
        }

        res.render('index', {
            title: 'Excellence.Freelance',
            allFreelancers,
            loggedInUser,
            loggedInUser_imageSrc,
            isLogged: req.isAuthenticated(),
            emailEncode
        });
    }catch (e) {
        console.log('This An error occured!');
        throw e;
    }
});

//localhost:3000/login
router.get('/login', function(req, res, next) {
  res.redirect('/users/login');
});
//localhost:3000/join
router.get('/join', function(req, res, next) {
  res.redirect('/users/join');
});


module.exports = router;
