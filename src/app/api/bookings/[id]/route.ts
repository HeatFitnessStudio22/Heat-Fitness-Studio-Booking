import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWaitlistPromotedEmail } from "@/lib/email";

// DELETE /api/bookings/:id - cancel a booking.
// Admins can cancel any booking (this is the gym's "decline a client" button).
// Customers can cancel their own booking, subject to the 4-hour policy shown
// in the UI ("Ακύρωση δέχεται μέχρι 4 ώρες πριν το ραντεβού...").
//
// If the slot's start time is still at least 1.5 hours away, the oldest
// (FIFO) waitlist entry for that exact slot is automatically promoted to a
// confirmed booking, and that customer is emailed.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const booking = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!booking) return NextResponse.json({ error: "Δεν βρέθηκε." }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = booking.userId === session.user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdmin) {
    const fourHoursBefore = new Date(booking.startsAt.getTime() - 4 * 60 * 60 * 1000);
    if (Date.now() > fourHoursBefore.getTime()) {
      return NextResponse.json(
        { error: "Η ακύρωση δεν είναι πλέον δυνατή (λιγότερο από 4 ώρες πριν το ραντεβού)." },
        { status: 400 }
      );
    }
  }

  await prisma.booking.update({ where: { id: params.id }, data: { status: "CANCELLED" } });

  // Try to promote someone from the waitlist for this exact slot, but only
  // if there's still at least 1.5 hours until it starts.
  const ninetyMinBefore = new Date(booking.startsAt.getTime() - 90 * 60 * 1000);
  if (Date.now() < ninetyMinBefore.getTime()) {
    const nextInLine = await prisma.waitlistEntry.findFirst({
      where: { startsAt: booking.startsAt },
      orderBy: { createdAt: "asc" },
      include: { user: true },
    });

    if (nextInLine) {
      const promotedBooking = await prisma.booking.create({
        data: { userId: nextInLine.userId, startsAt: booking.startsAt },
      });
      await prisma.waitlistEntry.delete({ where: { id: nextInLine.id } });

      const slotLabel = `${new Intl.DateTimeFormat("el-GR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(booking.startsAt)} ${String(booking.startsAt.getHours()).padStart(2, "0")}:00`;

      await sendWaitlistPromotedEmail({
        fullName: nextInLine.user.fullName,
        email: nextInLine.user.email,
        slotLabel,
      });
    }
  }

  return NextResponse.json({ ok: true });
}

