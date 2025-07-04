const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const EMAIL_FROM = process.env.EMAIL_USER;

const transporter = nodemailer.createTransport({
    service: 'gmail', // SMTP service
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function generateAndSendVerification(user, req) {
    const token = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = token;
    user.emailVerificationExpires = Date.now() + 3600000; // 1 saat
    user.status = 'pending';

    await user.save();

    const verificationUrl = `${process.env.BASE_URL}/users/verify-email?token=${token}`;

    const mailOptions = {
        to: user.email,
        from: EMAIL_FROM,
        subject: 'Weatherio Email Verification',
        html: `
            <p>Welcome to Weatherio!</p>
            <p>Please verify your email by clicking the link below:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
        `
    };

    await transporter.sendMail(mailOptions);
}

async function verifyUserByToken(token) {
    const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
    });
    if (!user) return null;

    user.status = 'active';
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    return user;
}

module.exports = { generateAndSendVerification, verifyUserByToken };