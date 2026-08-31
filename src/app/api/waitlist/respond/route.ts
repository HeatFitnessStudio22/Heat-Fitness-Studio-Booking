import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendWaitlistOfferEmail } from "@/lib/email";
import { getCapacityForDateStr, formatDateStr } from "@/lib/slots";

// POST { token, accept: boolean }
// Accept: books the slot for that waitlisted customer (if it's still free
// and not past start time), then removes the waitlist entry.
// Decline: removes this entry and offers the spot to the next person in
// line (if any), still respecting the "at least 1.5h before start" rule.
export async function POST(req: Request) {
  const { token, accept } = await req.json();
  if (!token) return NextResponse.json({ error: "Λείπει το token." }, { status: 400 });

  const entry = await prisma.waitlistEntry.findUnique({
    where: { offerToken: token },
    include: { user: true },
  });
  if (!entry) {
    return NextResponse.json({ error: "Η προσφορά δεν βρέθηκε ή έχει ήδη απαντηθεί." }, { status: 404 });
  }
  if (entry.startsAt.getTime() < Date.now()) {
    await prisma.waitlistEntry.delete({ where: { id: entry.id } });
    return NextResponse.json({ error: "Η προσφορά έχει λήξει." }, { status: 400 });
  }

  if (accept) {
    const takenCount = await prisma.booking.count({
      where: { startsAt: entry.startsAt, status: "CONFIRMED" },
    });
    // Respect the same per-date capacity used everywhere else in the app.
    if (takenCount >= getCapacityForDateStr(formatDateStr(entry.startsAt))) {
      await prisma.waitlistEntry.delete({ where: { id: entry.id } });
      return NextResponse.json({ error: "Δυστυχώς η θέση καλύφθηκε ήδη." }, { status: 409 });
    }
    await prisma.booking.create({ data: { userId: entry.userId, startsAt: entry.startsAt } });
    await prisma.waitlistEntry.delete({ where: { id: entry.id } });
    return NextResponse.json({ ok: true, booked: true });
  }

  // Declined: remove this entry, offer to the next person in line.
  await prisma.waitlistEntry.delete({ where: { id: entry.id } });

  const ninetyMinBefore = new Date(entry.startsAt.getTime() - 90 * 60 * 1000);
  if (Date.now() < ninetyMinBefore.getTime()) {
    const nextInLine = await prisma.waitlistEntry.findFirst({
      where: { startsAt: entry.startsAt, offerToken: null },
      orderBy: { createdAt: "asc" },
      include: { user: true },
    });
    if (nextInLine) {
      const newToken = crypto.randomBytes(24).toString("hex");
      await prisma.waitlistEntry.update({
        where: { id: nextInLine.id },
        data: { offerToken: newToken, offeredAt: new Date() },
      });
      const slotLabel = `${new Intl.DateTimeFormat("el-GR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(entry.startsAt)} ${String(entry.startsAt.getHours()).padStart(2, "0")}:00`;
      const base = process.env.NEXTAUTH_URL || "";
      await sendWaitlistOfferEmail({
        fullName: nextInLine.user.fullName,
        email: nextInLine.user.email,
        slotLabel,
        offerUrl: `${base}/waitlist-offer?token=${newToken}`,
      });
    }
  }

  return NextResponse.json({ ok: true, booked: false });
}

