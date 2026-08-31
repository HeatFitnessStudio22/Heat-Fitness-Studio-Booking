import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slotDateTime, getCapacityForDateStr } from "@/lib/slots";

// POST { date: "YYYY-MM-DD", hour: number }
// Admin-only: manually occupies one spot at any hour (e.g. for a walk-in or
// to hold a spot back), without going through the customer booking rules
// (no monthly limit, no one-per-day limit, no confirmation email).
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { date, hour } = await req.json();
  if (!date || typeof hour !== "number") {
    return NextResponse.json({ error: "Λείπουν στοιχεία." }, { status: 400 });
  }

  const startsAt = slotDateTime(date, hour);

  const takenCount = await prisma.booking.count({ where: { startsAt, status: "CONFIRMED" } });
  if (takenCount >= getCapacityForDateStr(date)) {
    return NextResponse.json({ error: "Δεν υπάρχουν άλλες διαθέσιμες θέσεις." }, { status: 409 });
  }

  const booking = await prisma.booking.create({
    data: { userId: session.user.id, startsAt },
  });

  return NextResponse.json({ booking });
}

