import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Sends a password reset link to the customer.
export async function sendPasswordResetEmail(params: { fullName: string; email: string; resetUrl: string }) {
  if (!resend) return;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "HEAT Booking <onboarding@resend.dev>",
    to: params.email,
    subject: `HEAT: Επαναφορά κωδικού / Password reset`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:24px">
        <h2 style="color:#E4FF1A">Επαναφορά κωδικού</h2>
        <p>Γεια σου <strong>${params.fullName}</strong>,</p>
        <p>Πάτησε τον παρακάτω σύνδεσμο για να ορίσεις νέο κωδικό (ισχύει για 1 ώρα):</p>
        <p><a href="${params.resetUrl}" style="color:#E4FF1A">${params.resetUrl}</a></p>
        <p style="color:#999;font-size:13px">Αν δεν ζήτησες εσύ επαναφορά κωδικού, αγνόησε αυτό το email.</p>
        <hr style="border-color:#333;margin:24px 0">
        <h2 style="color:#E4FF1A">Password reset</h2>
        <p>Hi <strong>${params.fullName}</strong>,</p>
        <p>Click the link below to set a new password (valid for 1 hour):</p>
        <p><a href="${params.resetUrl}" style="color:#E4FF1A">${params.resetUrl}</a></p>
        <p style="color:#999;font-size:13px">If you didn't request this, you can ignore this email.</p>
      </div>
    `,
  });
}

// Offers a customer on the waitlist the chance to take a spot that just
// opened up. They must click the link and confirm - it isn't automatic.
export async function sendWaitlistOfferEmail(params: {
  fullName: string;
  email: string;
  slotLabel: string;
  offerUrl: string;
}) {
  if (!resend) return;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "HEAT Booking <onboarding@resend.dev>",
    to: params.email,
    subject: `HEAT: Ελευθερώθηκε θέση - θέλετε να την κλείσετε;`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:24px">
        <h2 style="color:#E4FF1A">Ελευθερώθηκε θέση!</h2>
        <p>Γεια σου <strong>${params.fullName}</strong>,</p>
        <p>Είχες δηλώσει ενδιαφέρον για μια γεμάτη προπόνηση, και μόλις ελευθερώθηκε θέση για:</p>
        <p style="font-size:20px;font-weight:bold">${params.slotLabel}</p>
        <p>Θέλεις να την κλείσεις; Πάτησε τον παρακάτω σύνδεσμο για να απαντήσεις:</p>
        <p><a href="${params.offerUrl}" style="color:#E4FF1A">${params.offerUrl}</a></p>
        <p style="color:#999;font-size:13px">Η προσφορά ισχύει μέχρι να ξεκινήσει η προπόνηση ή μέχρι να απαντήσει κάποιος άλλος πιο γρήγορα.</p>
      </div>
    `,
  });
}

// Sends a booking confirmation email to the customer who just booked.
// Silently no-ops if RESEND_API_KEY isn't set.
export async function sendBookingConfirmationEmail(params: {
  fullName: string;
  email: string;
  slotLabel: string;
}) {
  if (!resend) return;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "HEAT Booking <onboarding@resend.dev>",
    to: params.email,
    subject: `HEAT: Το ραντεβού σας επιβεβαιώθηκε`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:24px">
        <h2 style="color:#E4FF1A">Το ραντεβού σας επιβεβαιώθηκε!</h2>
        <p>Γεια σου <strong>${params.fullName}</strong>,</p>
        <p>Η προπόνησή σου στο HEAT The Fitness Studio κλείστηκε για:</p>
        <p style="font-size:20px;font-weight:bold">${params.slotLabel}</p>
        <p>Ακύρωση δέχεται μέχρι 4 ώρες πριν το ραντεβού, μέσα από την εφαρμογή.</p>
        <p style="color:#999;font-size:13px">Δεληγιώργη 119-121, Πειραιάς 18534 · +30 6988251973</p>
      </div>
    `,
  });
}

// Sends the "you're over your monthly limit" notice to the customer themselves.
export async function sendCustomerOverLimitEmail(params: {
  fullName: string;
  email: string;
  monthlyLimit: number;
  bookingsThisMonth: number;
  slotLabel: string;
}) {
  if (!resend) return;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "HEAT Booking <onboarding@resend.dev>",
    to: params.email,
    subject: `HEAT: Ξεπεράσατε το μηνιαίο σας όριο`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:24px">
        <h2 style="color:#E4FF1A">Ξεπεράσατε το μηνιαίο σας όριο προπονήσεων</h2>
        <p>Γεια σου <strong>${params.fullName}</strong>,</p>
        <p>Το ραντεβού σου για <strong>${params.slotLabel}</strong> επιβεβαιώθηκε κανονικά,
        αλλά θέλουμε να σε ενημερώσουμε ότι έχεις ήδη ${params.bookingsThisMonth} προπονήσεις
        αυτόν τον μήνα, ενώ το όριό σου είναι ${params.monthlyLimit}.</p>
        <p style="color:#999;font-size:13px">Δεληγιώργη 119-121, Πειραιάς 18534 · +30 6988251973</p>
      </div>
    `,
  });
}

// Sends the "over monthly limit" notification email to the gym admin.
// Silently no-ops if RESEND_API_KEY / ADMIN_NOTIFICATION_EMAIL aren't set,
// so local/dev setups without email configured don't crash.
export async function sendOverLimitEmail(params: {
  fullName: string;
  email: string;
  monthlyLimit: number;
  bookingsThisMonth: number;
  slotLabel: string;
}) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!resend || !to) return;

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "HEAT Booking <onboarding@resend.dev>",
    to,
    subject: `HEAT: Υπέρβαση μηνιαίου ορίου - ${params.fullName}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:24px">
        <h2 style="color:#E4FF1A">Υπέρβαση μηνιαίου ορίου προπονήσεων</h2>
        <p><strong>${params.fullName}</strong> (${params.email}) έκλεισε ραντεβού για
        <strong>${params.slotLabel}</strong> έχοντας ήδη ${params.bookingsThisMonth} προπονήσεις
        αυτόν τον μήνα, ενώ το όριο του/της είναι ${params.monthlyLimit}.</p>
        <p>Δείτε τις λεπτομέρειες στο admin dashboard.</p>
      </div>
    `,
  });
}

