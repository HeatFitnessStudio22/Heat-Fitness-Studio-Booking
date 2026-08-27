"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

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
                    {new Date(b.startsAt).toLocaleString("el-GR")}
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
          <h2 className="text-sm uppercase tracking-widest text-gray-300 mb-3">
            Επερχόμενα ραντεβού ({upcoming.length})
          </h2>
          <div className="space-y-2">
            {upcoming.map((b) => (
              <div
                key={b.id}
                className={`rounded-lg border px-4 py-3 flex justify-between items-center ${
                  b.overLimit ? "border-red-500/40" : "border-gray-700"
                }`}
              >
                <div>
                  <div className="font-semibold">{b.user.fullName}</div>
                  <div className="text-xs text-gray-400">{b.user.email}</div>
                  <div className="text-xs text-gray-300 mt-1">
                    {new Date(b.startsAt).toLocaleString("el-GR")}
                  </div>
                </div>
                <button onClick={() => cancelBooking(b.id)} className="text-xs rounded-md border border-gray-600 px-3 py-2">
                  Ακύρωση
                </button>
              </div>
            ))}
            {upcoming.length === 0 && <p className="text-gray-500 text-sm">Δεν υπάρχουν ραντεβού.</p>}
          </div>
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

