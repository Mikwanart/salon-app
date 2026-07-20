import nodemailer from 'nodemailer';
import twilio from 'twilio';

class NotificationService {
  private mailTransporter: nodemailer.Transporter | null = null;
  private twilioClient: any = null;
  private twilioInitialised = false;

  /**
   * Lazy-initialises Twilio client on first SMS send.
   * Called at send-time so dotenv has already loaded.
   */
  private getTwilioClient(): any {
    if (this.twilioInitialised) return this.twilioClient;
    this.twilioInitialised = true;

    const sid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID || process.env.TWILIO_ACCOUNT_ID;
    const token = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_TOKEN || process.env.TWILIO_SECRET;
    if (sid && token) {
      try {
        this.twilioClient = twilio(sid, token);
        console.log('🔌 Twilio SMS client initialised successfully.');
      } catch (err) {
        console.error('❌ Failed to initialise Twilio client:', err);
      }
    } else {
      console.log('ℹ️ Twilio credentials missing. SMS will output to console.');
    }
    return this.twilioClient;
  }

  /**
   * Lazy-loads SMTP transporter or registers a temporary Ethereal account.
   */
  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.mailTransporter) {
      return this.mailTransporter;
    }

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && port && user && pass) {
      this.mailTransporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465,
        auth: { user, pass }
      });
      console.log(`🔌 Email SMTP transporter initialized (Host: ${host}).`);
    } else {
      console.log('🔄 SMTP credentials missing. Auto-provisioning Ethereal test email account...');
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.mailTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
        });
        console.log('✅ Temporary Ethereal test email account created!');
        console.log(`📧 Ethereal User: ${testAccount.user}`);
        console.log(`📧 Ethereal Pass: ${testAccount.pass}`);
      } catch (err) {
        console.error('❌ Failed to create Ethereal test account, using offline logger fallback:', err);
        // Offline logger fallback
        this.mailTransporter = {
          sendMail: async (options: any) => {
            console.log('\n┌────────────────────────────────────────────────────────┐');
            console.log('│                ✉️  SIMULATED EMAIL ALERT                │');
            console.log('├────────────────────────────────────────────────────────┤');
            console.log(`│ TO:      %-45s │`, options.to);
            console.log(`│ SUBJECT: %-45s │`, options.subject.slice(0, 45));
            console.log('└────────────────────────────────────────────────────────┘\n');
            return { messageId: 'offline-mock-id' };
          }
        } as any;
      }
    }

    return this.mailTransporter!;
  }

  /**
   * Formats and prints SMS outputs.
   */
  private async sendSms(to: string, body: string): Promise<void> {
    if (!to) {
      console.warn('⚠️ Cannot send SMS notification: Client phone number is empty.');
      return;
    }

    // Auto-format local Ghanaian phone numbers to E.164 format
    let cleanTo = to.trim().replace(/\s/g, '').replace(/[-\(\)]/g, '');
    if (cleanTo.startsWith('0') && cleanTo.length === 10) {
      cleanTo = '+233' + cleanTo.slice(1);
    } else if (!cleanTo.startsWith('+')) {
      cleanTo = '+' + cleanTo;
    }

    const client = this.getTwilioClient();
    if (client) {
      try {
        const from = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_FROM || process.env.TWILIO_NUMBER || '+1234567890';
        const msg = await client.messages.create({
          body,
          from,
          to: cleanTo
        });
        console.log(`📱 SMS sent via Twilio to ${cleanTo} (SID: ${msg.sid})`);
      } catch (err) {
        console.error(`❌ Failed to send SMS to ${cleanTo} via Twilio:`, err);
      }
    } else {
      // Beautiful console logger block
      console.log('\n┌────────────────────────────────────────────────────────┐');
      console.log('│                 📱 SIMULATED SMS ALERT                 │');
      console.log('├────────────────────────────────────────────────────────┤');
      console.log(`│ TO:   %-48s │`, cleanTo);
      
      const words = body.split(' ');
      let line = '';
      for (const word of words) {
        if ((line + word).length > 48) {
          console.log(`│ MSG:  %-48s │`, line.trim());
          line = '';
        }
        line += word + ' ';
      }
      if (line) {
        console.log(`│ MSG:  %-48s │`, line.trim());
      }
      
      console.log('└────────────────────────────────────────────────────────┘\n');
    }
  }

  /**
   * Sends booking confirmation email and SMS.
   */
  async sendBookingConfirmation(appointment: any): Promise<void> {
    const clientEmail = appointment.client?.email || 'test@example.com';

    // Resolve phone: MoMo stores it in paymentDetails.
    // For CASH/CARD, the frontend stores it in paymentDetails if provided,
    // or falls back to a 'Phone: <number>' note embedded in the notes field.
    let clientPhone = appointment.client?.phone || '';
    if (!clientPhone && appointment.paymentDetails) {
      const pd = String(appointment.paymentDetails).trim();
      // Looks like a real phone number (not 'Pay at Salon' / card name)
      if (/^[\+0-9][\d\s\-\(\)]{6,}$/.test(pd)) {
        clientPhone = pd;
      }
    }
    if (!clientPhone && appointment.notes) {
      const match = String(appointment.notes).match(/Phone:\s*([\+0-9][\d\s\-\(\)]{6,})/);
      if (match) clientPhone = match[1].trim();
    }

    const clientName = appointment.client?.name || 'Valued Client';
    const serviceName = appointment.service?.name || 'Salon Service';
    const price = appointment.service?.price || 0;
    const duration = appointment.service?.duration || 30;
    
    const dateStr = new Date(appointment.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const timeStr = new Date(appointment.date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    const stylistName = appointment.stylist?.name || 'Any Stylist';
    const salonName = appointment.salon?.name || 'Lumière Salon';
    const salonAddress = appointment.salon?.address || '';

    const isPaid = appointment.paymentMethod === 'MOMO' || appointment.paymentMethod === 'CARD';
    const payStatusText = isPaid ? 'PAID' : 'Pending Payment (Cash)';
    const payStatusColor = isPaid ? '#10b981' : '#f59e0b';

    // Send Email
    try {
      const transporter = await this.getTransporter();
      const from = process.env.SMTP_FROM || 'Lumière Salon <no-reply@lumiere-salon.com>';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', sans-serif; background-color: #f7fafc; color: #1a202c; padding: 24px; margin: 0; }
            .container { max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; margin: 0 auto; border: 1px solid #edf2f7; }
            .header { background: linear-gradient(135deg, #1a1a1a 0%, #2d3748 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
            .header h1 { margin: 0; font-size: 1.8rem; font-weight: 700; letter-spacing: -0.5px; }
            .body { padding: 32px 24px; }
            .greeting { font-size: 1.1rem; margin-bottom: 20px; font-weight: 600; }
            .details-card { background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
            .details-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.95rem; }
            .details-row:last-child { margin-bottom: 0; border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 12px; font-weight: 700; }
            .label { color: #64748b; }
            .value { color: #0f172a; text-align: right; }
            .instructions { font-size: 0.9rem; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
            .footer { text-align: center; padding: 24px; font-size: 0.8rem; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #edf2f7; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Confirmed</h1>
            </div>
            <div class="body">
              <p class="greeting">Hi ${clientName},</p>
              <p>Your appointment at <strong>${salonName}</strong> has been successfully booked and confirmed. We look forward to seeing you!</p>
              
              <div class="details-card">
                <div class="details-row"><span class="label">Service</span><span class="value">${serviceName}</span></div>
                <div class="details-row"><span class="label">Date</span><span class="value">${dateStr}</span></div>
                <div class="details-row"><span class="label">Time</span><span class="value">${timeStr}</span></div>
                <div class="details-row"><span class="label">Stylist</span><span class="value">${stylistName}</span></div>
                <div class="details-row"><span class="label">Duration</span><span class="value">${duration} mins</span></div>
                <div class="details-row"><span class="label">Salon Address</span><span class="value">${salonAddress}</span></div>
                <div class="details-row"><span class="label">Payment Status</span><span class="value" style="color: ${payStatusColor};">${payStatusText}</span></div>
                <div class="details-row"><span class="label">Total Amount</span><span class="value">$${price}</span></div>
              </div>
              
              <p class="instructions">If you need to reschedule or cancel your appointment, please visit your user profile dashboard at least 24 hours prior to your scheduled time.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${salonName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const info = await transporter.sendMail({
        from,
        to: clientEmail,
        subject: `Booking Confirmed: ${serviceName} - ${dateStr} at ${timeStr}`,
        html: htmlContent
      });

      console.log(`✉️ Email confirmation sent to: ${clientEmail} (ID: ${info.messageId})`);
      const testUrl = nodemailer.getTestMessageUrl(info);
      if (testUrl) {
        console.log(`🔗 [DEVELOPER MAILBOX] View sent confirmation HTML email: ${testUrl}`);
      }
    } catch (err) {
      console.error('❌ Failed to send booking confirmation email:', err);
    }

    // Send SMS
    const smsBody = `Hi ${clientName}, your booking for ${serviceName} at ${salonName} is confirmed for ${dateStr} at ${timeStr}. Stylist: ${stylistName}. Total: $${price}. (${payStatusText})`;
    await this.sendSms(clientPhone, smsBody);
  }

  /**
   * Sends cancellation notification email and SMS.
   */
  async sendBookingCancellation(appointment: any): Promise<void> {
    const clientEmail = appointment.client?.email || 'test@example.com';

    // Same phone resolution logic as confirmation
    let clientPhone = appointment.client?.phone || '';
    if (!clientPhone && appointment.paymentDetails) {
      const pd = String(appointment.paymentDetails).trim();
      if (/^[\+0-9][\d\s\-\(\)]{6,}$/.test(pd)) {
        clientPhone = pd;
      }
    }
    if (!clientPhone && appointment.notes) {
      const match = String(appointment.notes).match(/Phone:\s*([\+0-9][\d\s\-\(\)]{6,})/);
      if (match) clientPhone = match[1].trim();
    }

    const clientName = appointment.client?.name || 'Valued Client';
    const serviceName = appointment.service?.name || 'Salon Service';
    const price = appointment.service?.price || 0;
    
    const dateStr = new Date(appointment.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const timeStr = new Date(appointment.date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    
    const salonName = appointment.salon?.name || 'Lumière Salon';
    const isPrepaid = appointment.paymentMethod === 'MOMO' || appointment.paymentMethod === 'CARD';

    // Send Email
    try {
      const transporter = await this.getTransporter();
      const from = process.env.SMTP_FROM || 'Lumière Salon <no-reply@lumiere-salon.com>';

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', sans-serif; background-color: #f7fafc; color: #1a202c; padding: 24px; margin: 0; }
            .container { max-width: 600px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); overflow: hidden; margin: 0 auto; border: 1px solid #edf2f7; }
            .header { background: #ef4444; color: #ffffff; padding: 32px 24px; text-align: center; }
            .header h1 { margin: 0; font-size: 1.8rem; font-weight: 700; letter-spacing: -0.5px; }
            .body { padding: 32px 24px; }
            .greeting { font-size: 1.1rem; margin-bottom: 20px; font-weight: 600; }
            .details-card { background-color: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0; }
            .details-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.95rem; }
            .details-row:last-child { margin-bottom: 0; border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 12px; font-weight: 700; }
            .label { color: #64748b; }
            .value { color: #0f172a; text-align: right; }
            .refund-box { background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin-bottom: 24px; color: #065f46; font-size: 0.9rem; line-height: 1.5; }
            .footer { text-align: center; padding: 24px; font-size: 0.8rem; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #edf2f7; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Appointment Cancelled</h1>
            </div>
            <div class="body">
              <p class="greeting">Hi ${clientName},</p>
              <p>This email confirms that your appointment for <strong>${serviceName}</strong> at <strong>${salonName}</strong> has been cancelled.</p>
              
              <div class="details-card">
                <div class="details-row"><span class="label">Service</span><span class="value">${serviceName}</span></div>
                <div class="details-row"><span class="label">Scheduled Date</span><span class="value">${dateStr}</span></div>
                <div class="details-row"><span class="label">Scheduled Time</span><span class="value">${timeStr}</span></div>
                <div class="details-row"><span class="label">Price</span><span class="value">$${price}</span></div>
                <div class="details-row"><span class="label">Cancellation Date</span><span class="value">${new Date().toLocaleDateString()}</span></div>
              </div>

              ${isPrepaid ? `
              <div class="refund-box">
                <strong>💰 Refund Processed</strong><br>
                Since this was a prepaid appointment (${appointment.paymentMethod}), a full refund of <strong>$${price}</strong> has been automatically issued back to your payment account. Please allow 3-5 business days for it to reflect.
              </div>
              ` : ''}
              
              <p>We hope to serve you again in the future. You are always welcome to book a new appointment on our website whenever you need!</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${salonName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const info = await transporter.sendMail({
        from,
        to: clientEmail,
        subject: `Booking Cancelled: ${serviceName} - ${dateStr}`,
        html: htmlContent
      });

      console.log(`✉️ Email cancellation sent to: ${clientEmail} (ID: ${info.messageId})`);
      const testUrl = nodemailer.getTestMessageUrl(info);
      if (testUrl) {
        console.log(`🔗 [DEVELOPER MAILBOX] View sent cancellation HTML email: ${testUrl}`);
      }
    } catch (err) {
      console.error('❌ Failed to send booking cancellation email:', err);
    }

    // Send SMS
    let smsBody = `Hi ${clientName}, your booking for ${serviceName} on ${dateStr} has been cancelled.`;
    if (isPrepaid) {
      smsBody += ` A full refund of $${price} was automatically processed.`;
    }
    await this.sendSms(clientPhone, smsBody);
  }
}

export const notificationService = new NotificationService();
