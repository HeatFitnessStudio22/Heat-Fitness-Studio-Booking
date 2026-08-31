"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import { getSlotHoursForDate, DAY_LABELS_EL, formatDateStr, getCapacityForDateStr } from "@/lib/slots";

function formatDT(iso: string) {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  return `${day}/${month}/${d.getFullYear()}, ${hh}:00`;
}

type Booking = {
  id: string;
  startsAt: string;
  status: "CONFIRMED" | "CANCELLED";
  overLimit: boolean;
  user: { fullName: string; email: string; monthlyLimit: number | null };
};

type UserRow = {
  id: string;
  fullName: string;
  email: string;
  monthlyLimit: number | null;
  bookingsThisMonth: number;
};

export default function AdminPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [limitDraft, setLimitDraft] = useState<Record<string, string>>({});
  const [limitStatus, setLimitStatus] = useState<Record<string, "saving" | "saved" | "error">>({});
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    const [bRes, uRes] = await Promise.all([fetch("/api/bookings"), fetch("/api/admin/bookings")]);
    const bData = await bRes.json();
    const uData = await uRes.json();
    setBookings(bData.bookings || []);
    setUsers(uData.users || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function cancelBooking(id: string) {
    if (!confirm("Ακύρωση αυτού του ραντεβού;")) return;
    await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    loadAll();
  }

  async function blockSlot(date: string, hour: number) {
    const res = await fetch("/api/admin/block-slot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, hour }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Κάτι πήγε στραβά.");
      return;
    }
    loadAll();
  }

  async function saveLimit(email: string) {
    const raw = limitDraft[email];
    const monthlyLimit = raw === "" || raw === undefined ? null : Number(raw);
    setLimitStatus((prev) => ({ ...prev, [email]: "saving" }));
    try {
      const res = await fetch("/api/admin/limits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, monthlyLimit }),
      });
      if (!res.ok) throw new Error("failed");
      setLimitStatus((prev) => ({ ...prev, [email]: "saved" }));
      setLimitDraft((prev) => {
        const next = { ...prev };
        delete next[email];
        return next;
      });
      await loadAll();
      setTimeout(() => setLimitStatus((prev) => ({ ...prev, [email]: undefined as any })), 2500);
    } catch {
      setLimitStatus((prev) => ({ ...prev, [email]: "error" }));
    }
  }

  const upcoming = bookings
    .filter((b) => b.status === "CONFIRMED" && new Date(b.startsAt).getTime() >= Date.now() - 3600_000)
    .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));

  const overLimitBookings = upcoming.filter((b) => b.overLimit);

  // Weekly calendar: Monday..Saturday of the week offset by weekOffset weeks
  // from today (Sunday is always closed, so it's skipped).
  const weekDays = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dow = today.getDay(); // 0=Sun..6=Sat
    const daysSinceMonday = dow === 0 ? 6 : dow - 1;
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysSinceMonday + weekOffset * 7);
    const days: Date[] = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekOffset]);

  const calendarHours = useMemo(() => {
    const set = new Set<number>();
    for (const d of weekDays) for (const h of getSlotHoursForDate(d)) set.add(h);
    return Array.from(set).sort((a, b) => a - b);
  }, [weekDays]);

  const bookingsByDayHour = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (b.status !== "CONFIRMED") continue;
      const d = new Date(b.startsAt);
      const key = `${formatDateStr(d)}_${d.getHours()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return map;
  }, [bookings]);

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-bold neon-text tracking-widest uppercase">HEAT · Admin</h1>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs text-gray-400 underline">
          Αποσύνδεση
        </button>
      </div>

      {loading && <p className="text-gray-500">Φόρτωση...</p>}

      {!loading && overLimitBookings.length > 0 && (
        <section className="mb-10">
          <h2 className="text-sm uppercase tracking-widest text-red-400 mb-3">
            ⚠ Υπερβάσεις μηνιαίου ορίου ({overLimitBookings.length})
          </h2>
          <div className="space-y-2">
            {overLimitBookings.map((b) => (
              <div key={b.id} className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{b.user.fullName}</div>
                  <div className="text-xs text-gray-400">{b.user.email}</div>
                  <div className="text-xs text-gray-300 mt-1">
                    {formatDT(b.startsAt)}
                  </div>
                </div>
                <button onClick={() => cancelBooking(b.id)} className="text-xs rounded-md border border-gray-600 px-3 py-2">
                  Ακύρωση
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm uppercase tracking-widest text-gray-300">Ημερολόγιο</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                className="text-xs rounded-md border border-gray-600 px-2 py-1"
              >
                ‹
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs rounded-md border border-gray-600 px-2 py-1"
              >
                Σήμερα
              </button>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                className="text-xs rounded-md border border-gray-600 px-2 py-1"
              >
                ›
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left text-gray-500 font-normal pb-2 pr-2 w-14"></th>
                  {weekDays.map((d) => (
                    <th
                      key={formatDateStr(d)}
                      onClick={() => {
                        setSelectedDay(formatDateStr(d) === selectedDay ? null : formatDateStr(d));
                        setSelectedCell(null);
                      }}
                      className={`text-center font-normal pb-2 px-1 cursor-pointer ${
                        formatDateStr(d) === selectedDay ? "neon-text" : "text-gray-400"
                      }`}
                    >
                      <div>{DAY_LABELS_EL[d.getDay()]}</div>
                      <div className={formatDateStr(d) === selectedDay ? "font-bold" : "text-gray-200 font-bold"}>
                        {d.getDate()}/{d.getMonth() + 1}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calendarHours.map((h) => (
                  <tr key={h}>
                    <td className="text-gray-500 pr-2 py-1 align-top">{String(h).padStart(2, "0")}:00</td>
                    {weekDays.map((d) => {
                      const open = getSlotHoursForDate(d).includes(h);
                      const key = `${formatDateStr(d)}_${h}`;
                      const cellBookings = bookingsByDayHour.get(key) || [];
                      return (
                        <td key={key} className="px-1 py-1 align-top">
                          {!open ? (
                            <div className="h-8 rounded bg-gray-900" />
                          ) : cellBookings.length === 0 ? (
                            <div className="h-8 rounded border border-gray-800" />
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedCell(key === selectedCell ? null : key);
                                setSelectedDay(null);
                              }}
                              className={`w-full text-left rounded border px-1 py-1 ${
                                key === selectedCell
                                  ? "border-white bg-white/10"
                                  : cellBookings.length >= 7
                                  ? "border-red-500/50 bg-red-500/10"
                                  : "neon-border bg-white/5"
                              }`}
                              title={cellBookings.map((b) => b.user.fullName).join(", ")}
                            >
                              <div className="truncate text-[10px] leading-tight">
                                {cellBookings[0].user.fullName.split(" ")[0]}
                                {cellBookings.length > 1 ? ` +${cellBookings.length - 1}` : ""}
                              </div>
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedDay &&
            (() => {
              const dayBookings = bookings
                .filter((b) => b.status === "CONFIRMED" && formatDateStr(new Date(b.startsAt)) === selectedDay)
                .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
              return (
                <div className="mt-3 rounded-lg border border-gray-700 px-4 py-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">{selectedDay}</span>
                    <button onClick={() => setSelectedDay(null)} className="text-xs text-gray-500 underline">
                      Κλείσιμο
                    </button>
                  </div>
                  <div className="space-y-2">
                    {dayBookings.map((b) => (
                      <div key={b.id} className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-semibold">
                            {formatDT(b.startsAt).split(", ")[1]} — {b.user.fullName}
                          </div>
                          <div className="text-xs text-gray-400">{b.user.email}</div>
                        </div>
                        <button
                          onClick={() => cancelBooking(b.id)}
                          className="text-xs rounded-md border border-gray-600 px-3 py-2"
                        >
                          Ακύρωση
                        </button>
                      </div>
                    ))}
                    {dayBookings.length === 0 && (
                      <p className="text-gray-500 text-sm">Δεν υπάρχουν ραντεβού αυτή την ημέρα.</p>
                    )}
                  </div>
                </div>
              );
            })()}

          {selectedCell &&
            (() => {
              const cellBookings = bookingsByDayHour.get(selectedCell) || [];
              const [dateStr, hourStr] = selectedCell.split("_");
              return (
                <div className="mt-3 rounded-lg border border-gray-700 px-4 py-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-400">
                      {dateStr} · {String(hourStr).padStart(2, "0")}:00
                    </span>
                    <button onClick={() => setSelectedCell(null)} className="text-xs text-gray-500 underline">
                      Κλείσιμο
                    </button>
                  </div>
                  <div className="space-y-2">
                    {cellBookings.map((b) => (
                      <div key={b.id} className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-semibold">{b.user.fullName}</div>
                          <div className="text-xs text-gray-400">{b.user.email}</div>
                        </div>
                        <button
                          onClick={() => cancelBooking(b.id)}
                          className="text-xs rounded-md border border-gray-600 px-3 py-2"
                        >
                          Ακύρωση
                        </button>
                      </div>
                    ))}
                  </div>
                  {cellBookings.length < getCapacityForDateStr(dateStr) && (
                    <button
                      onClick={() => blockSlot(dateStr, Number(hourStr))}
                      className="mt-3 w-full text-xs rounded-md border border-gray-600 px-3 py-2 text-gray-300"
                    >
                      + Κλείσιμο θέσης (
                      {getCapacityForDateStr(dateStr) - cellBookings.length} διαθέσιμες)
                    </button>
                  )}
                </div>
              );
            })()}
        </section>
      )}

      {!loading && (
        <section className="mb-10">
          <h2 className="text-sm uppercase tracking-widest text-gray-300 mb-3">
            Ρυθμισμένα όρια
          </h2>
          <div className="rounded-lg border border-gray-700 px-4 py-3">
            {users.filter((u) => u.monthlyLimit !== null).length === 0 && (
              <p className="text-gray-500 text-sm">Δεν έχετε ορίσει όρια ακόμα.</p>
            )}
            <div className="flex flex-col gap-1">
              {users
                .filter((u) => u.monthlyLimit !== null)
                .map((u) => (
                  <div key={u.id} className="text-sm text-gray-200">
                    {u.email} <span className="neon-text">({u.monthlyLimit})</span>
                  </div>
                ))}
            </div>
          </div>
        </section>
      )}

      {!loading && (
        <section>
          <h2 className="text-sm uppercase tracking-widest text-gray-300 mb-3">
            Μηνιαία όρια πελατών
          </h2>
          <div className="space-y-2">
            {users.map((u) => (
              <div key={u.id} className="rounded-lg border border-gray-700 px-4 py-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-semibold">{u.fullName}</div>
                    <div className="text-xs text-gray-400">{u.email}</div>
                  </div>
                  <div className="text-xs text-gray-300 text-right">
                    {u.bookingsThisMonth} προπονήσεις τον μήνα
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min={0}
                    placeholder={u.monthlyLimit === null ? "χωρίς όριο" : String(u.monthlyLimit)}
                    value={limitDraft[u.email] ?? ""}
                    onChange={(e) => setLimitDraft((prev) => ({ ...prev, [u.email]: e.target.value }))}
                    className="w-32 rounded-md bg-black border border-gray-700 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => saveLimit(u.email)}
                    disabled={limitStatus[u.email] === "saving"}
                    className="text-xs rounded-md btn-neon px-3 py-2 disabled:opacity-60"
                  >
                    {limitStatus[u.email] === "saving" ? "..." : "Αποθήκευση"}
                  </button>
                  {limitStatus[u.email] === "saved" && (
                    <span className="text-xs neon-text">Αποθηκεύτηκε!</span>
                  )}
                  {limitStatus[u.email] === "error" && (
                    <span className="text-xs text-red-400">Σφάλμα, δοκιμάστε ξανά.</span>
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="text-gray-500 text-sm">Δεν υπάρχουν πελάτες ακόμα.</p>}
          </div>
        </section>
      )}
    </main>
  );
}

