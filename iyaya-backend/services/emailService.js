const nodemailer = require('nodemailer');

// Create transporter using Mailtrap configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
    }
});

const emailService = {
    /**
     * Send an email
     * @param {Object} options - Email options
     * @param {string} options.to - Recipient email
     * @param {string} options.subject - Email subject
     * @param {string} options.text - Plain text content
     * @param {string} [options.html] - HTML content (optional)
     * @returns {Promise}
     */
    sendEmail: async ({ to, subject, text, html }) => {
        try {
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                to,
                subject,
                text,
                html: html || text
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Email sent:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    },

    /**
     * Send verification email
     * @param {string} to - Recipient email
     * @param {string} token - Verification token
     * @returns {Promise}
     */
    sendVerificationEmail: async (to, token) => {
        const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
        
        return emailService.sendEmail({
            to,
            subject: 'Email Verification - Iyaya',
            text: `Please verify your email by clicking this link: ${verificationUrl}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a6baf;">Welcome to Iyaya!</h2>
                    <p>Please verify your email address by clicking the button below:</p>
                    <a href="${verificationUrl}" 
                       style="display: inline-block; padding: 10px 20px; background-color: #4a6baf; color: white; text-decoration: none; border-radius: 5px;">
                        Verify Email
                    </a>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all;">${verificationUrl}</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `
        });
    },

    // Add other email templates as needed...
};

module.exports = emailService;