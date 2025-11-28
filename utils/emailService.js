const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.authTransporter = this.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === "true",
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
      label: "Auth",
    });

    this.orderTransporter =
      this.createTransport(
        {
          host: process.env.ORDER_EMAIL_HOST || process.env.EMAIL_HOST,
          port: parseInt(
            process.env.ORDER_EMAIL_PORT || process.env.EMAIL_PORT
          ),
          secure:
            (process.env.ORDER_EMAIL_SECURE || process.env.EMAIL_SECURE) ===
            "true",
          user: process.env.ORDER_EMAIL_USERNAME,
          pass: process.env.ORDER_EMAIL_PASSWORD,
          label: "Order",
        },
        true
      ) || this.authTransporter;
  }

  createTransport(config, allowFallback = false) {
    if (!config.host || !config.user || !config.pass) {
      if (!allowFallback) {
        console.error(
          `[EmailService] ${
            config.label || "Email"
          } transporter missing host/user/pass`
        );
      }
      return null;
    }

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
      logger: false,
      debug: false,
    });

    transporter
      .verify()
      .then(() => {
        console.log(
          `[EmailService] ${config.label || "Email"} transporter ready`
        );
      })
      .catch((err) => {
        console.error(
          `[EmailService] ${
            config.label || "Email"
          } transporter verification failed:`,
          err && err.message ? err.message : err
        );
      });

    return transporter;
  }

  getBranding() {
    return {
      name: "Aesthco",
      url: "https://aesthco.com",
      logo: process.env.EMAIL_LOGO_URL || "https://aesthco.com/black_logo.png",
      primary: "#000000",
      accent: "#111111",
    };
  }

  formatCurrency(amount) {
    const parsed = Number(amount || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(parsed);
  }

  // --- NEW DESIGN TEMPLATE SHELL ---
  buildShell({ title, body, cta }) {
    const brand = this.getBranding();

    const ctaBlock = cta
      ? `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 32px;">
        <tr>
          <td align="center">
            <a href="${cta.url}" target="_blank" style="display: inline-block; padding: 16px 40px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
              ${cta.label}
            </a>
          </td>
        </tr>
      </table>
      `
      : "";

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <title>${title}</title>
        <style type="text/css">
          body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; display: block; }
          body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f9f9f9; }
          
          /* Mobile Styles */
          @media screen and (max-width: 600px) {
            .email-container { width: 100% !important; margin: auto !important; }
            .content-padding { padding: 24px 20px !important; }
            .mobile-title { font-size: 24px !important; line-height: 30px !important; }
            .item-img { width: 60px !important; height: 60px !important; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
        <center>
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9f9f9;">
            <tr>
              <td align="center" style="padding: 40px 0;">
                
                <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="background-color: #ffffff; margin: 0 auto; border-radius: 0px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                  
                  <tr>
                    <td align="center" style="padding: 40px 0 20px 0;">
                      <a href="${brand.url}" style="text-decoration: none;">
                        <img src="${brand.logo}" alt="${brand.name}" style="width: 120px; max-width: 120px; height: auto; font-family: sans-serif; font-size: 15px; line-height: 15px; color: #000000;" />
                      </a>
                    </td>
                  </tr>

                  <tr>
                    <td class="content-padding" style="padding: 40px 48px; text-align: left;">
                      <h1 class="mobile-title" style="margin: 0 0 24px 0; font-size: 24px; font-weight: 700; color: #000000; letter-spacing: -0.5px; text-align: center;">
                        ${title}
                      </h1>
                      
                      <div style="font-size: 15px; line-height: 26px; color: #333333;">
                        ${body}
                      </div>

                      ${ctaBlock}
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 30px 48px; background-color: #fafafa; border-top: 1px solid #eeeeee; text-align: center;">
                      <p style="margin: 0; font-size: 12px; line-height: 18px; color: #999999;">
                        &copy; ${new Date().getFullYear()} ${brand.name}. All rights reserved.<br>
                        <a href="${brand.url}" style="color: #999999; text-decoration: underline;">Visit Website</a>
                      </p>
                    </td>
                  </tr>

                </table>
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr><td height="40" style="font-size: 0; line-height: 0;">&nbsp;</td></tr>
                </table>

              </td>
            </tr>
          </table>
        </center>
      </body>
      </html>
    `;
  }

  // Helper for OTP Box Design
  _getOtpBox(otp) {
    return `
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
        <tr>
          <td align="center" style="padding: 24px; background-color: #f4f4f5; border-radius: 4px;">
            <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #000000; display: block;">
              ${otp}
            </span>
          </td>
        </tr>
      </table>
      <p style="margin: 0; font-size: 13px; color: #666666; text-align: center;">Code expires in 10 minutes.</p>
    `;
  }

  async sendVerificationEmail(email, otp, firstName) {
    try {
      const brand = this.getBranding();
      const body = `
        <p style="margin: 0 0 16px;">Hi ${firstName},</p>
        <p style="margin: 0;">Welcome to <strong>${
          brand.name
        }</strong>. Please use the verification code below to confirm your email address.</p>
        ${this._getOtpBox(otp)}
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Verify Your Email Address",
        html: this.buildShell({
          title: "Verify Your Email",
          body,
          cta: { url: brand.url, label: "Visit Store" },
        }),
      };

      return await this.authTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(email, otp, firstName) {
    const brand = this.getBranding();
    const body = `
      <p style="margin: 0 0 16px;">Hi ${firstName},</p>
      <p style="margin: 0;">We received a request to reset your password. Use the code below to proceed.</p>
      ${this._getOtpBox(otp)}
      <p style="margin-top: 16px; font-size: 13px; color: #999999; text-align: center;">If you didn't request this, you can safely ignore this email.</p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your Password Reset Request",
      html: this.buildShell({
        title: "Reset Password",
        body,
        cta: { url: brand.url, label: "Visit Store" },
      }),
    };

    return this.authTransporter.sendMail(mailOptions);
  }

  async sendLoginOTP(email, otp, firstName) {
    const brand = this.getBranding();
    const body = `
      <p style="margin: 0 0 16px;">Hi ${firstName || "there"},</p>
      <p style="margin: 0;">Use the code below to sign in securely to your account.</p>
      ${this._getOtpBox(otp)}
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your login code",
      html: this.buildShell({
        title: "Sign In Code",
        body,
        cta: { url: brand.url, label: "Shop Now" },
      }),
    };

    return this.authTransporter.sendMail(mailOptions);
  }

  async sendWelcomeEmail(email, firstName) {
    const brand = this.getBranding();
    const body = `
      <p style="margin: 0 0 16px;">Hi ${firstName || "there"},</p>
      <p style="margin: 0 0 16px;">We’re excited to have you at <strong>${
        brand.name
      }</strong>. Your account has been successfully created.</p>
      <p style="margin: 0;">Get ready to explore our latest collections and exclusive drops.</p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Welcome to ${brand.name}`,
      html: this.buildShell({
        title: "Welcome to the Family",
        body,
        cta: { url: brand.url, label: "Start Shopping" },
      }),
    };

    return this.authTransporter.sendMail(mailOptions);
  }

  buildItemsTable(items = []) {
    const brand = this.getBranding();
    const rows = items
      .map(
        (item) => `
        <tr>
          <td valign="top" style="padding: 16px 0; border-bottom: 1px solid #eeeeee; width: 60px;">
            <img src="${item.imageUrl || ""}" alt="${
          item.name
        }" class="item-img" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; background-color: #f4f4f4; display: block;" />
          </td>
          <td valign="top" style="padding: 16px 12px; border-bottom: 1px solid #eeeeee;">
            <div style="font-size: 14px; font-weight: 600; color: #000000; line-height: 1.4;">${
              item.name
            }</div>
            <div style="font-size: 13px; color: #666666; margin-top: 4px;">
              ${item.variant ? `<span>${item.variant}</span>` : ""}
              ${item.variant ? '<span style="color:#cccccc"> | </span>' : ""}
              <span>Qty: ${item.quantity}</span>
            </div>
          </td>
          <td valign="top" align="right" style="padding: 16px 0; border-bottom: 1px solid #eeeeee; white-space: nowrap;">
            <div style="font-size: 14px; font-weight: 600; color: #000000;">
              ${this.formatCurrency(item.totalPrice)}
            </div>
          </td>
        </tr>`
      )
      .join("");

    return `
      <table width="100%" cellspacing="0" cellpadding="0" style="margin-top: 24px; border-collapse: collapse;">
        <thead>
          <tr>
            <th align="left" colspan="2" style="font-size: 11px; text-transform: uppercase; color: #999999; letter-spacing: 1px; font-weight: 600; padding-bottom: 12px; border-bottom: 2px solid #000000;">Item</th>
            <th align="right" style="font-size: 11px; text-transform: uppercase; color: #999999; letter-spacing: 1px; font-weight: 600; padding-bottom: 12px; border-bottom: 2px solid #000000;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  async sendOrderStatusEmail({
    to,
    status,
    orderId,
    items,
    summary,
    customerName,
  }) {
    if (!to) return;
    const brand = this.getBranding();
    const statusLabels = {
      PLACED: "Order Placed",
      CONFIRMED: "Order Confirmed",
      PACKED: "Packed",
      OUT_FOR_DELIVERY: "Out for Delivery",
      DELIVERED: "Delivered",
      CANCELLED: "Cancelled",
    };
    const label = statusLabels[status] || "Order Update";

    // Summary Box HTML
    const summaryHtml = `
      <div style="background-color: #f9f9f9; border-radius: 8px; padding: 20px; margin-top: 0px;">
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="font-size: 14px; color: #666666; padding-bottom: 8px;">Subtotal</td>
            <td align="right" style="font-size: 14px; color: #000000; padding-bottom: 8px;">${this.formatCurrency(
              summary?.subtotal || 0
            )}</td>
          </tr>
          <tr>
            <td style="font-size: 14px; color: #666666; padding-bottom: 8px;">Shipping</td>
            <td align="right" style="font-size: 14px; color: #000000; padding-bottom: 8px;">${
              summary?.shippingFee === 0
                ? "Free"
                : this.formatCurrency(summary?.shippingFee || 0)
            }</td>
          </tr>
          ${
            summary?.discountAmount
              ? `<tr>
            <td style="font-size: 14px; color: #16a34a; padding-bottom: 8px;">Discount</td>
            <td align="right" style="font-size: 14px; color: #16a34a; padding-bottom: 8px;">- ${this.formatCurrency(
              summary.discountAmount
            )}</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding-top: 12px; border-top: 1px solid #eeeeee; font-size: 16px; font-weight: 700; color: #000000;">Total</td>
            <td align="right" style="padding-top: 12px; border-top: 1px solid #eeeeee; font-size: 16px; font-weight: 700; color: #000000;">${this.formatCurrency(
              summary?.total || 0
            )}</td>
          </tr>
        </table>
      </div>
    `;

    const body = `
      <p style="margin: 0 0 16px;">Hi ${customerName || "there"},</p>
      <p style="margin: 0 0 24px;">Your order <strong>#${orderId}</strong> status has been updated to: <strong>${label}</strong>.</p>
      
      ${items && items.length ? this.buildItemsTable(items) : ""}
      
      <div style="height: 20px;"></div>
      ${summaryHtml}
      
      <p style="margin-top: 32px; font-size: 13px; color: #999999; text-align: center;">We'll keep you posted on the next steps.</p>
    `;

    const mailOptions = {
      from: process.env.ORDER_EMAIL_FROM || process.env.EMAIL_FROM,
      to,
      subject: `${brand.name}: ${label} (#${orderId})`,
      html: this.buildShell({
        title: label,
        body,
        cta: { url: `${brand.url}/orders/${orderId}`, label: "View Order" },
      }),
    };

    return (this.orderTransporter || this.authTransporter).sendMail(
      mailOptions
    );
  }

  async sendPartnerDeliveryOTP(email, otp, orderId) {
    if (!email) return;
    const brand = this.getBranding();
    const body = `
      <p style="margin: 0 0 16px;">Hi,</p>
      <p style="margin: 0;">Order <strong>#${orderId}</strong> has been marked delivered. Use the code below to confirm delivery.</p>
      ${this._getOtpBox(otp)}
      <p style="margin: 0; font-size: 13px; color: #999999; text-align: center;">Keep this code confidential.</p>
    `;

    const mailOptions = {
      from: process.env.ORDER_EMAIL_FROM || process.env.EMAIL_FROM,
      to: email,
      subject: `Delivery code for order #${orderId}`,
      html: this.buildShell({
        title: "Delivery Confirmation",
        body,
        cta: { url: `${brand.url}/partner`, label: "Dashboard" },
      }),
    };

    return (this.orderTransporter || this.authTransporter).sendMail(
      mailOptions
    );
  }

  async sendPartnerNewOrder(email, orderId, items, address) {
    if (!email) return;
    const brand = this.getBranding();
    
    // Address Box
    const addressHtml = address
      ? `
      <div style="margin-top: 24px; padding: 20px; border: 1px solid #eeeeee; border-radius: 8px; background-color: #fafafa;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #999999; font-weight: 700; margin-bottom: 8px;">Delivery Address</div>
        <div style="font-size: 14px; font-weight: 700; color: #000000; margin-bottom: 4px;">${address.name || ''}</div>
        <div style="font-size: 14px; color: #333333; line-height: 1.5;">
          ${address.line1 || ''}<br>
          ${address.line2 ? `${address.line2}<br>` : ''}
          ${[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}
        </div>
        ${address.phone ? `<div style="margin-top: 8px; font-size: 14px; color: #666666;">Phone: ${address.phone}</div>` : ''}
      </div>`
      : "";

    const body = `
      <p style="margin: 0 0 16px;">New order <strong>#${orderId}</strong> is ready to accept.</p>
      ${items && items.length ? this.buildItemsTable(items) : ""}
      ${addressHtml}
    `;

    const mailOptions = {
      from: process.env.ORDER_EMAIL_FROM || process.env.EMAIL_FROM,
      to: email,
      subject: `${brand.name}: New order #${orderId}`,
      html: this.buildShell({
        title: "New Order Alert",
        body,
        cta: { url: `${brand.url}/partner`, label: "Accept Order" },
      }),
    };

    return (this.orderTransporter || this.authTransporter).sendMail(
      mailOptions
    );
  }

  async sendPartnerOrderCancelled(email, orderId, address, items) {
    if (!email) return;
    const brand = this.getBranding();
    
    // Minimal address summary
    const addressHtml = address
      ? `
      <div style="margin-top: 24px; padding: 16px; border: 1px solid #eeeeee; border-radius: 8px; font-size: 13px; color: #666666;">
        <strong>Customer:</strong> ${address.name || ''} <br>
        <strong>City:</strong> ${address.city || ''}
      </div>`
      : "";

    const body = `
      <p style="margin: 0 0 16px;">Order <strong>#${orderId}</strong> has been cancelled by the customer.</p>
      ${items && items.length ? this.buildItemsTable(items) : ""}
      ${addressHtml}
      <p style="margin-top: 24px; font-size: 13px; color: #999999; text-align: center;">No action required.</p>
    `;

    const mailOptions = {
      from: process.env.ORDER_EMAIL_FROM || process.env.EMAIL_FROM,
      to: email,
      subject: `${brand.name}: Order #${orderId} cancelled`,
      html: this.buildShell({
        title: "Order Cancelled",
        body,
        cta: { url: `${brand.url}/partner`, label: "Dashboard" },
      }),
    };

    return (this.orderTransporter || this.authTransporter).sendMail(
      mailOptions
    );
  }
}

module.exports = new EmailService();