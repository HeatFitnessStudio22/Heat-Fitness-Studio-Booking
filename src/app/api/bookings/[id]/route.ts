import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendWaitlistOfferEmail, sendBookingCancelledEmail, sendAdminCancellationNoticeEmail } from "@/lib/email";

// DELETE /api/bookings/:id - cancel a booking.
// Admins can cancel any booking (this is the gym's "decline a client" button)
// - the affected customer is emailed that their booking was cancelled.
// Customers can cancel their own booking up to 4 hours before it starts.
//
// If the slot's start time is still at least 1.5 hours away, the oldest
// (FIFO) waitlist entry for that exact slot is offered the spot by email -
// they must confirm before it's actually booked for them.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: { user: true },
  });
  if (!booking) return NextResponse.json({ error: "Δεν βρέθηκε." }, { status: 404 });

  const isAdmin = session.user.role === "ADMIN";
  const isOwner = booking.userId === session.user.id;
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isLate = !isAdmin && Date.now() > booking.startsAt.getTime() - 4 * 60 * 60 * 1000;

  await prisma.booking.update({
    where: { id: params.id },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  const slotLabel = `${new Intl.DateTimeFormat("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(booking.startsAt)} ${String(booking.startsAt.getHours()).padStart(2, "0")}:00`;

  if (isAdmin) {
    await sendBookingCancelledEmail({
      fullName: booking.user.fullName,
      email: booking.user.email,
      slotLabel,
    });
  }

  await sendAdminCancellationNoticeEmail({
    fullName: booking.user.fullName,
    email: booking.user.email,
    slotLabel,
    cancelledBy: isAdmin ? "admin" : "customer",
  });

  // Offer the spot to the oldest (FIFO) waitlist entry for this exact slot,
  // but only if there's still at least 1.5 hours until it starts.
  const ninetyMinBefore = new Date(booking.startsAt.getTime() - 90 * 60 * 1000);
  if (Date.now() < ninetyMinBefore.getTime()) {
    const nextInLine = await prisma.waitlistEntry.findFirst({
      where: { startsAt: booking.startsAt, offerToken: null },
      orderBy: { createdAt: "asc" },
      include: { user: true },
    });

    if (nextInLine) {
      const token = crypto.randomBytes(24).toString("hex");
      await prisma.waitlistEntry.update({
        where: { id: nextInLine.id },
        data: { offerToken: token, offeredAt: new Date() },
      });

      const base = process.env.NEXTAUTH_URL || "";
      const offerUrl = `${base}/waitlist-offer?token=${token}`;

      await sendWaitlistOfferEmail({
        fullName: nextInLine.user.fullName,
        email: nextInLine.user.email,
        slotLabel,
        offerUrl,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    late: isLate,
    warning: isLate
      ? "Η ακύρωση έγινε, αλλά ήταν εκτός του χρονικού ορίου (4 ώρες πριν το ραντεβού) και ενδέχεται να υπάρχει χρέωση."
      : undefined,
  });
}

