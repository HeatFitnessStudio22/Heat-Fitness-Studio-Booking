import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/bookings/:id - cancel a booking.
// Admins can cancel any booking (this is the gym's "decline a client" button).
// Customers can cancel their own booking, subject to the 1-day policy shown
// in the UI ("Ακύρωση δέχεται μέχρι 1 μέρα πριν το ραντεβού...").
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
    const oneDayBefore = new Date(booking.startsAt.getTime() - 24 * 60 * 60 * 1000);
    if (Date.now() > oneDayBefore.getTime()) {
      return NextResponse.json(
        { error: "Η ακύρωση δεν είναι πλέον δυνατή (λιγότερο από 1 μέρα πριν το ραντεβού)." },
        { status: 400 }
      );
    }
  }

  await prisma.booking.update({ where: { id: params.id }, data: { status: "CANCELLED" } });
  return NextResponse.json({ ok: true });
}

