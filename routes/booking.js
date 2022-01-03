var express = require('express');
var router = express.Router();
var BookingModel = require('../models/BookingModel');
var mailer = require('../bin/mailer');
var { ensureAuthentication } = require('../bin/authentication');
var { emailEncode, emailDecode } = require('../bin/encodeDecode');
var { convertTimeTo24Hours } = require('../bin/general-helper-functions');

//let domainName = 'http://localhost:3000';
let domainName = 'https://www.nxtdue.com';
let nxtDueLoginURL=`${domainName}/users/login`;

function server_io(io) {
    io.on('connection', socket=>{

        socket.on('Accept project', acceptData => {
            BookingModel.findOne({bookingID: acceptData.bookingToAcceptID})
                .then(bookingDetailUpdate =>{
                    bookingDetailUpdate.status = acceptData['status'] = 'awaiting payment';
                    bookingDetailUpdate.price = bookingDetailUpdate.requestedPrice;

                    let bookingAcceptanceMessageToClientHTML = '<h1 style="color: #213e53; font-size: 1.1rem">Booking Accepted</h1>'+
                        '<p>Hello '+bookingDetailUpdate.customer.name.split(' ')[0]+',</p><p> There has been an update ' +
                        'your booking ('+bookingDetailUpdate.service+' - ' +bookingDetailUpdate.projectName+'). I am please to inform you that '+
                        bookingDetailUpdate.supplier.name+' has accepted your booking and is now waiting for the payment to begin' +
                        'the work. Please <a target="_blank" style="text-decoration: underline; color: #0645AD; cursor: pointer" ' +
                        'href='+ nxtDueLoginURL +'> login </a> to your account to make the payment</p>'+
                        '<p>Thank you,<br>The NxtDue Team <br>07448804768</p>';

                    let bookingAcceptanceMessageToFreelancerHTML = '<h1 style="color: #213e53; font-size: 1.1rem">Booking Accepted</h1>'+
                        '<p>Hello '+bookingDetailUpdate.supplier.name.split(' ')[0]+',</p><p> This is just a confirmation of your acceptance for ' +
                        ' the following booking ('+ bookingDetailUpdate.service+' - ' +bookingDetailUpdate.projectName +') has.' +
                        ' It is advised to wait for the payment to be made before starting the work as the client can still cancel.' +
                        ' Once the client has paid, you will be informed to begin the work. So, please check your inbox and' +
                        ' <a target="_blank" style="text-decoration: underline;' +
                        ' color: #0645AD; cursor: pointer" href='+ nxtDueLoginURL +'> login </a>' +
                        ' regularly to your account for updates.</p>'+
                        '<p>Thank you,<br>The NxtDue Team <br>07448804768</p>';

                    let bookingAcceptanceMessageToAdminHTML = '<h1 style="color: #213e53; font-size: 1.1rem">Booking Accepted</h1>'+
                        '<p>Hello,</p>'+'<p> The following booking has been accpeted by the freelancer: </p>'+
                        '<ul style="list-style-type:none;">' +
                        `<li>Project ID: ${bookingDetailUpdate._id}</li>`+
                        '<li>Project Name: '+bookingDetailUpdate.service+' - '+bookingDetailUpdate.projectName+' </li>' +
                        '<li>Client Name: '+bookingDetailUpdate.customer.name+' </li>' +
                        '<li>Freelancer Name: '+bookingDetailUpdate.supplier.name+' </li>' +
                        '<li>Creation Date: '+bookingDetailUpdate.creationDate.toLocaleString()+' </li>' +
                        '<li>Due Date: '+bookingDetailUpdate.dueDateTime.toLocaleString()+' </li>' +
                        '<li>Description: '+bookingDetailUpdate.projectDescription+' </li>' +
                        '</ul>'+
                        '<p>Thank you<br>The NxtDue Team<br>07448804768</p>';

                    bookingDetailUpdate.save(err => {
                        if(err){
                            throw err;
                        }

                        mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                            'Freelancer Booking Acceptance', bookingAcceptanceMessageToAdminHTML), function (err) {
                            if(err){console.log(err)}
                            else{
                                console.log('Freelancer booking acceptance Message has been sent to Admin')
                                mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.customer.uuid),
                                    'Booking Accepted', bookingAcceptanceMessageToClientHTML), function (err) {
                                    if(err){console.log(err)}
                                    else{
                                        console.log('Freelancer booking acceptance Message has been sent to Freelancer');
                                        mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.supplier.uuid),
                                            "You've accepted a booking", bookingAcceptanceMessageToFreelancerHTML), function (err) {
                                            if(err){console.log(err)}
                                            else{console.log('Freelancer booking acceptance Message has been sent to Client')}
                                        });
                                    }
                                });
                            }
                        });

                        socket.emit('Accept project on Freelancer side', acceptData);
                        socket.broadcast.to(acceptData.clientThatBooked)
                            .emit('Accept project on Client side', {
                                bookingToAcceptID: acceptData.bookingToAcceptID,
                                clientThatBooked: acceptData.clientThatBooked});
                    })

                }).catch(err => console.log(err));
        })

        socket.on('Project Completion Finish', finishData => {
            // UpdateDB, Send Email to both Clent and Freelancer and live update
            // on client side

            BookingModel.findOne({bookingID: finishData.bookingFinishID})
                .then(bookingDetailUpdate =>{
                    bookingDetailUpdate.status = 'complete';
                    bookingDetailUpdate.completion.status = 'awaiting confirmation';

                    let completionRequestMessageToFreelancerHTML = '<h1 style="color: #213e53; font-size: 1.1rem">Booking Completed</h1>'+
                        '<p>Hello '+ bookingDetailUpdate.supplier.name.split(' ')[0] +',</p>'+'<p> Congratulations on your successful' +
                        ' completion of the booking. '+bookingDetailUpdate.customer.name+
                        ' has been informed that the project ('+
                        bookingDetailUpdate.service+' - '+ bookingDetailUpdate.projectName+') is completed. We are now waiting for' +
                        ' a confirmation from '+ bookingDetailUpdate.customer.name +' before we proceed with the payment.' +
                        ' So, please check your inbox and <a target="_blank" style="text-decoration: underline; color: #0645AD; ' +
                        'cursor: pointer" href='+ nxtDueLoginURL +'> login </a> regularly to your account for updates.</p>'+
                        '<p>Thank you,<br>The NxtDue Team <br>07448804768</p>';

                    let completionRequestMessageToClientHTML = '<h1 style="color: #213e53; font-size: 1.1rem">Booking Completed</h1>'+
                        '<p>Hello '+ bookingDetailUpdate.customer.name.split(' ')[0] +',</p>' +
                        '<p>'+bookingDetailUpdate.supplier.name+' has completed your booking ('+ bookingDetailUpdate.service+' - '+
                        bookingDetailUpdate.projectName+
                        '). We will need your confirmation on this information. If we do not hear from you'+
                        ' in the next three days, we will assume that the project has been successfully delivered.'+
                        ' This will also mean that we get to pay '+ bookingDetailUpdate.supplier.name +' for the work.'+
                        ' Please <a target="_blank" style="text-decoration: underline;'+
                        'color: #0645AD; cursor: pointer" '+ 'href='+ nxtDueLoginURL +'>'+
                        'login'+ '</a> to your account to update us on this information.</p>'+
                        '<p>Thank you,<br>The NxtDue Team <br>07448804768</p>';


                    bookingDetailUpdate.save(err => {
                        if(err){
                            throw err;
                        }

                        // emailDecode(bookingDetailUpdate.customer.uuid)
                        //emailDecode(bookingDetailUpdate.supplier.uuid)
                        mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.customer.uuid),
                            'Booking Completed', completionRequestMessageToClientHTML), function (err) {
                            if(err){console.log(err)}
                            else{
                                console.log('Freelancer booking completed Message has been sent to client');
                                mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.supplier.uuid),
                                    "You've completed a booking", completionRequestMessageToFreelancerHTML), function (err) {
                                    if(err){console.log(err)}
                                    else{console.log('Freelancer booking completed Message has been sent to Freelancer')}
                                });
                            }
                        });

                        socket.emit('Booking Completion - Request to Freelancer', finishData);
                        socket.broadcast.to(bookingDetailUpdate.customer.uuid)
                            .emit('Booking Completion - Request to Client', finishData);
                    })

                }).catch(err => console.log(err));

        })

        socket.on('Completion Confirmed', completionData => {
            BookingModel.findOne({bookingID: completionData.bookingCompletionConfirmedID})
                .then(bookingDetailUpdate =>{
                    bookingDetailUpdate.completion.status = 'confirmed';

                    let payoutSum = (bookingDetailUpdate.price - ((5/ 100) * bookingDetailUpdate.price)).toFixed(2);
                    let confirmationMessagetoAdminHTML = '<p>Hello,</p>'+'<p>We have a confirmation'+
                        ' of the completion of the project below (<b>please proceed with the pay out</b>):</p>'+
                        '<ul style="list-style-type:none;">' +
                        `<li>Project ID: ${bookingDetailUpdate._id}</li>`+
                        '<li>Project Name: '+bookingDetailUpdate.service+' - '+bookingDetailUpdate.projectName+' </li>' +
                        '<li>Client Name: '+bookingDetailUpdate.customer.name+' </li>' +
                        '<li>Freelancer Name: '+bookingDetailUpdate.supplier.name+' </li>' +
                        '<li>Creation Date: '+bookingDetailUpdate.creationDate.toLocaleString()+' </li>' +
                        '<li>Due Date: '+bookingDetailUpdate.dueDateTime.toLocaleString()+' </li>' +
                        '<li>Description: '+bookingDetailUpdate.projectDescription+' </li>' +
                        '<li>Payout Sum: £'+payoutSum+' </li>' +
                        '</ul>'+
                        '<p>Thank you<br>The NxtDue Team<br>07448804768</p>';

                    let confirmationMessagetoFreelancerHTML = '<h1 style="color: #213e53; font-size: 1.1rem">' +
                        'Congratulations</h1>' + '<p>Hello '+bookingDetailUpdate.supplier.name.split(' ')[0]+',</p><p>Congratulations on the completion of ' +
                        'the booking! We have received the confirmation from '+bookingDetailUpdate.customer.name+'.  Please expect to receive ' +
                        'your earning of £'+payoutSum+' in the next three days.</p><p> Booking ID:'+
                        bookingDetailUpdate._id +'</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';

                    let confirmationMessagetoClientHTML = '<h1 style="color: #213e53; font-size: 1.1rem">' +
                        'Thank you!</h1>' + '<p>Hello '+bookingDetailUpdate.customer.name.split(' ')[0]+',</p><p>Congratulations on the completion of ' +
                        'your booking! Your confirmation has now been received. We hope you enjoyed our services and we are looking forward to your next booking. ' +
                        'Have a wonderful day!.</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';

                    bookingDetailUpdate.save(err => {
                        if(err){
                            throw err;
                        }

                        // emailDecode(bookingDetailUpdate.customer.uuid)
                        //emailDecode(bookingDetailUpdate.supplier.uuid)
                        mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                            'Booking Completion Confirmation', confirmationMessagetoAdminHTML), function (err) {
                            if(err){console.log(err)}
                            else{
                                console.log('Confirmation Message has been sent to Admin');
                                // emailDecode(bookingDetailUpdate.customer.uuid)
                                mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.supplier.uuid),
                                    'Client confirmation', confirmationMessagetoFreelancerHTML), function (err) {
                                    if(err){console.log(err)}
                                    else{
                                        console.log('Confirmation Message has been sent to Freelancer')
                                        mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.customer.uuid),
                                            'Delivery Confirmed', confirmationMessagetoClientHTML), function (err) {
                                            if(err){console.log(err)}
                                            else{console.log('Confirmation Message has been sent to Client')}
                                        });
                                    }
                                });
                            }
                        });

                        socket.emit('Booking Completion Confirmation - to Client', completionData);
                        socket.broadcast.to(bookingDetailUpdate.supplier.uuid)
                            .emit('Booking Completion Confirmation - to Freelancer', completionData);
                    })
                }).catch(err => console.log(err));
        })

        socket.on('Completion Conflict', completionData => {
            BookingModel.findOne({bookingID: completionData.bookingCompletionConflictID})
                .then(bookingDetailUpdate =>{
                    bookingDetailUpdate.completion.status = 'awaiting resolution';

                    let payoutSum = (bookingDetailUpdate.price - ((5/ 100) * bookingDetailUpdate.price)).toFixed(2);
                    let conflictMessagetoAdminHTML = '<p>Hello,</p>'+'<p>The following booking is <b> awaiting resolution</b> (Please'+
                        ' endavour to resolve it as soon as possible): </p>'+
                        '<ul style="list-style-type:none;">' +
                        `<li>Project ID: ${bookingDetailUpdate._id}</li>`+
                        '<li>Project Name: '+bookingDetailUpdate.service+' - '+bookingDetailUpdate.projectName+' </li>' +
                        '<li>Client Name: '+bookingDetailUpdate.customer.name+' </li>' +
                        '<li>Freelancer Name: '+bookingDetailUpdate.supplier.name+' </li>' +
                        '<li>Creation Date: '+bookingDetailUpdate.creationDate.toLocaleString()+' </li>' +
                        '<li>Due Date: '+bookingDetailUpdate.dueDateTime.toLocaleString()+' </li>' +
                        '<li>Description: '+bookingDetailUpdate.projectDescription+' </li>' +
                        '<li>Payout Sum: '+payoutSum+' </li>' +
                        '</ul>'+
                        '<p>Thank you</p><p>The NxtDue Team</p><p>07448804768</p>';

                    let conflictMessagetoFreelancerHTML = '<p>Hello '+bookingDetailUpdate.supplier.name.split(' ')[0]+',' +
                        '</p><p> Unfortunately, '+bookingDetailUpdate.customer.name+' has' +
                        ' informed us that the work has not been completed (or she has not received it). This could simply be a miscommunication,' +
                        ' so do not panic. Please do keep a close eye  on your inbox as the administration team will be' +
                        ' contacting you very soon. You can also call on <b>07448804768</b> to speak to our staff.' +
                        ' We are sorry for any inconveniences this might have caused.</p><p> Project ID: '+
                        bookingDetailUpdate._id +'</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';

                    let conflictMessagetoClientHTML = '<p>Hello '+bookingDetailUpdate.customer.name.split(' ')[0]+',' +
                        '</p><p> Thank you for your update and we are very sorry to hear this. We will be contacting '+
                        bookingDetailUpdate.supplier.name+ ' very soon to find out what has happened with your booking.' +
                        ' Once we have more information on this, we will email you an update. Thank you!</p>' +
                        '<p>Project ID: '+ bookingDetailUpdate._id +'</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';

                    bookingDetailUpdate.save(err => {
                        if(err){
                            throw err;
                        }

                        // emailDecode(bookingDetailUpdate.customer.uuid)
                        //emailDecode(bookingDetailUpdate.supplier.uuid)
                        mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                            'Booking Completion Awaiting Resolution', conflictMessagetoAdminHTML), function (err) {
                            if(err){console.log(err)}
                            else{
                                console.log('Conflict Message has been sent to Admin')
                                // emailDecode(bookingDetailUpdate.customer.uuid)
                                mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.supplier.uuid),
                                    'Confirmation Awaiting Resolution', conflictMessagetoFreelancerHTML), function (err) {
                                    if(err){console.log(err)}
                                    else{
                                        console.log('Conflict Message has been sent to Freelancer')
                                        mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.customer.uuid),
                                            'Booking Confirmation Denied', conflictMessagetoClientHTML), function (err) {
                                            if(err){console.log(err)}
                                            else{console.log('Conflict Message has been sent to Client')}
                                        });
                                    }
                                });
                            }
                        });

                        socket.emit('Booking Completion Conflict - to Client', completionData);
                        socket.broadcast.to(bookingDetailUpdate.supplier.uuid)
                            .emit('Booking Completion Conflict - to Freelancer', completionData);

                    })
                }).catch(err => console.log(err));
        })

        socket.on('Delete project - Freelancer Request', deleteData => {
            BookingModel.findOneAndDelete({bookingID: deleteData.projectToCancelID})
                .then(bookingDetailUpdate =>{

                    let deleteMessagetoClientHTML = '<p>Hello '+bookingDetailUpdate.customer.name.split(' ')[0]+',' +
                        '</p><p> Unfortunately, '+bookingDetailUpdate.supplier.name+' has' +
                        ' decided to cancel the booking ('+bookingDetailUpdate.service+' - '+bookingDetailUpdate.projectName+')' +
                        '. We are sorry for any inconveniences this might have caused.</p><p>' +
                        ' Booking ID: '+ bookingDetailUpdate._id +'</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';

                    let deleteMessagetoFreelancerHTML = '<p>Hello '+bookingDetailUpdate.supplier.name.split(' ')[0]+',' +
                        '</p><p> The project has successfully been deleted.' +
                        ' We are sorry that you decided to cancel the booking; please do contact us for any information that' +
                        ' might have led to you deleting the booking.</p><p>' +
                        ' Booking ID: '+ bookingDetailUpdate._id +'</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';

                    let deleteMessagetoAdminHTML = '<p>Hello,</p>'+'<p>The following booking has been deleted (it was not ongoing): </p>'+
                        '<ul style="list-style-type:none;">' +
                        `<li>Project ID: ${bookingDetailUpdate._id}</li>`+
                        '<li>Project Name: '+bookingDetailUpdate.service+' - '+bookingDetailUpdate.projectName+' </li>' +
                        '<li>Client Name: '+bookingDetailUpdate.customer.name+' </li>' +
                        '<li>Freelancer Name: '+bookingDetailUpdate.supplier.name+' </li>' +
                        '<li>Creation Date: '+bookingDetailUpdate.creationDate.toLocaleString()+' </li>' +
                        '<li>Due Date: '+bookingDetailUpdate.dueDateTime.toLocaleString()+' </li>' +
                        '<li>Description: '+bookingDetailUpdate.projectDescription+' </li>' +
                        '</ul>'+
                        '<p>Thank you</p><p>The NxtDue Team</p><p>07448804768</p>';

                    // emailDecode(bookingDetailUpdate.customer.uuid)
                    //emailDecode(bookingDetailUpdate.supplier.uuid)
                    mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                        'Freelancer Cancelled Project', deleteMessagetoAdminHTML), function (err) {
                        if(err){console.log(err)}
                        else{
                            console.log('Freelancer cancelled Message has been sent to Admin')
                            // emailDecode(bookingDetailUpdate.customer.uuid)
                            mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.supplier.uuid),
                                'Cancellation Confirmed', deleteMessagetoFreelancerHTML), function (err) {
                                if(err){console.log(err)}
                                else{
                                    console.log('Freelancer cancelled Message has been sent to Freelancer');
                                    mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.customer.uuid),
                                        'Booking Cancelled', deleteMessagetoClientHTML), function (err) {
                                        if(err){console.log(err)}
                                        else{console.log('Freelancer cancelled Message has been sent to Client')}
                                    });
                                }
                            });
                        }
                    });

                    socket.emit('Delete project on Freelancer side', deleteData);
                    socket.broadcast.to(deleteData.clientThatBooked)
                        .emit('Delete project on Client side', deleteData);
                })
                .catch(err => console.log(err));
        })

        socket.on('Ongoing Project Cancel - Freelancer', cancelData => {
            BookingModel.findOne({bookingID: cancelData.projectToCancelID})
                .then(bookingDetailUpdate =>{
                    bookingDetailUpdate.status = 'complete';
                    bookingDetailUpdate.completion.status = 'freelancer-cancelled';
                    bookingDetailUpdate.completion.deletionReason = cancelData.deletionReason;

                    let cancelMessagetoClientHTML = '<p>Hello '+bookingDetailUpdate.customer.name.split(' ')[0]+',' +
                        '</p><p>Unfortunately, '+bookingDetailUpdate.supplier.name+' has' +
                        ' decided to cancel the booking ('+bookingDetailUpdate.service+' - '+bookingDetailUpdate.projectName+')' +
                        ' . We are sorry for any inconveniences this might have caused. We understand that a payment was already made towards' +
                        ' this booking. This case has been passed to the management team and they will be in contact soon.' +
                        ' You can call us on 07448804768 for any emergency' +
                        ' bookings.</p><p>Reason for cancelling (given by '+ bookingDetailUpdate.supplier.name +'): ' +
                        cancelData.deletionReason+'<br>Booking ID: '+ bookingDetailUpdate._id +
                        '</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';

                    let cancelMessagetoFreelancerHTML = '<p>Hello '+bookingDetailUpdate.supplier.name.split(' ')[0]+',' +
                        '</p><p>The project has successfully been cancelled.' +
                        ' We are sorry that you decided to cancel the booking. Since the booking ongoing, the management team' +
                        ' will be in touch to understand what has happened and take appropriate actions.</p><p>Reason' +
                        ' for cancelling: ' + cancelData.deletionReason + '<br>Booking ID: '+ bookingDetailUpdate._id +
                        '</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';

                    let cancelMessagetoAdminHTML = '<p>Hello,</p>'+'<p>The following booking has been cancelled by the'+
                        'freelancer and it was already paid for. So, please do reachout the client and freelancer to'+
                        ' resolve this: </p>'+
                        '<ul style="list-style-type:none;">' +
                        `<li>Project ID: ${bookingDetailUpdate._id}</li>`+
                        '<li>Project Name: '+bookingDetailUpdate.service+' - '+bookingDetailUpdate.projectName+' </li>' +
                        '<li>Client Name: '+bookingDetailUpdate.customer.name+' </li>' +
                        '<li>Freelancer Name: '+bookingDetailUpdate.supplier.name+' </li>' +
                        '<li>Creation Date: '+bookingDetailUpdate.creationDate.toLocaleString()+' </li>' +
                        '<li>Due Date: '+bookingDetailUpdate.dueDateTime.toLocaleString()+' </li>' +
                        '<li>Description: '+bookingDetailUpdate.projectDescription+' </li>' +
                        '<li><b>Reason for Cancelling</b>: '+cancelData.deletionReason+' </li>' +
                        '</ul>'+
                        '<p>Thank you</p><p>The NxtDue Team</p><p>07448804768</p>';

                    bookingDetailUpdate.save(err => {
                        if(err){
                            throw err;
                        }

                        // emailDecode(bookingDetailUpdate.customer.uuid)
                        //emailDecode(bookingDetailUpdate.supplier.uuid)
                        mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                            'Freelancer Cancelled Project', cancelMessagetoAdminHTML), function (err) {
                            if(err){console.log(err)}
                            else{
                                console.log('Freelancer cancelled Message has been sent to Admin')
                                // emailDecode(bookingDetailUpdate.customer.uuid)
                                mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.supplier.uuid),
                                    'Cancellation Confirmed', cancelMessagetoFreelancerHTML), function (err) {
                                    if(err){console.log(err)}
                                    else{
                                        console.log('Freelancer cancelled Message has been sent to Freelancer');
                                        mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.customer.uuid),
                                            'Booking Cancelled', cancelMessagetoClientHTML), function (err) {
                                            if(err){console.log(err)}
                                            else{console.log('Freelancer cancelled Message has been sent to Client')}
                                        });
                                    }
                                });
                            }
                        });

                        socket.emit('Ongoing Project Cancel on Freelancer side', cancelData);
                        socket.broadcast.to(cancelData.clientThatBooked)
                            .emit('Ongoing Project Cancel on Client side', cancelData);
                    })
                }).catch(err => console.log(err));
        })

        socket.on('Booking ongoing Delete - Client Request', cancelData => {
            BookingModel.findOne({bookingID: cancelData.bookingToDeleteID})
                .then(bookingDetailUpdate=>{
                    bookingDetailUpdate.status = 'complete';
                    bookingDetailUpdate.completion.status = 'client-cancelled';

                    let cancelMessagetoClientHTML = '<p>Hello '+bookingDetailUpdate.customer.name.split(' ')[0]+',' +
                        '</p><p> The project has successfully been cancelled. Since it was "booking ongoing", the NxtDue Admnistartion' +
                        ' Team has been informed to take appropriate actions (e.g. Compensantion for the work done thus far).' +
                        ' We are sorry that you decided to cancel the project; please do contact us for any information that' +
                        ' might have led to you cancelling the booking.</p><p>' +
                        ' Project ID: '+ bookingDetailUpdate._id +'</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';

                    let cancelMessagetoFreelancerHTML = '<p>Hello '+bookingDetailUpdate.supplier.name.split(' ')[0]+',' +
                        '</p><p> Unfortunately, '+bookingDetailUpdate.customer.name+' has' +
                        ' decided to cancel the booking ('+bookingDetailUpdate.service+' - '+bookingDetailUpdate.projectName+').' +
                        ' We understand that you might have already done some works, so we will be in contact soon to resolve this' +
                        '. We are sorry for any inconveniences this might have caused.</p><p>' +
                        ' Project ID: '+ bookingDetailUpdate._id +'</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';

                    let cancelMessagetoAdminHTML = '<p>Hello,</p>'+'<p>The client has decided to cancel the project below.'+
                        ' This project was already paid for, so please resolve this (e.g. compensate the freelancer work'+
                        ' done thus far).</p>'+
                        '<ul style="list-style-type:none;">' +
                        `<li>Project ID: ${bookingDetailUpdate._id}</li>`+
                        '<li>Project Name: '+bookingDetailUpdate.service+' - '+bookingDetailUpdate.projectName+' </li>' +
                        '<li>Client Name: '+bookingDetailUpdate.customer.name+' </li>' +
                        '<li>Freelancer Name: '+bookingDetailUpdate.supplier.name+' </li>' +
                        '<li>Creation Date: '+bookingDetailUpdate.creationDate.toLocaleString()+' </li>' +
                        '<li>Due Date: '+bookingDetailUpdate.dueDateTime.toLocaleString()+' </li>' +
                        '<li>Description: '+bookingDetailUpdate.projectDescription+' </li>' +
                        '</ul>'+
                        '</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';


                    bookingDetailUpdate.save(err => {
                        if(err){
                            throw err;
                        }

                        // emailDecode(bookingDetailUpdate.customer.uuid)
                        //emailDecode(bookingDetailUpdate.supplier.uuid)
                        mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                            'Client Cancelled Project', cancelMessagetoAdminHTML), function (err) {
                            if(err){console.log(err)}
                            else{
                                console.log('Client cancelled Message has been sent to Admin')
                                // emailDecode(bookingDetailUpdate.customer.uuid)
                                mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.supplier.uuid),
                                    'Booking Cancelled by Client', cancelMessagetoFreelancerHTML), function (err) {
                                    if(err){console.log(err)}
                                    else{
                                        console.log('Client cancelled Message has been sent to Freelancer');
                                        mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.customer.uuid),
                                            'Cancellation Confirmed', cancelMessagetoClientHTML), function (err) {
                                            if(err){console.log(err)}
                                            else{console.log('Client cancelled Message has been sent to Client')}
                                        });
                                    }
                                });
                            }
                        });

                        socket.emit('Booking ongoing Cancel on Client side', cancelData);
                        socket.broadcast.to(cancelData.freelancerBooked)
                            .emit('Booking ongoing Cancel on Freelancer side', cancelData);

                    })

                }).catch(err=> console.log(err))
        })

        socket.on('Booking Delete - Client Request', deleteData => {
            BookingModel.findOneAndDelete({bookingID: deleteData.bookingToDeleteID})
                .then(bookingDetailUpdate=>{

                    let deleteMessagetoClientHTML = '<p>Hello '+bookingDetailUpdate.customer.name.split(' ')[0]+',' +
                        '</p><p>The project has successfully been cancelled.' +
                        ' We are sorry that you decided to cancel the project; please do contact us for any information that' +
                        ' might have led to you cancelling the booking.</p><p>' +
                        ' Booking ID: '+ bookingDetailUpdate._id +'</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';

                    let deleteMessagetoFreelancerHTML = '<p>Hello '+bookingDetailUpdate.supplier.name.split(' ')[0]+',' +
                        '</p><p> Unfortunately, '+bookingDetailUpdate.customer.name+' has' +
                        ' decided to cancel the booking ('+bookingDetailUpdate.service+' - '+bookingDetailUpdate.projectName+').' +
                        '. We are sorry for any inconveniences this might have caused.</p><p>' +
                        ' Booking ID: '+ bookingDetailUpdate._id +'</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';

                    let deleteMessagetoAdminHTML = '<p>Hello,</p>'+'<p>The following booking has been deleted (it was not ongoing): </p>'+
                        '<ul style="list-style-type:none;">' +
                        `<li>Project ID: ${bookingDetailUpdate._id}</li>`+
                        '<li>Project Name: '+bookingDetailUpdate.service+' - '+bookingDetailUpdate.projectName+' </li>' +
                        '<li>Client Name: '+bookingDetailUpdate.customer.name+' </li>' +
                        '<li>Freelancer Name: '+bookingDetailUpdate.supplier.name+' </li>' +
                        '<li>Creation Date: '+bookingDetailUpdate.creationDate.toLocaleString()+' </li>' +
                        '<li>Due Date: '+bookingDetailUpdate.dueDateTime.toLocaleString()+' </li>' +
                        '<li>Description: '+bookingDetailUpdate.projectDescription+' </li>' +
                        '</ul>'+
                        '<p>Thank you</p><p>The NxtDue Team</p><p>07448804768</p>';

                    // emailDecode(bookingDetailUpdate.customer.uuid)
                    //emailDecode(bookingDetailUpdate.supplier.uuid)
                    mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                        'Client Cancelled Project', deleteMessagetoAdminHTML), function (err) {
                        if(err){console.log(err)}
                        else{
                            console.log('Client cancelled Message has been sent to Admin')
                            // emailDecode(bookingDetailUpdate.customer.uuid)
                            mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.supplier.uuid),
                                'Booking Cancelled by Client', deleteMessagetoFreelancerHTML), function (err) {
                                if(err){console.log(err)}
                                else{
                                    console.log('Client cancelled Message has been sent to Freelancer');
                                    mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(bookingDetailUpdate.customer.uuid),
                                        'Cancellation Confirmed', deleteMessagetoClientHTML), function (err) {
                                        if(err){console.log(err)}
                                        else{console.log('Client cancelled Message has been sent to Client')}
                                    });
                                }
                            });
                        }
                    });

                    socket.emit('Booking Delete on Client side - Client Request', deleteData);
                    socket.broadcast.to(deleteData.freelancerBooked)
                        .emit('Booking Delete on Freelancer side - Client Request', deleteData);

                }).catch(err=> console.log(err))
        })
    });

    router.post('/service-booking/:bookingType/:freelancerToBook', ensureAuthentication, async (req, res)=>{

        let customer = emailEncode(req.user.email);
        let bookingType = req.params.bookingType;
        let freelancerToBook = req.params.freelancerToBook;
        let bookingID = customer+':'+freelancerToBook+':'+Date.now();
        let allowedToSaveBooking = true;
        let bookingData = req.body;
        bookingData.projectsupplier = JSON.parse(bookingData.projectsupplier);

        let timeTo24Hours =
            convertTimeTo24Hours(
                `${bookingData.projectdueTimeHour}:${bookingData.projectdueTimeMinute} ${bookingData.projectdueTimeMeridies}`);
        let bookingDueDateTime = `${bookingData.projectduedate}T${timeTo24Hours}Z`
        bookingDueDateTime = new Date(bookingDueDateTime);

        let newServiceInfos = {
            bookingID: bookingID,
            bookingType: bookingType,
            customer: {
                uuid: customer,
                name: req.user.name+' '+req.user.surname
            },
            supplier: {
                uuid: freelancerToBook,
                name: bookingData.projectsupplier.freelancerName
            },
            service: bookingData.servicename,
            projectName: bookingData.projectname,
            projectDescription: bookingData.projectdescription,
            creationDate: Date.now(),
            dueDateTime: bookingDueDateTime,
            price: bookingData.projectprice,
            requestedPrice: bookingData.projectenquiryprice,
            status: 'awaiting acceptance'
        }

        if (bookingType === 'instant_booking'){
            /* instant booking check if there is another
            booking already with this due date */
            try{
                let freelancerSameDateTimeBookings = await BookingModel.find({
                    dueDateTime: bookingDueDateTime,
                    'supplier.uuid': freelancerToBook,
                    paid: true
                });
                if(freelancerSameDateTimeBookings.length>0){
                    // there is at least one booking with the exact due date
                    // the specified freelancer
                    allowedToSaveBooking = false;
                }
            }catch (e) {
                throw e;
            }
        }

        if (allowedToSaveBooking){

            // Save into booking DB
            let newServiceBooking = new BookingModel(newServiceInfos);

            let newBookingMessageToClientHTML = '<h1 style="color: #213e53; font-size: 1.1rem">New Booking</h1>'+
                '<p>Hello '+newServiceBooking.customer.name.split(' ')[0]+',</p><p>This is a confirmation' +
                ' email that your booking enquiry ('+ newServiceBooking.service+' - ' +newServiceBooking.projectName
                +') has successfully been sent to '+ newServiceBooking.supplier.name +'. Please do keep a close' +
                ' eye on your emails and <a target="_blank" style="text-decoration: underline; color: #0645AD;' +
                ' cursor: pointer" href='+ nxtDueLoginURL +'> login </a> regulary to check for updates' +
                ' on your booking (booking ID: '+ newServiceBooking._id +') </p>'+'<p>Thank you,<br>The NxtDue Team' +
                '<br>07448804768</p>';

            let newBookingMessageToFreelancerHTML = '<h1 style="color: #213e53; font-size: 1.1rem">New Booking Received</h1>'+
                '<p>Hello '+newServiceBooking.supplier.name.split(' ')[0]+',</p><p> I am pleased to inform you that' +
                ' you have a new booking on your NxtDue account. The booking ID is: '+ newServiceBooking._id +' .' +
                ' Please <a target="_blank" style="text-decoration: underline;' +
                ' color: #0645AD; cursor: pointer" href='+ nxtDueLoginURL +'> login </a>' +
                ' to your account to access the details of this booking and accept or reject it.</p>'+
                '<p>Thank you,<br>The NxtDue Team <br>07448804768</p>';

            let newBookingMessageToAdminHTML = '<h1 style="color: #213e53; font-size: 1.1rem">New Booking Made</h1>'+
                '<p>Hello,</p>'+'<p> There has been a new booking made, please do find details below: </p>'+
                '<ul style="list-style-type:none;">' +
                `<li>Project ID: ${newServiceBooking._id}</li>`+
                '<li>Project Name: '+newServiceBooking.service+' - '+newServiceBooking.projectName+' </li>' +
                '<li>Client Name: '+newServiceBooking.customer.name+' </li>' +
                '<li>Freelancer Name: '+newServiceBooking.supplier.name+' </li>' +
                '<li>Creation Date: '+newServiceBooking.creationDate.toLocaleString()+' </li>' +
                '<li>Due Date: '+newServiceBooking.dueDateTime.toLocaleString()+' </li>' +
                '<li>Description: '+newServiceBooking.projectDescription+' </li>' +
                '</ul>'+
                '<p>Thank you<br>The NxtDue Team<br>07448804768</p>';

            newServiceBooking.save(err =>{
                if (err) {throw err}
                else{
                    if(bookingType === 'instant_booking'){
                        // go to payment
                        let paymentRoute = `${domainName}/payment/create-checkout-session/booking-checkout?bookingID=${bookingID}`;
                        res.status(200).json({paymentRoute: paymentRoute})

                    }else if (bookingType === 'request_booking'){
                        // send booking details to freelancer and redirect to profile page

                        mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                            'New Booking Made', newBookingMessageToAdminHTML), function (err) {
                            if(err){console.log(err)}
                            else{
                                console.log('Client new booking Message has been sent to Admin')
                                // emailDecode(bookingDetailUpdate.customer.uuid)
                                mailer.smtpTransport.sendMail(mailer.mailerFunction(emailDecode(freelancerToBook),
                                    'Client Booking Made', newBookingMessageToFreelancerHTML), function (err) {
                                    if(err){console.log(err)}
                                    else{
                                        console.log('Client new booking Message has been sent to Freelancer');
                                        mailer.smtpTransport.sendMail(mailer.mailerFunction(req.user.email,
                                            'Booking Successfully Made', newBookingMessageToClientHTML), function (err) {
                                            if(err){console.log(err)}
                                            else{console.log('Client new booking Message has been sent to Client')}
                                        });
                                    }
                                });
                            }
                        });

                        io.sockets.to(freelancerToBook).emit('Booking Data to Freelancer', newServiceInfos);
                        res.redirect(`${domainName}/account/${req.user.user_stature}/${customer}`);
                    }
                }
            })
        }else{
            // Error - Booking Not saved
            res.status(404).json({error: `${bookingData.projectsupplier.freelancerName} is already booked for that time. (Please pick another time or send Request)!`})
        }
    })

    return router;
}

module.exports = {router, server_io};