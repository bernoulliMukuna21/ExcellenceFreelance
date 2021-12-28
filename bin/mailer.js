var nodemailer = require('nodemailer');

let smtpTransport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth:{
        type: 'OAuth2',
        user: 'mmbernoulli@gmail.com',
        clientId: process.env.google_clientID,
        clientSecret: process.env.google_secretID,
        refreshToken: process.env.google_refreshToken,
        accessToken: null,
        expires: 1484314697598
    },
    tls: { rejectUnauthorized: false }
});
function mailerFunction(recipientEmail, subject, messageHTML) {
    let mailOptions = {
        to: recipientEmail,
        from: 'mmbernoulli@gmail.com',
        subject: subject,
        html: messageHTML
    };
    return mailOptions;
}
module.exports = {smtpTransport, mailerFunction}
