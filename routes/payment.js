var express = require('express');
var router = express.Router();
var { stripe } = require('../bin/stripe-config');
var BookingModel = require('../models/BookingModel');
var { ensureAuthentication } = require('../bin/authentication');
var { emailEncode, emailDecode } = require('../bin/encodeDecode');

let domain = 'http://localhost:3000';
let price, projectName, projectDescription, projectDueDate, serviceName;

/* GET home page. */
router.post('/create-checkout-session/:paymentType', ensureAuthentication, async function (req, res, next) {
    let paymentType = req.params.paymentType;
    let customer_client = req.user.email;
    let lineItems, mode, subscription_data, trial_days, successURL;

    if(paymentType === 'subscription'){
        let days = 7;
        /*let prices = await stripe.prices.list(
            {
                lookup_keys: [req.body.lookup_key],
                expand: ['data.product'],
            }
        );*/
        mode = 'subscription';
        trial_days = days;
        subscription_data = {trial_period_days: trial_days}

        lineItems = {
            //price: prices.data[0].id,
            price_data: {
                product: 'prod_KEopcvRYhVhf3C',
                unit_amount: 100,
                currency: 'gbp',
                recurring: {
                    interval: "day",
                    interval_count: 1,
                },
            },
            quantity: 1,
        };
        successURL = `${domain}/payment/success/${paymentType}`;
    }else if(paymentType === 'booking-checkout'){
        let customer_freelancer = req.query.client_freelancer;
        serviceName = req.body.servicename;
        projectName = req.body.projectname;
        projectDescription = req.body.projectdescription;
        projectDueDate = req.body.projectduedate;
        price = req.body.projectprice.substr(1);

        mode = 'payment';
        lineItems = {
            price_data: {
                currency: 'gbp',
                product_data: {
                    name: projectName,
                },
                unit_amount: Math.round(parseFloat(price)*100)
            },
            quantity: 1,
        };
        successURL = `${domain}/payment/success/${paymentType}?client_freelancer=${customer_freelancer}`;
    }

    const session = await stripe.checkout.sessions.create({
        billing_address_collection: 'auto',
        payment_method_types: ['card'],
        line_items: [lineItems,],
        customer_email: req.user.email,
        mode: mode,
        subscription_data: subscription_data,
        success_url: successURL,
        cancel_url: 'http://localhost:3000/cancel',
    });

    res.redirect(303, session.url)
});

router.post('/create-portal-session', ensureAuthentication, function(req, res, next) {
    res.send('Update billing information');
});

router.get('/success/:paymentType', ensureAuthentication, (req, res)=>{
    let paymentType = req.params.paymentType;
    let customer_client = emailEncode(req.user.email);
    if(paymentType === 'booking-checkout'){
        let customer_freelancerToBook = req.query.client_freelancer;
        let bookingID = customer_client+':'+customer_freelancerToBook+':'+Date.now();
        let newServiceInfos = {
            bookingID: bookingID,
            customer: customer_client,
            supplier: customer_freelancerToBook,
            service: serviceName,
            projectName: projectName,
            projectDescription: projectDescription,
            dueDate: projectDueDate,
            price: price
        }
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
    }else if(paymentType === 'subscription'){
        res.send(`The user ${customer_client} is subscribed`)
    }
})

function server_io(io) {

    return router;
}

module.exports = {router, server_io};
