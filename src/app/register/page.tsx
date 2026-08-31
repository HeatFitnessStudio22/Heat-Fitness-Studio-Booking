"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang, t } from "@/lib/i18n";

export default function RegisterPage() {
  const router = useRouter();
  const [lang, setLang] = useLang();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("somethingWrong", lang));
        return;
      }
      router.push("/login");
    } catch {
      setError(t("somethingWrong", lang));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex justify-end mb-2">
        <button
          onClick={() => setLang(lang === "el" ? "en" : "el")}
          className="text-xs text-gray-400 border border-gray-700 rounded-md px-2 py-1"
        >
          {lang === "el" ? "EN" : "ΕΛ"}
        </button>
      </div>
      <img src="/heat-logo.png" alt="HEAT The Fitness Studio" className="w-56 mb-8" />
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-sm tracking-widest text-gray-400 uppercase mb-2">
          {t("register", lang)}
        </h1>
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t("fullName", lang)}</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg bg-heatBlack2 border border-gray-700 px-4 py-3 text-white outline-none focus:neon-border"
            placeholder={t("namePlaceholder", lang)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t("email", lang)}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-heatBlack2 border border-gray-700 px-4 py-3 text-white outline-none focus:neon-border"
            placeholder={t("emailPlaceholder", lang)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">{t("password", lang)}</label>
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
          {loading ? "..." : t("register", lang)}
        </button>
        <p className="text-center text-sm text-gray-400">
          {t("haveAccount", lang)}{" "}
          <Link href="/login" className="neon-text underline">
            {t("login", lang)}
          </Link>
        </p>
      </form>
    </main>
  );
}

