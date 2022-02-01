var express = require('express');
var router = express.Router();
var { stripe } = require('../bin/stripe-config');
var BookingModel = require('../models/BookingModel');
var mailer = require('../bin/mailer');
var { ensureAuthentication } = require('../bin/authentication');
var { emailEncode, emailDecode } = require('../bin/encodeDecode');

//let domainName = 'http://localhost:3000';
let domainName = 'https://www.unilance.co.uk';
let unilanceLoginURL = `${domainName}/users/login`;

const endpointSecret = process.env.stripe_webhookEndpointLive;

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
            successURL = `${domainName}/payment/success/${paymentType}`;

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
                        unit_amount: Math.round(parseFloat(price*100))
                    },
                    quantity: 1,
                };
                successURL = `${domainName}/payment/success/${paymentType}?bookingID=${bookingID}`;
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
            cancel_url: `${domainName}/payment/failure`,
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
                        let bookingUpdated = await BookingModel.findOne({bookingID: bookingID});
                        bookingUpdated.status.freelancer = 0; // booking ongoing
                        bookingUpdated.status.client = 0; // booking ongoing
                        bookingUpdated.paid = true;
                        let freelancerBooked = bookingID.split(':')[1];

                        let successPayMessageToClientHTML = '<h1 style="color: #213e53; font-size: 1.1rem">New Booking</h1>'+
                            '<p>Hello '+bookingUpdated.customer.name.split(' ')[0]+',</p><p>This is a confirmation' +
                            ' of the successful pay for your new booking ('+bookingUpdated.service+' - '
                            +bookingUpdated.projectName+'). Please note the unique identification of your project: '+
                            bookingUpdated._id+'</p>'+'<p>Thank you,<br>The Unilance Team' +
                            '<br>07448804768</p>';

                        let successPayMessageToFreelancerHTML = '<h1 style="color: #213e53; font-size: 1.1rem">Booking Paid</h1>'+
                            '<p>Hello '+bookingUpdated.supplier.name.split(' ')[0]+',</p><p> I am pleased to inform you that' +
                            ' the following booking ('+ bookingUpdated.service+' - ' +bookingUpdated.projectName +') has' +
                            ' now been paid. Please <a target="_blank" style="text-decoration: underline;' +
                            ' color: #0645AD; cursor: pointer" href='+unilanceLoginURL+'> login </a>' +
                            ' to your account to access the details of this booking and, possibly beginning working on it.</p>'+
                            '<p>Thank you,<br>The Unilance Team <br>07448804768</p>';

                        let successPayMessageToAdminHTML = '<h1 style="color: #213e53; font-size: 1.1rem">Booking Payment Successful</h1>'+
                            '<p>Hello,</p>'+'<p> The following booking has now been paid for: </p>'+
                            '<ul style="list-style-type:none;">' +
                            `<li>Project ID: ${bookingUpdated._id}</li>`+
                            '<li>Project Name: '+bookingUpdated.service+' - '+bookingUpdated.projectName+' </li>' +
                            '<li>Client Name: '+bookingUpdated.customer.name+' </li>' +
                            '<li>Freelancer Name: '+bookingUpdated.supplier.name+' </li>' +
                            '<li>Creation Date: '+bookingUpdated.creationDate.toLocaleString()+' </li>' +
                            '<li>Due Date: '+bookingUpdated.dueDateTime.toLocaleString()+' </li>' +
                            '<li>Description: '+bookingUpdated.projectDescription+' </li>' +
                            '</ul>'+
                            '<p>Thank you<br>The Unilance Team<br>07448804768</p>';

                        bookingUpdated.save(err => {
                            if(err){
                                throw err;
                            }

                            mailer.smtpTransport.sendMail(mailer.mailerFunction('unilance.admnistration@gmail.com',
                                'Client Booking Payment Successful', successPayMessageToAdminHTML), function (err) {
                                if(err){console.log(err)}
                                else{
                                    console.log('Client success payment Message has been sent to Admin')
                                    // emailDecode(bookingDetailUpdate.customer.uuid)
                                    mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.supplier.uuid),
                                        'Client Booking Payment Successful', successPayMessageToFreelancerHTML), function (err) {
                                        if(err){console.log(err)}
                                        else{
                                            console.log('Client success payment Message has been sent to Freelancer');
                                            mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.customer.uuid),
                                                'Booking Payment Successful', successPayMessageToClientHTML), function (err) {
                                                if(err){console.log(err)}
                                                else{console.log('Client success payment Message has been sent to Client')}
                                            });
                                        }
                                    });
                                }
                            });

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
        res.redirect(`${domainName}/account/${user_stature}/${userUUID}`);
    })

    router.get('/failure', ensureAuthentication, function(req, res, next) {
        let user_stature = req.user.user_stature;
        let userUUID = emailEncode(req.user.email);
        req.flash('error_message', 'Payment Failure!');
        res.redirect(`${domainName}/account/${user_stature}/${userUUID}`);
    });


    router.post('/create-portal-session', ensureAuthentication, function(req, res, next) {
        res.send('Update billing information');
    });

    return router;
}

module.exports = {router, server_io};
