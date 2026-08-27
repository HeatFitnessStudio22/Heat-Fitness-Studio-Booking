import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slotDateTime, getSlotHoursForDate, SLOT_CAPACITY } from "@/lib/slots";
import { sendOverLimitEmail, sendBookingConfirmationEmail } from "@/lib/email";

// GET: the logged-in customer's own upcoming bookings, or (for admins) all bookings.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN";

  const bookings = await prisma.booking.findMany({
    where: isAdmin ? {} : { userId: session.user.id },
    include: isAdmin ? { user: { select: { fullName: true, email: true, monthlyLimit: true } } } : undefined,
    orderBy: { startsAt: "asc" },
  });

  return NextResponse.json({ bookings });
}

// POST: create a booking for the logged-in customer.
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
    return NextResponse.json({ error: "Δεν μπορείτε να κλείσετε ραντεβού στο παρελθόν." }, { status: 400 });
  }

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const takenCount = await tx.booking.count({
        where: { startsAt, status: "CONFIRMED" },
      });
      if (takenCount >= SLOT_CAPACITY) {
        throw new Error("FULL");
      }

      const user = await tx.user.findUnique({ where: { id: session.user.id } });
      if (!user) throw new Error("NO_USER");

      // Count this customer's confirmed bookings within the same calendar month.
      const monthStart = new Date(startsAt.getFullYear(), startsAt.getMonth(), 1);
      const monthEnd = new Date(startsAt.getFullYear(), startsAt.getMonth() + 1, 1);
      const monthlyCount = await tx.booking.count({
        where: {
          userId: user.id,
          status: "CONFIRMED",
          startsAt: { gte: monthStart, lt: monthEnd },
        },
      });

      const overLimit = user.monthlyLimit != null && monthlyCount + 1 > user.monthlyLimit;

      const booking = await tx.booking.create({
        data: { userId: user.id, startsAt, overLimit },
      });

      return { booking, user, monthlyCount: monthlyCount + 1, overLimit };
    });
  } catch (err: any) {
    if (err.message === "FULL") {
      return NextResponse.json({ error: "Δυστυχώς η ώρα μόλις γέμισε." }, { status: 409 });
    }
    return NextResponse.json({ error: "Κάτι πήγε στραβά." }, { status: 500 });
  }

  const slotLabel = `${date} ${String(hour).padStart(2, "0")}:00`;

  await sendBookingConfirmationEmail({
    fullName: result.user.fullName,
    email: result.user.email,
    slotLabel,
  });

  if (result.overLimit) {
    await sendOverLimitEmail({
      fullName: result.user.fullName,
      email: result.user.email,
      monthlyLimit: result.user.monthlyLimit!,
      bookingsThisMonth: result.monthlyCount,
      slotLabel,
    });
  }

  return NextResponse.json({ booking: result.booking, overLimit: result.overLimit });
}

