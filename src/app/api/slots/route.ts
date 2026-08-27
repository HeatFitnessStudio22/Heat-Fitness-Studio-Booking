import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSlotHoursForDate, slotDateTime, SLOT_CAPACITY } from "@/lib/slots";

// GET /api/slots?date=YYYY-MM-DD
// Returns available hours for that date with remaining capacity.
// Never exposes who booked - only how many spots remain, per the gym's
// privacy requirement. Also flags, for the logged-in customer, whether
// they're already on the waitlist for each (full) slot.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date");
  if (!dateStr) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);

  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const hours = getSlotHoursForDate(date);

  const dayStart = slotDateTime(dateStr, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: { startsAt: { gte: dayStart, lt: dayEnd }, status: "CONFIRMED" },
    select: { startsAt: true },
  });

  const counts = new Map<number, number>();
  for (const b of bookings) {
    const h = b.startsAt.getHours();
    counts.set(h, (counts.get(h) ?? 0) + 1);
  }

  let waitlistedHours = new Set<number>();
  if (session) {
    const entries = await prisma.waitlistEntry.findMany({
      where: { userId: session.user.id, startsAt: { gte: dayStart, lt: dayEnd } },
      select: { startsAt: true },
    });
    waitlistedHours = new Set(entries.map((e) => e.startsAt.getHours()));
  }

  const slots = hours.map((hour) => {
    const taken = counts.get(hour) ?? 0;
    return {
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      remaining: Math.max(0, SLOT_CAPACITY - taken),
      waitlisted: waitlistedHours.has(hour),
    };
  });

  return NextResponse.json({ slots });
}

