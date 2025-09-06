const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      if (process.env.NODE_ENV === 'production' && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        // Production email configuration
        this.transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
      } else {
        // Development: Use Ethereal Email for testing
        this.createTestAccount();
      }
    } catch (error) {
      console.warn('⚠️ Email transporter initialization failed:', error.message);
      this.transporter = null;
    }
  }

  async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('📧 Test email account created:', testAccount.user);
    } catch (error) {
      console.warn('⚠️ Failed to create test email account:', error.message);
    }
  }

  async sendPasswordResetEmail(email, resetToken) {
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:19006'}/reset-password/${resetToken}`;
    
    // If no transporter available, log to console
    if (!this.transporter) {
      console.log('📧 Password reset email (console fallback):');
      console.log(`To: ${email}`);
      console.log(`Reset URL: ${resetURL}`);
      console.log('Token expires in 10 minutes');
      return { success: true, messageId: 'console-fallback' };
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@iyaya.com',
      to: email,
      subject: 'Password Reset Request - iYaya',
      html: this.getPasswordResetTemplate(resetURL),
      text: `Reset your password by clicking this link: ${resetURL}\n\nThis link expires in 10 minutes.\n\nIf you didn't request this, please ignore this email.`
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Password reset email sent');
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Email send failed:', error.message);
      
      // Fallback to console logging
      console.log('📧 Password reset email (fallback):');
      console.log(`To: ${email}`);
      console.log(`Reset URL: ${resetURL}`);
      console.log('Token expires in 10 minutes');
      
      return { success: true, messageId: 'console-fallback' };
    }
  }

  getPasswordResetTemplate(resetURL) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - iYaya</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #fce8f4 0%, #f3e8ff 100%); padding: 30px; border-radius: 10px; text-align: center;">
            <h1 style="color: #db2777; margin-bottom: 10px;">iYaya</h1>
            <h2 style="color: #374151; margin-bottom: 30px;">Password Reset Request</h2>
        </div>
        
        <div style="padding: 30px 0;">
            <p>Hello,</p>
            <p>You requested a password reset for your iYaya account. Click the button below to reset your password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetURL}" 
                   style="background-color: #db2777; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Reset Password
                </a>
            </div>
            
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 5px; font-family: monospace;">
                ${resetURL}
            </p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
                <p style="margin: 0; color: #92400e;"><strong>Important:</strong></p>
                <ul style="margin: 10px 0; color: #92400e;">
                    <li>This link expires in <strong>10 minutes</strong></li>
                    <li>You can only use this link once</li>
                    <li>Your new password must be at least ${process.env.NODE_ENV === 'production' ? '12' : '8'} characters long</li>
                </ul>
            </div>
            
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            
            <p>For security reasons, we recommend:</p>
            <ul>
                <li>Using a strong, unique password</li>
                <li>Including uppercase, lowercase, numbers, and symbols</li>
                <li>Not reusing passwords from other accounts</li>
            </ul>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
            <p>This email was sent by iYaya - Nanny & Employer Matching App</p>
            <p>If you have questions, please contact our support team.</p>
        </div>
    </body>
    </html>
    `;
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('✅ Email service ready');
      return true;
    } catch (error) {
      console.error('❌ Email service verification failed:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();