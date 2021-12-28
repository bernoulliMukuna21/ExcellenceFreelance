var express = require('express');
var router = express.Router();
var BookingModel = require('../models/BookingModel');
var mailer = require('../bin/mailer');
var { ensureAuthentication } = require('../bin/authentication');
var { emailEncode, emailDecode } = require('../bin/encodeDecode');
var { convertTimeTo24Hours } = require('../bin/general-helper-functions');

let domain = 'http://localhost:3000';
//let domain = 'https://excellence-freelance.herokuapp.com';

function server_io(io) {
    io.on('connection', socket=>{

        socket.on('Booking Form Data', BookingData => {
            socket.broadcast.to(BookingData.supplier.uuid)
                .emit('Booking Data to Freelancer', BookingData);
        })

        socket.on('Accept project', AcceptData => {
            BookingModel.findOne({bookingID: AcceptData.bookingToAcceptID})
                .then(bookingDetailUpdate =>{
                    bookingDetailUpdate.status = AcceptData['status'] = 'awaiting payment';
                    bookingDetailUpdate.price = bookingDetailUpdate.requestedPrice;

                    socket.emit('Accept project on Freelancer side', AcceptData);
                    socket.broadcast.to(AcceptData.clientThatBooked)
                        .emit('Accept project on Client side', {
                            bookingToAcceptID: AcceptData.bookingToAcceptID,
                            clientThatBooked: AcceptData.clientThatBooked});

                    /*bookingDetailUpdate.save(err => {
                        if(err){
                            throw err;
                        }
                        socket.emit('Accept project on Freelancer side', AcceptData);
                        socket.broadcast.to(AcceptData.clientThatBooked)
                            .emit('Accept project on Client side', AcceptData);
                    })*/

                }).catch(err => console.log(err));
        })

        socket.on('Project Completion Finish', finishData => {
            // UpdateDB, Send Email to both Clent and Adminstration and live update
            // on client side

            BookingModel.findOne({bookingID: finishData.bookingFinishID})
                .then(bookingDetailUpdate =>{
                    bookingDetailUpdate.status = 'complete';
                    bookingDetailUpdate.completion.status = 'request completion';

                    socket.emit('Booking Completion - Request to Freelancer', finishData);
                    socket.broadcast.to(bookingDetailUpdate.customer.uuid)
                        .emit('Booking Completion - Request to Client', finishData);

                    /*let messageToAdminHTML = '<h1 style="color: #213e53; font-size: 1.1rem">Project Completed</h1>'+
                        '<p>'+bookingDetailUpdate.supplier.name+' has completed the project ('+
                        bookingDetailUpdate.service+' - '+ bookingDetailUpdate.projectName+'). However, this'+
                        ' is yet to be confirmed by the client. Once there has been a confirmation from'+
                        ' the client, a follow up email will inform you.</p>'+'<p ' +
                        'style="margin-top: 5rem">Thank you very much,<br>Bernoulli Mukuna(Dev. Lead)</p>';

                    let messageToClientHTML = '<h1 style="color: #213e53; font-size: 1.1rem">Project Completed</h1>'+
                        '<p>'+bookingDetailUpdate.supplier.name+' has completed your project ('+
                        bookingDetailUpdate.service+' - '+ bookingDetailUpdate.projectName+
                        '). We will need your confirmation on this information. If we do not hear from you'+
                        ' in the next three days, we will assume that the project has been successfully delivered.'+
                        ' This will also mean that we get to pay '+ bookingDetailUpdate.supplier.name +' for the work.'+
                        '</p><p> Please <a target="_blank" style="text-decoration: underline;'+
                        'color: #0645AD; cursor: pointer" '+ 'href="http://localhost:3000/users/login">'+
                        'login'+ '</a> to your account to confirm or deny this update</p>'+'<p style="margin-top: 5rem">'+
                        'Admnistration Team<br>07448804768</p>';

                    mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                        'Booking Completion Information', messageToAdminHTML), function (err) {
                        if(err){console.log(err)}
                        else{console.log('Message has been sent')}
                    });

                    // emailDecode(bookingDetailUpdate.customer.uuid)
                    mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                        'Booking Completed - Request', messageToClientHTML), function (err) {
                        if(err){console.log(err)}
                        else{console.log('Message has been sent')}
                    });*/


                    /*bookingDetailUpdate.save(err => {
                        if(err){
                            throw err;
                        }
                        socket.emit('Accept project on Freelancer side', AcceptData);
                        socket.broadcast.to(AcceptData.clientThatBooked)
                            .emit('Accept project on Client side', AcceptData);
                    })*/

                }).catch(err => console.log(err));

        })

        socket.on('Completion Confirmed', completionData => {
            BookingModel.findOne({bookingID: completionData.bookingCompletionConfirmedID})
                .then(bookingDetailUpdate =>{
                    bookingDetailUpdate.completion.status = 'confirmed';

                    socket.emit('Booking Completion Confirmation - to Client', completionData);
                    socket.broadcast.to(bookingDetailUpdate.supplier.uuid)
                        .emit('Booking Completion Confirmation - to Freelancer', completionData);

                    /*let payoutSum = (bookingDetailUpdate.price - ((5/ 100) * bookingDetailUpdate.price)).toFixed(2);
                    let confirmationMessagetoAdminHTML = '<p>Hello,</p>'+'<p>We have a confirmation'+
                        ' of the completion of the project below (please proceed with the pay out):</p>'+
                        '<ul style="list-style-type:none; margin-top: 1.5rem; font-size: 1.3rem;">' +
                        `<li>Project ID: ${bookingDetailUpdate._id}</li>`+
                        '<li style="margin-top: 1.5rem; font-size: 1.3rem">Project Name: '+bookingDetailUpdate.service+' - '+bookingDetailUpdate.projectName+' </li>' +
                        '<li style="margin-top: 1.5rem; font-size: 1.3rem">Client Name: '+bookingDetailUpdate.customer.name+' </li>' +
                        '<li style="margin-top: 1.5rem; font-size: 1.3rem">Freelancer Name: '+bookingDetailUpdate.supplier.name+' </li>' +
                        '<li style="margin-top: 1.5rem; font-size: 1.3rem">Creation Date: '+bookingDetailUpdate.creationDate.toLocaleString()+' </li>' +
                        '<li style="margin-top: 1.5rem; font-size: 1.3rem">Due Date: '+bookingDetailUpdate.dueDateTime.toLocaleString()+' </li>' +
                        '<li style="margin-top: 1.5rem; font-size: 1.3rem">Description: '+bookingDetailUpdate.projectDescription+' </li>' +
                        '<li style="margin-top: 1.5rem; font-size: 1.3rem">Payout Sum: £'+payoutSum+' </li>' +
                        '</ul>'+
                        '<p>Thank you<br>The NxtDue Team<br>07448804768</p>';

                    let confirmationMessagetoFreelancerHTML = '<h1 style="color: #213e53; font-size: 1.1rem">' +
                        'Congratulations</h1>' + '<p>Hello '+bookingDetailUpdate.supplier.name.split(' ')[0]+',</p><p>Congratulations on the completion of ' +
                        'the project! We have received the confirmation from '+bookingDetailUpdate.customer.name+'.  Please expect to receive ' +
                        'your earning of £'+payoutSum+' in the next three days.</p><p> Project ID:'+
                        bookingDetailUpdate._id +'</p><p>Thank you,<br>The NxtDue ' +
                        'Team<br>07448804768</p>';

                    mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                        'Booking Completion Confirmation', confirmationMessagetoAdminHTML), function (err) {
                        if(err){console.log(err)}
                        else{
                            console.log('Confirmation Message has been sent to Admin');
                            // emailDecode(bookingDetailUpdate.customer.uuid)
                            mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                                'Client confirmation', confirmationMessagetoFreelancerHTML), function (err) {
                                if(err){console.log(err)}
                                else{console.log('Confirmation Message has been sent to Client')}
                            });
                        }
                    });*/

                    /*bookingDetailUpdate.save(err => {
                        if(err){
                            throw err;
                        }
                    })*/
                }).catch(err => console.log(err));
        })

        socket.on('Completion Conflict', completionData => {
            BookingModel.findOne({bookingID: completionData.bookingCompletionConflictID})
                .then(bookingDetailUpdate =>{
                    bookingDetailUpdate.completion.status = 'conflict';

                    socket.emit('Booking Completion Conflict - to Client', completionData);
                    socket.broadcast.to(bookingDetailUpdate.supplier.uuid)
                        .emit('Booking Completion Conflict - to Freelancer', completionData);

                    /*let payoutSum = (bookingDetailUpdate.price - ((5/ 100) * bookingDetailUpdate.price)).toFixed(2);
                    let conflictMessagetoAdminHTML = '<p>Hello,</p>'+'<p>A conflict has occurred on one of the' +
                        ' project. Please do find the project\'s details below, and solve this at the earliest' +
                        ' opportunity:'+
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
                        ' informed us that the work has not been completed. This could simply be a miscommunication,' +
                        ' so do not panic. Please do keep a close eye  on your inbox as the administration will be' +
                        ' contacting you very soon. You can also call on <b>07448804768</b> to speak to our staff.' +
                        ' We are sorry for any inconveniences this might have caused.</p><p> Project ID: '+
                        bookingDetailUpdate._id +'</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';

                    mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                        'Booking Completion Conflict', conflictMessagetoAdminHTML), function (err) {
                        if(err){console.log(err)}
                        else{
                            console.log('Conflict Message has been sent to Admin')
                            // emailDecode(bookingDetailUpdate.customer.uuid)
                            mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                                'Confirmation Conflict', conflictMessagetoFreelancerHTML), function (err) {
                                if(err){console.log(err)}
                                else{console.log('Conflict Message has been sent to Freelancer')}
                            });
                        }
                    });*/

                    /*bookingDetailUpdate.save(err => {
                        if(err){
                            throw err;
                        }
                    })*/
                }).catch(err => console.log(err));
        })

        socket.on('Delete project', deleteData => {
            if(!deleteData.clientThatBooked){
                // Client looking to delete project
                socket.emit('Delete project on Client side', deleteData);
                socket.broadcast.to(deleteData.freelancerBooked)
                    .emit('Delete project on Freelancer side', deleteData);

            }else if (!deleteData.freelancerBooked){
                // Freelancer looking to delete project
                socket.emit('Delete project on Freelancer side', deleteData);
                socket.broadcast.to(deleteData.clientThatBooked)
                    .emit('Delete project on Client side', deleteData);
            }

            /*BookingModel.deleteOne({bookingID: deleteData.bookingToDeleteID}, function(err, obj) {
                if (err) throw err;
                if(!deleteData.clientThatBooked){
                    // Client looking to delete project
                    socket.emit('Delete project on Client side', deleteData);
                    socket.broadcast.to(deleteData.freelancerBooked)
                        .emit('Delete project on Freelancer side', deleteData);

                }else if (!deleteData.freelancerBooked){
                    // Freelancer looking to delete project
                    socket.emit('Delete project on Freelancer side', deleteData);
                    socket.broadcast.to(deleteData.clientThatBooked)
                        .emit('Delete project on Client side', deleteData);
                }
            });*/
        })

        socket.on('Ongoing Project Cancel - Freelancer', cancelData => {
            BookingModel.findOne({bookingID: cancelData.projectToCancelID})
                .then(bookingDetailUpdate =>{
                    bookingDetailUpdate.completion.status = 'cancel';

                    socket.emit('Ongoing Project Cancel on Freelancer side', cancelData);
                    socket.broadcast.to(cancelData.clientThatBooked)
                        .emit('Ongoing Project Cancel on Client side', cancelData);

                    /*let cancelMessagetoClientHTML = '<p>Hello '+bookingDetailUpdate.customer.name.split(' ')[0]+',' +
                        '</p><p> Unfortunately, '+bookingDetailUpdate.supplier.name+' has' +
                        ' decided to cancel the booking ('+bookingDetailUpdate.service+' - '+bookingDetailUpdate.projectName+')' +
                        ' . We are sorry for any inconveniences this might have caused. You can call us on 07448804768 for any emergency' +
                        ' bookings.</p><p>' +
                        ' Project ID: '+ bookingDetailUpdate._id +'</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';

                    // emailDecode(bookingDetailUpdate.customer.uuid)
                    mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                        `Project Cancel (${bookingDetailUpdate.service+' - '+bookingDetailUpdate.projectName})`,
                        cancelMessagetoClientHTML), function (err) {
                        if(err){console.log(err)}
                        else{console.log('Cancellation Message has been sent to Client')}
                    });*/
                }).catch(err => console.log(err));

            /*let cancelMessagetoFreelancerHTML = '<p>Hello '+bookingDetailUpdate.supplier.name.split(' ')[0]+',' +
                '</p><p> Unfortunately, '+bookingDetailUpdate.customer.name+' has' +
                ' decided to cancel the booking ('+bookingDetailUpdate.service+' - '+bookingDetailUpdate.projectName+')' +
                ' . We are sorry for any inconveniences this might have caused.</p><p>' +
                ' Project ID: '+ bookingDetailUpdate._id +'</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';*/

            /*bookingDetailUpdate.save(err => {
                        if(err){
                            throw err;
                        }
            })*/
        })

        socket.on('Booking ongoing Delete - Client Request', cancelData => {
            console.log('Project to Cancel: ', cancelData);
            BookingModel.findOne({bookingID: cancelData.bookingToDeleteID})
                .then(bookingDetailUpdate=>{

                    socket.emit('Booking ongoing Cancel on Client side', cancelData);
                    socket.broadcast.to(cancelData.freelancerBooked)
                        .emit('Booking ongoing Cancel on Freelancer side', cancelData);

                    /*let cancelMessagetoClientHTML = '<p>Hello '+bookingDetailUpdate.customer.name.split(' ')[0]+',' +
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

                    let cancelMessagetoAdminHTML = '<p>Hello,</p>'+'<p>A conflict has occurred on one of the' +
                        ' project. Please do find the project\'s details below, and solve this at the earliest' +
                        ' opportunity:'+
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

                    mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                        'Client Cancelled Project', cancelMessagetoAdminHTML), function (err) {
                        if(err){console.log(err)}
                        else{
                            console.log('Client cancelled Message has been sent to Admin')
                            // emailDecode(bookingDetailUpdate.customer.uuid)
                            mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                                'Booking Cancelled by Client', cancelMessagetoFreelancerHTML), function (err) {
                                if(err){console.log(err)}
                                else{
                                    console.log('Client cancelled Message has been sent to Freelancer');
                                    mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                                        'Cancellation Confirmed', cancelMessagetoClientHTML), function (err) {
                                        if(err){console.log(err)}
                                        else{console.log('Client cancelled Message has been sent to Client')}
                                    });
                                }
                            });
                        }
                    });*/
                }).catch(err=> console.log(err))
        })

        socket.on('Booking Delete - Client Request', deleteData => {
            console.log('Project to Delete: ', deleteData);
            BookingModel.findOne({bookingID: deleteData.bookingToDeleteID})
                .then(bookingDetailUpdate=>{

                    socket.emit('Booking Delete on Client side - Client Request', deleteData);
                    socket.broadcast.to(deleteData.freelancerBooked)
                        .emit('Booking Delete on Freelancer side - Client Request', deleteData);

                    /*let cancelMessagetoClientHTML = '<p>Hello '+bookingDetailUpdate.customer.name.split(' ')[0]+',' +
                        '</p><p> The project has successfully been cancelled.' +
                        ' We are sorry that you decided to cancel the project; please do contact us for any information that' +
                        ' might have led to you cancelling the booking.</p><p>' +
                        ' Project ID: '+ bookingDetailUpdate._id +'</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';

                    let cancelMessagetoFreelancerHTML = '<p>Hello '+bookingDetailUpdate.supplier.name.split(' ')[0]+',' +
                        '</p><p> Unfortunately, '+bookingDetailUpdate.customer.name+' has' +
                        ' decided to cancel the booking ('+bookingDetailUpdate.service+' - '+bookingDetailUpdate.projectName+').' +
                        '. We are sorry for any inconveniences this might have caused.</p><p>' +
                        ' Project ID: '+ bookingDetailUpdate._id +'</p><p>Thank you,<br>The NxtDue Team<br>07448804768</p>';

                     mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                        'Booking Cancelled by Client', cancelMessagetoFreelancerHTML), function (err) {
                        if(err){console.log(err)}
                        else{
                            console.log('Client cancelled Message has been sent to Freelancer');
                            mailer.smtpTransport.sendMail(mailer.mailerFunction('mukunabernoulli@yahoo.com',
                                'Cancellation Confirmed', cancelMessagetoClientHTML), function (err) {
                                if(err){console.log(err)}
                                else{console.log('Client cancelled Message has been sent to Client')}
                            });
                        }
                    });*/
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
        console.log('------------------------------------------------------------------')
        console.log(bookingDueDateTime)
        bookingDueDateTime = new Date(bookingDueDateTime);
        console.log(bookingDueDateTime)
        console.log(bookingData)
        console.log('------------------------------------------------------------------')
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
            newServiceBooking.save(err =>{
                if (err) {throw err}
                else{
                    if(bookingType === 'instant_booking'){
                        // go to payment
                        let paymentRoute = `${domain}/payment/create-checkout-session/booking-checkout?bookingID=${bookingID}`;
                        res.status(200).json({paymentRoute: paymentRoute})

                    }else if (bookingType === 'request_booking'){
                        // send booking details to freelancer and redirect to profile page
                        io.sockets.to(freelancerToBook).emit('Booking Data to Freelancer', newServiceInfos)
                        res.redirect(`${domain}/account/${req.user.user_stature}/${customer}`);
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