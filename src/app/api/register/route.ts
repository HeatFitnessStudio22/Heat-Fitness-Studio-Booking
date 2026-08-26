import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { fullName, email, password } = await req.json();

  if (!fullName || !email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Συμπληρώστε ονοματεπώνυμο, email και κωδικό (τουλάχιστον 6 χαρακτήρες)." },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) {
    return NextResponse.json({ error: "Υπάρχει ήδη λογαριασμός με αυτό το email." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    },
  });

  return NextResponse.json({ id: user.id, email: user.email });
}

