"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);
    if (res?.error) {
      setError("Λάθος email ή κωδικός.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <img src="/heat-logo.png" alt="HEAT The Fitness Studio" className="w-40 mb-8" />
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-sm tracking-widest text-gray-400 uppercase mb-2">
          Σύνδεση
        </h1>
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
          {loading ? "..." : "Σύνδεση"}
        </button>
        <p className="text-center text-sm text-gray-400">
          Δεν έχετε λογαριασμό;{" "}
          <Link href="/register" className="neon-text underline">
            Εγγραφή
          </Link>
        </p>
      </form>
    </main>
  );
}

