import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

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

