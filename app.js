if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const resetLinkBase = process.env.RESETLINK;

const app = express();

app.use(express.json());
app.use(cors());

const configurations = {
    host: process.env.HOSTNAME,
    port: process.env.PORT,
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS
    }
};

const transporter = nodemailer.createTransport(configurations);

function setDestination(comingFrom) {
    if (comingFrom === 'paptido') {
        return process.env.TOP;
    }
    else if (comingFrom === 'portfolio') {
        return process.env.TOPORTFOLIO;
    }
    return process.env.TO
}

const sendEmail = (req, res) => {
    transporter.sendMail(req.mailOptions, function (error, info) {
        if (error) {
            res.send(error);
        } else {
            res.send(`${req.confirmationCode}`);
        }
    });

    res.header("Access-Control-Allow-Origin", "*");
}

app.post('/', (req, res, next) => {
    const { comingFrom, name, email, message, subject, course } = req.body;

    const mailOptions = {
        from: process.env.EMAIL,
        to: setDestination(comingFrom),
        subject: !comingFrom ? `Form query received: ${course}` : subject,
        text: `Name: ${name}
Email: ${email}
Message: ${message}`
    };

    req.mailOptions = mailOptions;
    next();
}, sendEmail);

app.post('/confirmation', (req, res, next) => {
    const email = req.body.email;
    const confirmationCode = Math.floor(100000 + Math.random() * 900000);
    const emailBody = `<p style="border-radius: 8px; padding: 8px; text-align: center; background-color: pink;">Your confirmation code is:<br><span style="font-size: 20px;">${confirmationCode}</span></p>`;

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Confirmation Code',
        html: emailBody
    };

    req.mailOptions = mailOptions;
    req.confirmationCode = confirmationCode;
    next();
}, sendEmail);

app.post('/studentAccountConfirmation', (req, res, next) => {
    const email = req.body.email;
    
    const paptidoConfigurations = {
        host: process.env.PAPTIDOHOSTNAME,
        port: process.env.PORT,
        secure: true,
        auth: {
            user: process.env.PAPTIDOEMAIL,
            pass: process.env.PAPTIDOPASS
        }
    };
    
    const paptidoTransporter = nodemailer.createTransport(paptidoConfigurations);

    const confirmationCode = Math.floor(100000 + Math.random() * 900000);
    const emailBody = `<p style="border-radius: 8px; padding: 8px; text-align: center; background-color: pink;">Your confirmation code is:<br><span style="font-size: 20px;">${confirmationCode}</span></p>
    <pre style="font-size: 16px; font-family: 'Helvetica', 'Arial', sans-serif;">
Regards,
Paptido
<a href='https://paptido.com'>https://paptido.com</a></pre>`;

    const paptidoMailOptions = {
        from: `"Paptido" <${process.env.PAPTIDOEMAIL}>`,
        to: email,
        subject: 'Confirmation Code',
        html: emailBody
    };

    paptidoTransporter.sendMail(paptidoMailOptions, function (error, info) {
        if (error) {
            res.status(error.responseCode).send(error.response);
        } else {
            res.send(`${confirmationCode}`);
        }
    });

    res.header("Access-Control-Allow-Origin", "*");
});

app.post('/sendResetLink', async (req, res, next) => {
    const {email, resetToken} = req.body;

    const resetLink = `${resetLinkBase}?token=${resetToken}`;
    const emailBody = `<p style="border-radius: 8px; padding: 8px; background-color: pink;">Click the following link to reset your password:<br>Link expires in 1 hour.<br><a href="${resetLink}">${resetLink}</a></p>`;
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Password Reset',
        html: emailBody
    }

    req.mailOptions = mailOptions;
    req.confirmationCode = 'Password reset email sent.';
    next();
}, sendEmail);

app.listen(3000, () => console.log("Listening..."));