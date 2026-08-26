import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST { email, monthlyLimit: number | null } - admin sets a customer's
// monthly booking allowance. monthlyLimit = null means "unlimited".
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, monthlyLimit } = await req.json();
  if (!email) return NextResponse.json({ error: "Λείπει το email." }, { status: 400 });

  const user = await prisma.user.update({
    where: { email: email.toLowerCase().trim() },
    data: { monthlyLimit: monthlyLimit === null ? null : Number(monthlyLimit) },
  });

  return NextResponse.json({ id: user.id, email: user.email, monthlyLimit: user.monthlyLimit });
}

