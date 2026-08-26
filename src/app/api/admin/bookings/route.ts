import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - full customer list with their current-month booking counts, for the
// admin dashboard's "set limits" panel.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: {
      id: true,
      fullName: true,
      email: true,
      monthlyLimit: true,
      bookings: {
        where: { status: "CONFIRMED", startsAt: { gte: monthStart, lt: monthEnd } },
        select: { id: true },
      },
    },
    orderBy: { fullName: "asc" },
  });

  const result = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    monthlyLimit: u.monthlyLimit,
    bookingsThisMonth: u.bookings.length,
  }));

  return NextResponse.json({ users: result });
}

