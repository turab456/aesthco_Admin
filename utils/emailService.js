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
      logo: process.env.EMAIL_LOGO_URL || "https://aesthco.com/logo.png",
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

  buildShell({ title, body, cta }) {
    const brand = this.getBranding();
    const logoBlock = `
      <td align="center" style="padding: 24px;">
        <a href="${brand.url}" target="_blank" style="text-decoration:none; color:${brand.primary}; font-size: 24px; font-weight: 700; letter-spacing: 1px;">
          <img src="${brand.logo}" alt="${brand.name}" style="max-width: 180px; height: 50px; object-fit: contain; display: block; margin: 0 auto 8px;" />
          <div style="font-size:14px; color:#555;">${brand.name}</div>
        </a>
      </td>
    `;

    const ctaBlock = cta
      ? `<div style="text-align: center; margin: 28px 0;">
          <a href="${cta.url}" style="display: inline-block; padding: 14px 26px; background: ${brand.primary}; color: #ffffff; text-decoration: none; border-radius: 9999px; font-weight: 600;">
            ${cta.label}
          </a>
        </div>`
      : "";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style="margin:0; padding:0; background:#f7f7f7; font-family: Arial, sans-serif; color:#0f172a;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f7f7f7; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="640" border="0" cellspacing="0" cellpadding="0" style="background:#ffffff; border:1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
                <tr>${logoBlock}</tr>
                <tr>
                  <td style="padding: 0 28px 32px 28px;">
                    <h2 style="font-size: 22px; margin: 0 0 12px 0; color:#0f172a;">${title}</h2>
                    <div style="font-size: 15px; line-height: 1.7; color:#334155;">
                      ${body}
                    </div>
                    ${ctaBlock}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }

  async sendVerificationEmail(email, otp, firstName) {
    try {
      const brand = this.getBranding();
      const body = `
        <p>Hi ${firstName},</p>
        <p>Welcome to ${brand.name}! Please use the code below to verify your email address.</p>
        <div style="border: 2px dashed ${brand.primary}; padding: 20px; margin: 20px 0; text-align:center; border-radius: 12px;">
          <div style="font-size: 36px; letter-spacing: 10px; font-weight: 700; color: ${brand.primary};">${otp}</div>
          <p style="margin: 12px 0 0 0; color: #475569; font-size: 13px;">This code expires in 10 minutes.</p>
        </div>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Verify Your Email Address",
        html: this.buildShell({
          title: "Verify your email",
          body,
          cta: { url: brand.url, label: "Visit Aesthco" },
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
      <p>Hi ${firstName},</p>
      <p>Use the code below to reset your password.</p>
      <div style="border: 2px dashed ${brand.primary}; padding: 20px; margin: 20px 0; text-align:center; border-radius: 12px;">
        <div style="font-size: 36px; letter-spacing: 10px; font-weight: 700; color: ${brand.primary};">${otp}</div>
        <p style="margin: 12px 0 0 0; color: #475569; font-size: 13px;">This code expires in 10 minutes.</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your Password Reset Request",
      html: this.buildShell({
        title: "Password reset",
        body,
        cta: { url: brand.url, label: "Visit Aesthco" },
      }),
    };

    return this.authTransporter.sendMail(mailOptions);
  }

  async sendLoginOTP(email, otp, firstName) {
    const brand = this.getBranding();
    const body = `
      <p>Hi ${firstName || "there"},</p>
      <p>Use the code below to sign in securely.</p>
      <div style="border: 2px dashed ${
        brand.primary
      }; padding: 20px; margin: 20px 0; text-align:center; border-radius: 12px;">
        <div style="font-size: 36px; letter-spacing: 10px; font-weight: 700; color: ${
          brand.primary
        };">${otp}</div>
        <p style="margin: 12px 0 0 0; color: #475569; font-size: 13px;">This code expires in 10 minutes.</p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "Your login code",
      html: this.buildShell({
        title: "Your one-time login code",
        body,
        cta: { url: brand.url, label: "Shop now" },
      }),
    };

    return this.authTransporter.sendMail(mailOptions);
  }

  async sendWelcomeEmail(email, firstName) {
    const brand = this.getBranding();
    const body = `
      <p>Hi ${firstName || "there"},</p>
      <p>We’re excited to have you at ${
        brand.name
      }. Explore our latest drops and curated looks.</p>
      <p style="margin-top: 12px; color:#475569;">Need help? Just reply to this email and we’ll assist you.</p>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Welcome to ${brand.name}`,
      html: this.buildShell({
        title: "Welcome aboard",
        body,
        cta: { url: brand.url, label: "Start shopping" },
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
          <td style="padding:10px; border-bottom:1px solid #e2e8f0;">
            <img src="${item.imageUrl || ""}" alt="${
          item.name
        }" style="width:64px; height:64px; object-fit:cover; border-radius:8px; background:#f1f5f9;" />
          </td>
          <td style="padding:10px; border-bottom:1px solid #e2e8f0; color:#0f172a; font-size:14px; line-height:1.5;">
            <div style="font-weight:600;">${item.name}</div>
            <div style="color:#475569; font-size:12px;">${
              item.variant || ""
            }</div>
          </td>
          <td style="padding:10px; border-bottom:1px solid #e2e8f0; text-align:center; font-size:13px; color:#0f172a;">${
            item.quantity
          }</td>
          <td style="padding:10px; border-bottom:1px solid #e2e8f0; text-align:right; font-size:13px; color:#0f172a;">${this.formatCurrency(
            item.unitPrice
          )}</td>
          <td style="padding:10px; border-bottom:1px solid #e2e8f0; text-align:right; font-size:13px; color:#0f172a; font-weight:600;">${this.formatCurrency(
            item.totalPrice
          )}</td>
        </tr>`
      )
      .join("");

    return `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse; margin-top: 12px; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
        <thead>
          <tr style="background:#f8fafc; color:#0f172a; font-size:12px; text-transform:uppercase; letter-spacing:0.05em;">
            <th style="padding:10px; text-align:left;">Item</th>
            <th style="padding:10px; text-align:left;"></th>
            <th style="padding:10px;">Qty</th>
            <th style="padding:10px; text-align:right;">Unit</th>
            <th style="padding:10px; text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
          <tr>
            <td colspan="4" style="padding:12px; text-align:right; font-size:13px; color:#475569;">Subtotal</td>
            <td style="padding:12px; text-align:right; font-size:13px; font-weight:600; color:#0f172a;">${this.formatCurrency(
              items.reduce((sum, i) => sum + Number(i.totalPrice || 0), 0)
            )}</td>
          </tr>
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
      PLACED: "Order placed",
      CONFIRMED: "Order confirmed",
      PACKED: "Order packed",
      OUT_FOR_DELIVERY: "Out for delivery",
      DELIVERED: "Delivered",
      CANCELLED: "Order cancelled",
    };
    const label = statusLabels[status] || "Order update";

    const body = `
      <p>Hi ${customerName || "there"},</p>
      <p>Your order <strong>#${orderId}</strong> is now <strong>${label}</strong>.</p>
      ${items && items.length ? this.buildItemsTable(items) : ""}
      <div style="margin-top: 18px; padding: 14px 16px; background:#f8fafc; border-radius:12px; font-size:13px; color:#0f172a; border:1px solid #e2e8f0;">
        <div style="display:flex; justify-content:space-between;"><span>Subtotal</span><span>${this.formatCurrency(
          summary?.subtotal || 0
        )}</span></div>
        <div style="display:flex; justify-content:space-between; color:#475569;"><span>Shipping</span><span>${
          summary?.shippingFee === 0
            ? "Free"
            : this.formatCurrency(summary?.shippingFee || 0)
        }</span></div>
        ${
          summary?.discountAmount
            ? `<div style="display:flex; justify-content:space-between; color:#16a34a;"><span>Discount</span><span>- ${this.formatCurrency(
                summary.discountAmount
              )}</span></div>`
            : ""
        }
        <div style="display:flex; justify-content:space-between; font-weight:700; margin-top:8px;"><span>Total</span><span>${this.formatCurrency(
          summary?.total || 0
        )}</span></div>
      </div>
      <p style="margin-top: 16px; color:#475569;">We’ll keep you posted on the next steps.</p>
    `;

    const mailOptions = {
      from: process.env.ORDER_EMAIL_FROM || process.env.EMAIL_FROM,
      to,
      subject: `${brand.name}: ${label} (#${orderId})`,
      html: this.buildShell({
        title: label,
        body,
        cta: { url: `${brand.url}/orders`, label: "Track your order" },
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
      <p>Hi there,</p>
      <p>Order <strong>#${orderId}</strong> has been marked delivered. Use the code below to confirm delivery with the customer if required.</p>
      <div style="border: 2px dashed ${brand.primary}; padding: 18px; margin: 16px 0; text-align:center; border-radius: 12px;">
        <div style="font-size: 32px; letter-spacing: 10px; font-weight: 700; color: ${brand.primary};">${otp}</div>
      </div>
      <p style="color:#475569; font-size:13px;">Keep this code confidential.</p>
    `;

    const mailOptions = {
      from: process.env.ORDER_EMAIL_FROM || process.env.EMAIL_FROM,
      to: email,
      subject: `Delivery code for order #${orderId}`,
      html: this.buildShell({
        title: "Delivery confirmation code",
        body,
        cta: { url: `${brand.url}/partner`, label: "View order" },
      }),
    };

    return (this.orderTransporter || this.authTransporter).sendMail(
      mailOptions
    );
  }

  async sendPartnerNewOrder(email, orderId, items, address) {
    if (!email) return;
    const brand = this.getBranding();
    const body = `
      <p>New order <strong>#${orderId}</strong> is ready to accept.</p>
      ${items && items.length ? this.buildItemsTable(items) : ""}
      ${
        address
          ? `<div style="margin-top:16px; padding:14px 16px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc; font-size:13px; color:#0f172a;">
              <div style="font-weight:700;">Delivery address</div>
              <div>${address.name || ''}</div>
              <div>${address.line1 || ''}</div>
              ${address.line2 ? `<div>${address.line2}</div>` : ''}
              <div>${[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}</div>
              ${address.phone ? `<div style="margin-top:6px; color:#475569;">Phone: ${address.phone}</div>` : ''}
            </div>`
          : ''
      }
      <p style="margin-top:12px; color:#475569;">Please accept and process the order at the earliest.</p>
    `;

    const mailOptions = {
      from: process.env.ORDER_EMAIL_FROM || process.env.EMAIL_FROM,
      to: email,
      subject: `${brand.name}: New order #${orderId}`,
      html: this.buildShell({
        title: "New order available",
        body,
        cta: { url: `${brand.url}/partner`, label: "View order" },
      }),
    };

    return (this.orderTransporter || this.authTransporter).sendMail(
      mailOptions
    );
  }

  async sendPartnerOrderCancelled(email, orderId, address, items) {
    if (!email) return;
    const brand = this.getBranding();
    const body = `
      <p>Order <strong>#${orderId}</strong> has been cancelled by the customer.</p>
      ${items && items.length ? this.buildItemsTable(items) : ""}
      ${
        address
          ? `<div style="margin-top:16px; padding:14px 16px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc; font-size:13px; color:#0f172a;">
              <div style="font-weight:700;">Delivery address</div>
              <div>${address.name || ''}</div>
              <div>${address.line1 || ''}</div>
              ${address.line2 ? `<div>${address.line2}</div>` : ''}
              <div>${[address.city, address.state, address.postalCode].filter(Boolean).join(', ')}</div>
              ${address.phone ? `<div style="margin-top:6px; color:#475569;">Phone: ${address.phone}</div>` : ''}
            </div>`
          : ''
      }
      <p style="margin-top:12px; color:#475569;">This is for your awareness—no action required.</p>
    `;

    const mailOptions = {
      from: process.env.ORDER_EMAIL_FROM || process.env.EMAIL_FROM,
      to: email,
      subject: `${brand.name}: Order #${orderId} cancelled`,
      html: this.buildShell({
        title: "Order cancelled",
        body,
        cta: { url: `${brand.url}/partner`, label: "View orders" },
      }),
    };

    return (this.orderTransporter || this.authTransporter).sendMail(
      mailOptions
    );
  }
}

module.exports = new EmailService();
