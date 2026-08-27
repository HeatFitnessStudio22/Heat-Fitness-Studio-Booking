import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// POST { token, password } - sets a new password if the token is valid and unexpired.
export async function POST(req: Request) {
  const { token, password } = await req.json();
  if (!token || !password) {
    return NextResponse.json({ error: "Λείπουν στοιχεία." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Ο σύνδεσμος δεν είναι έγκυρος ή έχει λήξει." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
  });

  return NextResponse.json({ ok: true });
}

