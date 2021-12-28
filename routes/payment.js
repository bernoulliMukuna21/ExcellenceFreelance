var express = require('express');
var router = express.Router();
var { stripe } = require('../bin/stripe-config');
var BookingModel = require('../models/BookingModel');
var { ensureAuthentication } = require('../bin/authentication');
var { emailEncode, emailDecode } = require('../bin/encodeDecode');
var { bookingUpdate } = require('../bin/general-helper-functions');




let domain = 'http://localhost:3000';
//let domain = 'https://excellence-freelance.herokuapp.com';

const endpointSecret = "whsec_WiGL956JT1kUPRKkucfFIPSYQXxr5WTj";

let price, projectName, projectDescription, projectDueDate, serviceName;

function server_io(io) {

    router.get('/create-checkout-session/:paymentType', ensureAuthentication, async function (req, res, next) {
        console.log('Inside Payment Router')
        let paymentType = req.params.paymentType;
        let customer_client = req.user.email;
        let lineItems, mode, subscription_data, trial_days, successURL;
        let bookingID, price;

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

        }
        else if(paymentType === 'booking-checkout'){
            bookingID = req.query.bookingID;
            try{
                let booking = await BookingModel.findOne({bookingID: bookingID});
                if(booking.bookingType === 'request_booking'){
                    price = booking.requestedPrice;
                }else {price = booking.price}

                mode = 'payment';
                lineItems = {
                    price_data: {
                        currency: 'gbp',
                        product_data: {
                            name: booking.service+' - '+booking.projectName,
                        },
                        unit_amount: Math.round(parseFloat(price.substr(1))*100)
                    },
                    quantity: 1,
                };
                successURL = `${domain}/payment/success/${paymentType}?bookingID=${bookingID}`;
            }catch (e) {
                console.log(e)
            }
        }

        const session = await stripe.checkout.sessions.create({
            billing_address_collection: 'auto',
            payment_method_types: ['card'],
            line_items: [lineItems,],
            customer_email: req.user.email,
            mode: mode,
            subscription_data: subscription_data,
            success_url: successURL,
            cancel_url: 'http://localhost:3000/payment/failure',
            metadata: {bookingID, paymentType}
        });
        res.redirect(303, session.url)
    });

    router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
        console.log('Webhook listener')
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } catch (err) {
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                const payload = event.data.object;
                if(payload.metadata.paymentType === 'booking-checkout'){
                    let bookingID = payload.metadata.bookingID;
                    try{
                        let bookingUpdated = await bookingUpdate(bookingID, BookingModel,
                            {status: 'booking ongoing', paid: true});
                        console.log('New Booking status: ', bookingUpdated)
                        bookingUpdated.save(err => {
                            if(err){
                                throw err;
                            }
                            let freelancerBooked = bookingID.split(':')[1];
                            io.sockets.to(freelancerBooked).emit('Successful Payment - send to Freelancer',
                                bookingUpdated);
                        })
                    }catch (err) {
                        throw err;
                    }
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        // Return a response to acknowledge receipt of the event
        res.status(200).send('Payment successful');
    });

    router.get('/success/:paymentType', ensureAuthentication, (req, res)=>{

        let paymentType = req.params.paymentType;
        let user_stature = req.user.user_stature;
        let userUUID = emailEncode(req.user.email);
        let bookingID = req.query.bookingID;

        req.flash('success_message', 'Successful Payment');
        res.redirect(`${domain}/account/${user_stature}/${userUUID}`);
    })

    router.get('/failure', ensureAuthentication, function(req, res, next) {
        let user_stature = req.user.user_stature;
        let userUUID = emailEncode(req.user.email);
        req.flash('error_message', 'Payment Failure!');
        res.redirect(`${domain}/account/${user_stature}/${userUUID}`);
    });


    router.post('/create-portal-session', ensureAuthentication, function(req, res, next) {
        res.send('Update billing information');
    });

    return router;
}

module.exports = {router, server_io};
