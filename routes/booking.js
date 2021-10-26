var express = require('express');
var router = express.Router();
var BookingModel = require('../models/BookingModel');
var { ensureAuthentication } = require('../bin/authentication');
var { emailEncode, emailDecode } = require('../bin/encodeDecode');

//let domain = 'http://localhost:3000';
let domain = 'https://excellence-freelance.herokuapp.com';

router.post('/service-booking/:client_freelancer', ensureAuthentication, (req, res)=>{
    let customer_client = emailEncode(req.user.email);
    let customer_freelancerToBook = req.params.client_freelancer;
    let bookingID = customer_client+':'+customer_freelancerToBook+':'+Date.now();
    let newServiceInfos = {
        bookingID: bookingID,
        customer: customer_client,
        supplier: {
            uuid: customer_freelancerToBook,
            name: req.body.projectsupplier
        },
        service: req.body.servicename,
        projectName: req.body.projectname,
        projectDescription: req.body.projectdescription,
        dueDate: req.body.projectduedate,
        price: req.body.projectprice
    }

    // Save into booking DB
    let newServiceBooking = new BookingModel(newServiceInfos);
    newServiceBooking.save(err =>{
        if (err) {throw err}
        else{
            if(req.user.user_stature === 'freelancer'){
                res.send('Dealing with freelancer as customer')
            }else if(req.user.user_stature === 'client'){
                res.redirect(`${domain}/account/client/${customer_client}`)
            }
        }
    })
})
module.exports = router;