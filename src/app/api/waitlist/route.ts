import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slotDateTime, getSlotHoursForDate, getCapacityForDateStr } from "@/lib/slots";

// GET: the logged-in customer's own waitlist entries.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await prisma.waitlistEntry.findMany({
    where: { userId: session.user.id },
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json({ entries });
}

// POST: join the waitlist for a full slot.
// body: { date: "YYYY-MM-DD", hour: number }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, hour } = await req.json();
  if (!date || typeof hour !== "number") {
    return NextResponse.json({ error: "Λείπουν στοιχεία." }, { status: 400 });
  }

  const [y, m, d] = date.split("-").map(Number);
  const dObj = new Date(y, m - 1, d);
  const validHours = getSlotHoursForDate(dObj);
  if (!validHours.includes(hour)) {
    return NextResponse.json({ error: "Μη έγκυρη ώρα για αυτή την ημέρα." }, { status: 400 });
  }

  const startsAt = slotDateTime(date, hour);
  if (startsAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "Δεν μπορείτε να δηλώσετε ενδιαφέρον για το παρελθόν." }, { status: 400 });
  }

  const takenCount = await prisma.booking.count({ where: { startsAt, status: "CONFIRMED" } });
  if (takenCount < getCapacityForDateStr(date)) {
    return NextResponse.json({ error: "Η ώρα έχει διαθέσιμες θέσεις, κλείστε κανονικά." }, { status: 400 });
  }

  const alreadyBooked = await prisma.booking.count({
    where: { userId: session.user.id, startsAt, status: "CONFIRMED" },
  });
  if (alreadyBooked > 0) {
    return NextResponse.json({ error: "Έχετε ήδη ραντεβού για αυτή την ώρα." }, { status: 400 });
  }

  try {
    const entry = await prisma.waitlistEntry.create({
      data: { userId: session.user.id, startsAt },
    });
    return NextResponse.json({ entry });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return NextResponse.json({ error: "Έχετε ήδη δηλώσει ενδιαφέρον για αυτή την ώρα." }, { status: 409 });
    }
    return NextResponse.json({ error: "Κάτι πήγε στραβά." }, { status: 500 });
  }
}

// DELETE: leave a waitlist. body: { date: "YYYY-MM-DD", hour: number }
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { date, hour } = await req.json();
  if (!date || typeof hour !== "number") {
    return NextResponse.json({ error: "Λείπουν στοιχεία." }, { status: 400 });
  }
  const startsAt = slotDateTime(date, hour);

  await prisma.waitlistEntry.deleteMany({
    where: { userId: session.user.id, startsAt },
  });

  return NextResponse.json({ ok: true });
}

