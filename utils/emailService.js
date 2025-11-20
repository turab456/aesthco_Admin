const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.authTransporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      logger: false,
      debug: false
    });

    this.authTransporter.verify().then(() => {
      console.log('[EmailService] Auth transporter ready');
    }).catch((err) => {
      console.error('[EmailService] Auth transporter verification failed:', err && err.message ? err.message : err);
    });
  }

  async sendVerificationEmail(email, otp, firstName) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Verify Your Email Address',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #fdfdfd; font-family: Arial, sans-serif;">
            <table width="100%" border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="padding: 20px;">
                  <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #000000;">
                    <tr>
                      <td align="center" style="background-color: #000000; padding: 40px 20px;">
                        <h1 style="color: #ffffff; font-size: 36px; margin: 0;">Hoodie Store</h1>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding: 40px 30px; color: #000000; text-align: center;">
                        <h2 style="font-size: 24px; margin-top: 0; margin-bottom: 20px;">Email Verification</h2>
                        <p style="font-size: 16px; margin-bottom: 20px;">Hi ${firstName},</p>
                        <p style="font-size: 16px; margin-bottom: 30px;">Please use the code below to verify your email address.</p>
                        <div style="border: 2px solid #000000; padding: 20px; margin: 30px auto; max-width: 250px;">
                          <p style="font-size: 48px; font-weight: 500; color: #000000; letter-spacing: 10px; margin: 0;">
                            ${otp}
                          </p>
                        </div>
                        <p style="font-size: 14px; color: #555555;">This code will expire in 10 minutes.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
      };

      return await this.authTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(email, otp, firstName) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Your Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #fdfdfd; font-family: Arial, sans-serif;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td align="center" style="padding: 20px;">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #000000;">
                  <tr>
                    <td align="center" style="background-color: #000000; padding: 40px 20px;">
                      <h1 style="color: #ffffff; font-size: 36px; margin: 0;">Hoodie Store</h1>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 40px 30px; color: #000000; text-align: center;">
                      <h2 style="font-size: 24px; margin-top: 0; margin-bottom: 20px;">Password Reset</h2>
                      <p style="font-size: 16px; margin-bottom: 20px;">Hi ${firstName},</p>
                      <p style="font-size: 16px; margin-bottom: 30px;">Use the code below to reset your password.</p>
                      <div style="border: 2px solid #000000; padding: 20px; margin: 30px auto; max-width: 250px;">
                        <p style="font-size: 48px; font-weight: 500; color: #000000; letter-spacing: 10px; margin: 0;">
                          ${otp}
                        </p>
                      </div>
                      <p style="font-size: 14px; color: #555555;">This code will expire in 10 minutes.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    };

    return this.authTransporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();