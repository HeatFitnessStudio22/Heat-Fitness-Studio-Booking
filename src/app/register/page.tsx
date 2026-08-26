"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Κάτι πήγε στραβά.");
      return;
    }
    router.push("/login");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <img src="/heat-logo.png" alt="HEAT The Fitness Studio" className="w-40 mb-8" />
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-sm tracking-widest text-gray-400 uppercase mb-2">
          Εγγραφή
        </h1>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Όνομα</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg bg-heatBlack2 border border-gray-700 px-4 py-3 text-white outline-none focus:neon-border"
            placeholder="π.χ. Γιώργος Παπαδόπουλος"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-heatBlack2 border border-gray-700 px-4 py-3 text-white outline-none focus:neon-border"
            placeholder="π.χ. giorgos@example.com"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Κωδικός</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-heatBlack2 border border-gray-700 px-4 py-3 text-white outline-none focus:neon-border"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-neon w-full rounded-lg py-3 disabled:opacity-60"
        >
          {loading ? "..." : "Εγγραφή"}
        </button>
        <p className="text-center text-sm text-gray-400">
          Έχετε ήδη λογαριασμό;{" "}
          <Link href="/login" className="neon-text underline">
            Σύνδεση
          </Link>
        </p>
      </form>
    </main>
  );
}

