"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { DAY_LABELS_EL, formatDateStr } from "@/lib/slots";
import { useLang, t, DAY_LABELS_EN } from "@/lib/i18n";

type Slot = { hour: number; label: string; remaining: number; waitlisted: boolean; myBooking: boolean };
type MyBooking = { id: string; startsAt: string; status: string };

function buildDaysUntilYearEnd() {
  const days: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const end = new Date(2026, 11, 31); // 31 Δεκεμβρίου 2026
  while (d.getTime() <= end.getTime()) {
    if (d.getDay() !== 0) days.push(new Date(d)); // skip Sunday - closed
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export default function BookPage() {
  const { data: session } = useSession();
  const [lang, setLang] = useLang();
  const dayLabels = lang === "el" ? DAY_LABELS_EL : DAY_LABELS_EN;
  const days = useMemo(() => buildDaysUntilYearEnd(), []);
  const [selectedDate, setSelectedDate] = useState(days[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);
  const [cancelMessage, setCancelMessage] = useState<string | null>(null);

  const dateStr = formatDateStr(selectedDate);

  function loadMyBookings() {
    fetch("/api/bookings")
      .then((r) => r.json())
      .then((data) => setMyBookings(data.bookings || []));
  }

  useEffect(() => {
    loadMyBookings();
  }, []);

  async function cancelMyBooking(id: string) {
    setCancelMessage(null);
    const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setCancelMessage(data.error || t("somethingWrong", lang));
      return;
    }
    if (data.warning) {
      setCancelMessage(data.warning);
    }
    loadMyBookings();
    fetch(`/api/slots?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots || []));
  }

  useEffect(() => {
    setLoadingSlots(true);
    fetch(`/api/slots?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots || []))
      .finally(() => setLoadingSlots(false));
  }, [dateStr]);

  async function confirmBooking() {
    if (!selectedSlot) return;
    setSubmitting(true);
    setMessage(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr, hour: selectedSlot.hour }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setMessage(data.error || t("somethingWrong", lang));
      return;
    }
    setSelectedSlot(null);
    setMessage(t("bookingConfirmed", lang));
    loadMyBookings();
    fetch(`/api/slots?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots || []));
  }

  async function toggleWaitlist(slot: Slot) {
    setMessage(null);
    const method = slot.waitlisted ? "DELETE" : "POST";
    const res = await fetch("/api/waitlist", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateStr, hour: slot.hour }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || t("somethingWrong", lang));
      return;
    }
    fetch(`/api/slots?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => setSlots(data.slots || []));
  }

  return (
    <main className="min-h-screen pb-16">
      <div className="flex justify-between px-4 pt-4">
        <button
          onClick={() => setLang(lang === "el" ? "en" : "el")}
          className="text-xs text-gray-400 border border-gray-700 rounded-md px-2 py-1"
        >
          {lang === "el" ? "EN" : "ΕΛ"}
        </button>
        <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs text-gray-400 underline">
          {t("signOut", lang)} ({session?.user?.name})
        </button>
      </div>

      <div className="flex flex-col items-center px-4">
        <img src="/heat-logo.png" alt="HEAT The Fitness Studio" className="w-64 mb-6" />
        <h1 className="tracking-[0.3em] text-gray-300 text-sm uppercase mb-3">
          {t("bookingTitle", lang)}
        </h1>
        <p className="text-gray-400 text-sm text-center mb-6">
          Δεληγιώργη 119-121, Πειραιάς 18534 · +30 6988251973
        </p>
      </div>

      <hr className="border-gray-800 mb-6" />

      <div className="px-4">
        <h2 className="tracking-[0.2em] text-gray-300 text-xs uppercase mb-3">{t("pickDay", lang)}</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {days.map((d) => {
            const isSelected = formatDateStr(d) === dateStr;
            return (
              <button
                key={formatDateStr(d)}
                onClick={() => {
                  setSelectedDate(d);
                  setSelectedSlot(null);
                  setMessage(null);
                }}
                className={`shrink-0 rounded-xl border px-5 py-3 text-center ${
                  isSelected ? "neon-border" : "border-gray-700"
                }`}
              >
                <div className={`text-xs uppercase ${isSelected ? "neon-text" : "text-gray-400"}`}>
                  {dayLabels[d.getDay()]}
                </div>
                <div className={`text-lg font-bold ${isSelected ? "text-white" : "text-gray-300"}`}>
                  {d.getDate()}/{d.getMonth() + 1}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 mt-8">
        <h2 className="tracking-[0.2em] text-gray-300 text-xs uppercase mb-3">{t("availableHours", lang)}</h2>

        {loadingSlots && <p className="text-gray-500 text-sm">{t("loading", lang)}</p>}
        {!loadingSlots && slots.length === 0 && (
          <p className="text-gray-500 text-sm">{t("closedToday", lang)}</p>
        )}

        <div className="grid grid-cols-2 gap-4">
          {slots.map((s) => {
            const full = s.remaining <= 0;
            if (s.myBooking) {
              return (
                <div key={s.hour} className="rounded-xl border neon-border px-4 py-5 text-left">
                  <div className="text-2xl font-bold text-white">{s.label}</div>
                  <div className="text-sm neon-text mt-1">{t("yourBooking", lang)}</div>
                </div>
              );
            }
            if (full) {
              return (
                <div
                  key={s.hour}
                  className="rounded-xl border border-gray-800 px-4 py-5 text-left"
                >
                  <div className="text-2xl font-bold text-gray-500">{s.label}</div>
                  <div className="text-sm text-gray-500 mt-1 mb-3">{t("full", lang)}</div>
                  <button
                    onClick={() => toggleWaitlist(s)}
                    className={`text-xs rounded-md px-3 py-2 border w-full ${
                      s.waitlisted ? "neon-border neon-text" : "border-gray-600 text-gray-300"
                    }`}
                  >
                    {s.waitlisted ? t("willNotify", lang) : t("declareInterest", lang)}
                  </button>
                </div>
              );
            }
            return (
              <button
                key={s.hour}
                onClick={() => setSelectedSlot(s)}
                className="rounded-xl border border-gray-700 hover:neon-border px-4 py-5 text-left"
              >
                <div className="text-2xl font-bold text-white">{s.label}</div>
                <div className="text-sm text-gray-400 mt-1">
                  {s.remaining} {t("spots", lang)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {message && (
        <div className="fixed bottom-4 left-4 right-4 rounded-lg bg-heatBlack2 border neon-border px-4 py-3 text-center">
          {message}
        </div>
      )}

      {selectedSlot && (
        <div className="fixed inset-0 bg-black/70 flex items-end z-50">
          <div className="w-full rounded-t-2xl bg-heatBlack2 border-t neon-border px-6 py-8">
            <div className="text-3xl font-bold neon-text mb-1">{selectedSlot.label}</div>
            <div className="text-gray-300 mb-6">
              {new Intl.DateTimeFormat(lang === "el" ? "el-GR" : "en-GB", {
                weekday: "long",
                day: "numeric",
                month: "numeric",
                year: "numeric",
              }).format(selectedDate)}
            </div>

            <div className="mb-4">
              <div className="text-xs text-gray-400 mb-1">{t("fullName", lang)}</div>
              <div className="rounded-lg bg-black border border-gray-700 px-4 py-3">
                {session?.user?.name}
              </div>
            </div>
            <div className="mb-6">
              <div className="text-xs text-gray-400 mb-1">{t("email", lang)}</div>
              <div className="rounded-lg bg-black border border-gray-700 px-4 py-3">
                {session?.user?.email}
              </div>
            </div>

            <div className="rounded-lg border neon-border px-4 py-3 text-sm text-gray-200 mb-6">
              {t("cancelPolicy", lang)}
            </div>

            {message && <p className="text-red-400 text-sm mb-3">{message}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedSlot(null)}
                className="flex-1 rounded-lg border border-gray-600 py-3 text-gray-300"
              >
                {t("cancel", lang)}
              </button>
              <button
                onClick={confirmBooking}
                disabled={submitting}
                className="flex-1 btn-neon rounded-lg py-3 disabled:opacity-60"
              >
                {submitting ? "..." : t("confirmBooking", lang)}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="px-4 mt-10">
        <h2 className="tracking-[0.2em] text-gray-300 text-xs uppercase mb-3">{t("myBookings", lang)}</h2>

        {cancelMessage && <p className="text-red-400 text-sm mb-3">{cancelMessage}</p>}

        {myBookings.filter((b) => b.status === "CONFIRMED").length === 0 && (
          <p className="text-gray-500 text-sm">{t("noBookings", lang)}</p>
        )}

        <div className="flex flex-col gap-3">
          {myBookings
            .filter((b) => b.status === "CONFIRMED")
            .map((b) => {
              const dt = new Date(b.startsAt);
              // startsAt is stored with the intended hour written directly as
              // UTC (see admin/page.tsx for the full explanation) - always
              // read it back with the UTC getters, not local ones.
              return (
                <div
                  key={b.id}
                  className="rounded-lg border border-gray-700 px-4 py-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-white font-bold">
                      {String(dt.getUTCDate()).padStart(2, "0")}/{String(dt.getUTCMonth() + 1).padStart(2, "0")}{" "}
                      {String(dt.getUTCHours()).padStart(2, "0")}:00
                    </div>
                    <div className="text-xs text-gray-500">{dayLabels[dt.getUTCDay()]}</div>
                  </div>
                  <button
                    onClick={() => cancelMyBooking(b.id)}
                    className="text-xs rounded-md border border-gray-600 px-3 py-2 text-gray-300"
                  >
                    {t("cancelBooking", lang)}
                  </button>
                </div>
              );
            })}
        </div>
      </div>
    </main>
  );
}

