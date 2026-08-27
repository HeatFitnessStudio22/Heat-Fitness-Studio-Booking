import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

