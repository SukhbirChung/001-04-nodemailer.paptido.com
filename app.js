if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const ejs = require('ejs');
const fs = require('fs');
const resetLinkBase = process.env.RESETLINK;

const app = express();

app.use(express.json());
app.use(cors());

function createConfigurations(comingFrom) {
    const configurations = {
        host: comingFrom === 'starbeautyartistry' ? process.env.STARBEAUTYARTISTRYHOSTNAME : process.env.HOSTNAME,
        port: process.env.PORT,
        secure: true,
        auth: {
            user: comingFrom === 'starbeautyartistry' ? process.env.STARBEAUTYARTISTRYEMAIL : process.env.EMAIL,
            pass: comingFrom === 'starbeautyartistry' ? process.env.STARBEAUTYARTISTRYPASS : process.env.PASS
        }
    };

    return configurations;
}

function setDestination(comingFrom) {
    if (comingFrom === 'paptido') {
        return process.env.TOP;
    }
    else if (comingFrom === 'portfolio') {
        return process.env.TOPORTFOLIO;
    } else if (comingFrom === 'starbeautyartistry') {
        return process.env.KULDEEPEMAIL;
    }
    return process.env.TO
}

const sendEmail = (req, res) => {
    req.transporter.sendMail(req.mailOptions, function (error, info) {
        if (error) {
            return res.status(500).send({ error: 'Failed to send email' });
        } else {
            res.send(`${req.confirmationCode}`);
        }
    });

    res.header("Access-Control-Allow-Origin", "*");
}

app.post('/', (req, res, next) => {
    const { comingFrom, name, email, message, subject, phone } = req.body;
    const configurations = createConfigurations(comingFrom);
    const transporter = nodemailer.createTransport(configurations);

    let emailText = '';
    if (email) {
        emailText = `Email: ${email}`;
    }
    let phoneText = '';
    if (phone) {
        phoneText = `Phone: ${[phone]}`;
    }

    const mailOptions = {
        from: comingFrom === 'starbeautyartistry' ? process.env.STARBEAUTYARTISTRYEMAIL : process.env.EMAIL,
        to: setDestination(comingFrom),
        subject: subject,
        text: `Name: ${name}
${emailText}
${phoneText}

Message: ${message}`
    };

    req.mailOptions = mailOptions;
    req.transporter = transporter;
    req.confirmationCode = "Email sent successfully";

    next();
}, sendEmail);

app.post('/confirmation', (req, res, next) => {
    const email = req.body.email;
    const configurations = createConfigurations('');
    const transporter = nodemailer.createTransport(configurations);
    const confirmationCode = Math.floor(100000 + Math.random() * 900000);
    const emailBody = `<p style="border-radius: 8px; padding: 8px; text-align: center; background-color: pink;">Your confirmation code is:<br><span style="font-size: 20px;">${confirmationCode}</span></p>`;

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Confirmation Code',
        html: emailBody
    };

    req.mailOptions = mailOptions;
    req.transporter = transporter;
    req.confirmationCode = confirmationCode;

    next();
}, sendEmail);

app.post('/sendResetLink', async (req, res, next) => {
    const { email, resetToken } = req.body;

    const configurations = createConfigurations('');
    const transporter = nodemailer.createTransport(configurations);

    const resetLink = `${resetLinkBase}?token=${resetToken}`;
    const emailBody = `<p style="border-radius: 8px; padding: 8px; background-color: pink;">Click the following link to reset your password:<br>Link expires in 1 hour.<br><a href="${resetLink}">${resetLink}</a></p>`;
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Password Reset',
        html: emailBody
    }

    req.mailOptions = mailOptions;
    req.transporter = transporter;
    req.confirmationCode = 'Password reset email sent.';
    next();
}, sendEmail);

app.post('/starbeautyartistrypendingappointmentrequest', async (req, res, next) => {
    const { name } = req.body;
    const configurations = createConfigurations('starbeautyartistry');
    const transporter = nodemailer.createTransport(configurations);

    // Get access to the ejs template
    fs.readFile('email-templates/star-beauty-artistry-appointment-request.ejs', 'utf8', (err, template) => {
        if (err) {
            console.log(err);
            return;
        }

        const htmlContent = ejs.render(template, req.body);
        const mailOptions = {
            from: process.env.STARBEAUTYARTISTRYEMAIL,
            to: process.env.KULDEEPEMAIL,
            subject: `${name} sent an appointment request`,
            html: htmlContent
        };

        req.mailOptions = mailOptions;
        req.transporter = transporter;
        req.confirmationCode = "Appointment request email sent successfully to the owner";

        next();
    });
}, sendEmail);

app.listen(3000, () => console.log("Listening..."));