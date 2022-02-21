var express = require('express');
var router = express.Router();
var { stripe } = require('../bin/stripe-config');
var BookingModel = require('../models/BookingModel');
var UserModel = require('../models/UserModel');
var mailer = require('../bin/mailer');
var { ensureAuthentication } = require('../bin/authentication');
var { emailEncode, emailDecode } = require('../bin/encodeDecode');
var { stripeFindCustomerByEmail, stripeCustomerSubscription } = require('../bin/stripe-config');

//let domainName = 'http://localhost:3000';
let domainName = 'https://www.unilance.co.uk';
let unilanceLoginURL = `${domainName}/users/login`;

const endpointSecret = process.env.stripe_webhookEndpointLive;

//const endpointSecret = 'whsec_55eeb211397850dd75a9132be2f70fc698e81cf8c11c1287407d899085355157';

let price, projectName, projectDescription, projectDueDate, serviceName;

function server_io(io) {

    router.get('/create-checkout-session/booking-checkout', ensureAuthentication, async function (req, res, next) {
        console.log('Inside Booking Payment Router')

        let customer_client = req.user.email;
        let lineItems, mode, successURL;
        let bookingID, price;

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
            successURL = `${domainName}/payment/success/booking-checkout?bookingID=${bookingID}`;
            const session = await stripe.checkout.sessions.create({
                billing_address_collection: 'auto',
                payment_method_types: ['card'],
                line_items: [lineItems,],
                customer_email: customer_client,
                mode: mode,
                success_url: successURL,
                cancel_url: `${domainName}/payment/failure`,
                metadata: {bookingID, paymentType: 'booking-checkout'}
            });
            res.redirect(303, session.url)
        }catch (e) {
            console.log(e)
            res.send('An Occured during payment process. Sorry about this!')
        }
    });

    router.post('/create-checkout-session/subscription', ensureAuthentication, async function (req, res, next){
        let customer_client = req.user.email;
        let lineItems, mode, subscription_data, successURL;

        let trial_days = req.body.trial_days;
        mode = 'subscription';

        subscription_data = {
            metadata: {"UUID": emailEncode(customer_client),"paymentType": 'subscription'}
        };

        if(trial_days > 0){
            subscription_data.trial_period_days = trial_days;
        }

        lineItems = {
            price_data: {
                product: process.env.stripe_subscriptionKey,
                unit_amount: 120,
                currency: 'gbp',
                recurring: {
                    interval: "day",
                    interval_count: 30,
                },
            },
            quantity: 1,
        };
        successURL = `${domainName}/payment/success/subscription`;
        try {
            const session = await stripe.checkout.sessions.create({
                billing_address_collection: 'auto',
                payment_method_types: ['card'],
                line_items: [lineItems,],
                customer_email: customer_client,
                mode: mode,
                subscription_data: subscription_data,
                success_url: successURL,
                cancel_url: `${domainName}/payment/failure`
            });
            res.redirect(303, session.url);
        }catch (e) {
            res.send('An occured during subscription process. We are really sorry for any inconveniences caused!')
        }
    })

    router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
        console.log('Webhook listener')
        const sig = req.headers['stripe-signature'];
        let event, subscrptionData, userUUID, userEmail;

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
                       res.send('An occured during payment. We are truly sorry for any incoveniences caused!')
                    }
                }
                break;
            case 'customer.subscription.created':
                subscrptionData = event.data.object;
                userUUID = subscrptionData.metadata.UUID;
                userEmail = emailDecode(userUUID);
                try{
                    let freelancerUser = await UserModel.findOne({email: userEmail});
                    freelancerUser.is_subscribed = true;

                    let activeSubscriptionMessageToUserHTML= '<h1 style="color: #213e53; font-size: 1.1rem">Successfully Subscribed</h1>'+
                        '<p>Hello '+freelancerUser.name+',</p><p>This is a confirmation' +
                        ' of your successful subscription to Unilance. We are pleased to have you as one of our freelancers and'+
                        ' we are looking forward to working together on many exciting projects.</p>'+
                        '<p>Thank you,<br>The Unilance Team' +
                        '<br>07448804768</p>';

                    freelancerUser.save(err => {
                        if(err){
                            throw err;
                        }
                        mailer.smtpTransport.sendMail(mailer.mailerFunction(userEmail,
                            'Successful Subscription', activeSubscriptionMessageToUserHTML), function (err) {
                            if(err){console.log(err)}
                            else{console.log('Successful Subscription sent to freelancer user')}
                        });
                    })
                }catch (err) {
                    res.send('An occured during payment. We are truly sorry for any incoveniences caused!')
                }

                break;
            case 'customer.subscription.deleted':
                subscrptionData = event.data.object;
                userUUID = subscrptionData.metadata.UUID;
                userEmail = emailDecode(userUUID);
                try{
                    let freelancerUser = await UserModel.findOne({email: userEmail});
                    freelancerUser.is_subscribed = false;

                    let cancelSubscriptionMessageToUserHTML= '<h1 style="color: #213e53; font-size: 1.1rem">Subscription Cancelled</h1>'+
                        '<p>Hello '+freelancerUser.name+',</p><p>This is a confirmation' +
                        ' of <the></the> cancellation of your subscription with Unilance. We are sad to see you go, but your account is'+
                        ' still active. If you change your mind, please  <a target="_blank" style="text-decoration: underline; color: #0645AD; cursor: pointer" ' +
                        'href='+unilanceLoginURL+'> login </a> to your account to subscribe again.</p>'+
                        '<p>Thank you,<br>The Unilance Team' +
                        '<br>07448804768</p>';

                    freelancerUser.save(err => {
                        if(err){
                            throw err;
                        }
                        mailer.smtpTransport.sendMail(mailer.mailerFunction(userEmail,
                            'Subscription Cancelled', cancelSubscriptionMessageToUserHTML), function (err) {
                            if(err){console.log(err)}
                            else{console.log('Subscription cancellation sent to freelancer user')}
                        });
                    })
                }catch (err) {
                    res.send('An occured during payment. We are truly sorry for any incoveniences caused!')
                }
                break;
            case 'invoice.payment_succeeded':
                console.log('Subscription is paid for');
                console.log('--------------------------------------------------------------------');
                break

            case 'customer.subscription.trial_will_end':
                //subscrptionData = event.data.object;
                console.log('Trial will end');
                //console.log(subscrptionData);
                console.log('--------------------------------------------------------------------')
                break;


            case 'invoice.payment_failed':
                // The payment fails or the customer does not have a valid payment method
                // In this case, the subscription becomes past_due
                break;
            case 'customer.subscription.updated':
                //subscrptionData = event.data.object;
                console.log('Subscription is updated');
                //console.log(subscrptionData);
                console.log('--------------------------------------------------------------------')
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        // Return a response to acknowledge receipt of the event
        res.status(200).send('Payment successful');
    });

    router.get('/success/:paymentType', ensureAuthentication, (req, res)=>{

        let paymentType = req.params.paymentType;
        let flash_message;
        if(paymentType === 'booking-checkout'){
            flash_message = 'Successful Payment';
        }
        else if(paymentType === 'subscription'){
            flash_message = 'Successful Subscription'
        }
        else if(paymentType === 'billing-portal'){
            flash_message = 'Card Details Updated. Thank you!'
        }
        let user_stature = req.user.user_stature;
        let userUUID = emailEncode(req.user.email);

        req.flash('success_message', flash_message );
        res.redirect(`${domainName}/account/${user_stature}/${userUUID}`);
    })

    router.get('/failure', ensureAuthentication, function(req, res, next) {
        let user_stature = req.user.user_stature;
        let userUUID = emailEncode(req.user.email);
        req.flash('error_message', 'Payment Failure!');
        res.redirect(`${domainName}/account/${user_stature}/${userUUID}`);
    });


    router.post('/create-portal-session', ensureAuthentication, async function(req, res, next) {
        let isStripeCustomerSub, isStripeCustomer;

        try{
            let currentFreelancerEmail = req.body.freelancerStripeID;
            isStripeCustomer = await stripeFindCustomerByEmail(currentFreelancerEmail);

            if(isStripeCustomer){
                isStripeCustomerSub = await stripeCustomerSubscription(isStripeCustomer.id);

                if(isStripeCustomerSub){
                    const session = await stripe.billingPortal.sessions.create({
                        customer: isStripeCustomerSub.data[0].customer,
                        return_url: `${domainName}/payment/success/billing-portal`,
                    });
                    res.redirect(303, session.url)
                }
            }
        }catch (e) {
            res.send('An error occured during billing information update!');
        }
    });

    return router;
}

module.exports = {router, server_io};
