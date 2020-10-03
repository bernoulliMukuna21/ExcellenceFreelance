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

/* GET home page. */
router.get('/', function(req, res, next) {
    let userEmail_encoded;
    if(req.isAuthenticated()){
        userEmail_encoded = emailEncode(req.user.email);
    }
    console.log(userEmail_encoded)
    res.render('index',
        { title: 'Excellence.Freelance',
            user: req.user,
            isLogged: req.isAuthenticated(),
            userEmail_encoded: userEmail_encoded
        });
});

router.get('/login', function(req, res, next) {
  res.redirect('/users/login');
});

router.get('/join', function(req, res, next) {
  res.redirect('/users/join');
});


module.exports = router;
