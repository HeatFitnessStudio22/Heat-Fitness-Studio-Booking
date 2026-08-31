"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/lib/i18n";

function WaitlistOfferContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [lang] = useLang();
  const [result, setResult] = useState<"accepted" | "declined" | "error" | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function respond(accept: boolean) {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/waitlist/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, accept }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || (lang === "el" ? "Κάτι πήγε στραβά." : "Something went wrong."));
        setResult("error");
        return;
      }
      setResult(accept ? "accepted" : "declined");
    } catch {
      setErrorMsg(lang === "el" ? "Κάτι πήγε στραβά." : "Something went wrong.");
      setResult("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <img src="/heat-logo.png" alt="HEAT The Fitness Studio" className="w-56 mb-8" />

      {result === null && (
        <div className="w-full max-w-sm space-y-6">
          <h1 className="text-lg text-gray-200">
            {lang === "el" ? "Ελευθερώθηκε θέση — θέλετε να την κλείσετε;" : "A spot opened up — do you want it?"}
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => respond(false)}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-600 py-3 text-gray-300 disabled:opacity-60"
            >
              {lang === "el" ? "Όχι" : "No"}
            </button>
            <button
              onClick={() => respond(true)}
              disabled={loading}
              className="flex-1 btn-neon rounded-lg py-3 disabled:opacity-60"
            >
              {loading ? "..." : lang === "el" ? "Ναι" : "Yes"}
            </button>
          </div>
        </div>
      )}

      {result === "accepted" && (
        <p className="rounded-lg border neon-border px-4 py-3 text-gray-200 max-w-sm">
          {lang === "el" ? "Το ραντεβού σας επιβεβαιώθηκε!" : "Your appointment is confirmed!"}
        </p>
      )}
      {result === "declined" && (
        <p className="rounded-lg border border-gray-700 px-4 py-3 text-gray-400 max-w-sm">
          {lang === "el" ? "Εντάξει, ευχαριστούμε για την ενημέρωση." : "No problem, thanks for letting us know."}
        </p>
      )}
      {result === "error" && (
        <p className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-300 max-w-sm">
          {errorMsg}
        </p>
      )}

      <p className="mt-8">
        <Link href="/book" className="neon-text underline text-sm">
          {lang === "el" ? "Πίσω στην εφαρμογή" : "Back to the app"}
        </Link>
      </p>
    </main>
  );
}

export default function WaitlistOfferPage() {
  return (
    <Suspense fallback={null}>
      <WaitlistOfferContent />
    </Suspense>
  );
}

