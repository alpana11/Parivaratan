// Email service using EmailJS (free tier: 200 emails/month)
// Alternative: Use Firebase Cloud Functions with SendGrid/Mailgun for production

interface EmailData {
  to: string;
  subject: string;
  message: string;
  partnerName?: string;
}

export const emailService = {
  // Send email notification
  async sendEmail(data: EmailData): Promise<boolean> {
    try {
      // For demo: Log to console (replace with actual email service)
      console.log('📧 EMAIL SENT:', {
        to: data.to,
        subject: data.subject,
        message: data.message
      });

      // Create notification in database for tracking
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {
        // Fallback: Just log if API not available
        console.log('Email API not configured, notification logged only');
      });

      return true;
    } catch (error) {
      console.error('Email send error:', error);
      return false;
    }
  },

  // Partner verification approved
  async sendVerificationApproved(email: string, partnerName: string) {
    return this.sendEmail({
      to: email,
      subject: '✅ Partner Verification Approved - Parivartan',
      message: `
Dear ${partnerName},

Congratulations! Your partner account has been verified and approved.

You can now:
- Access your dashboard
- View assigned waste collection requests
- Start earning reward points
- Redeem vouchers

Next Step: Subscribe to a plan to start receiving waste requests.

Login here: ${window.location.origin}/signin

Best regards,
Parivartan Team
      `,
      partnerName
    });
  },

  // Partner verification rejected
  async sendVerificationRejected(email: string, partnerName: string, reason?: string) {
    return this.sendEmail({
      to: email,
      subject: '❌ Partner Verification Status - Parivartan',
      message: `
Dear ${partnerName},

We regret to inform you that your partner verification could not be approved at this time.

${reason ? `Reason: ${reason}` : ''}

You can:
- Re-upload documents
- Contact support for assistance

Support: support@parivartan.com

Best regards,
Parivartan Team
      `,
      partnerName
    });
  },

  // Subscription activated
  async sendSubscriptionActivated(email: string, partnerName: string, planName: string, amount: number, expiryDate: string) {
    return this.sendEmail({
      to: email,
      subject: '🎉 Subscription Activated - Parivartan',
      message: `
Dear ${partnerName},

Your subscription has been activated successfully!

Plan Details:
- Plan: ${planName}
- Amount: ₹${amount}
- Valid Until: ${new Date(expiryDate).toLocaleDateString()}

You can now:
- Receive waste collection requests
- Access advanced AI insights
- Get priority support

Login to dashboard: ${window.location.origin}/signin

Best regards,
Parivartan Team
      `,
      partnerName
    });
  },

  // Subscription expiring soon
  async sendSubscriptionExpiring(email: string, partnerName: string, daysLeft: number) {
    return this.sendEmail({
      to: email,
      subject: '⚠️ Subscription Expiring Soon - Parivartan',
      message: `
Dear ${partnerName},

Your subscription will expire in ${daysLeft} days.

To continue receiving waste collection requests, please renew your subscription.

Renew now: ${window.location.origin}/subscription-plans

Best regards,
Parivartan Team
      `,
      partnerName
    });
  },

  // New waste request assigned
  async sendWasteRequestAssigned(email: string, partnerName: string, wasteType: string, location: string) {
    return this.sendEmail({
      to: email,
      subject: '🗑️ New Waste Request Assigned - Parivartan',
      message: `
Dear ${partnerName},

A new waste collection request has been assigned to you!

Request Details:
- Type: ${wasteType}
- Location: ${location}

Please login to your dashboard to accept or reject this request.

View request: ${window.location.origin}/dashboard/requests

Best regards,
Parivartan Team
      `,
      partnerName
    });
  },

  // Document verification required
  async sendDocumentUploadConfirmation(email: string, partnerName: string) {
    return this.sendEmail({
      to: email,
      subject: '📄 Documents Received - Parivartan',
      message: `
Dear ${partnerName},

We have received your documents for verification.

Our team will review them within 24-48 hours and notify you of the status.

Track status: ${window.location.origin}/verification-status

Best regards,
Parivartan Team
      `,
      partnerName
    });
  }
};
