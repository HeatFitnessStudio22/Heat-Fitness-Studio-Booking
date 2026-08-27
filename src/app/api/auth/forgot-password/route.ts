import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

// POST { email } - generates a reset token (valid 1 hour) and emails a link.
// Always returns ok:true regardless of whether the email exists, so this
// endpoint can't be used to check which emails are registered.
export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Λείπει το email." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiresAt: expiresAt },
    });

    const base = process.env.NEXTAUTH_URL || "";
    const resetUrl = `${base}/reset-password?token=${token}`;

    await sendPasswordResetEmail({ fullName: user.fullName, email: user.email, resetUrl });
  }

  return NextResponse.json({ ok: true });
}

