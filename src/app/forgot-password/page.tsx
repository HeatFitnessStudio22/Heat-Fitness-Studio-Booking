"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang, t } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const [lang, setLang] = useLang();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSent(true);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex justify-end mb-4">
        <button
          onClick={() => setLang(lang === "el" ? "en" : "el")}
          className="text-xs text-gray-400 border border-gray-700 rounded-md px-2 py-1"
        >
          {lang === "el" ? "EN" : "ΕΛ"}
        </button>
      </div>
      <img src="/heat-logo.png" alt="HEAT The Fitness Studio" className="w-56 mb-8" />
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-center text-sm tracking-widest text-gray-400 uppercase mb-2">
          {t("resetPasswordTitle", lang)}
        </h1>

        {sent ? (
          <p className="text-center text-sm text-gray-300 rounded-lg border neon-border px-4 py-3">
            {t("resetLinkSent", lang)}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-400 text-center">{t("resetPasswordDesc", lang)}</p>
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
            <button
              type="submit"
              disabled={loading}
              className="btn-neon w-full rounded-lg py-3 disabled:opacity-60"
            >
              {loading ? "..." : t("sendResetLink", lang)}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-400">
          <Link href="/login" className="neon-text underline">
            {t("login", lang)}
          </Link>
        </p>
      </div>
    </main>
  );
}

