"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLang, t } from "@/lib/i18n";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [lang, setLang] = useLang();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || t("somethingWrong", lang));
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
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
          {t("setNewPassword", lang)}
        </h1>

        {done ? (
          <p className="text-center text-sm text-gray-300 rounded-lg border neon-border px-4 py-3">
            {t("passwordResetOk", lang)}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">{t("newPassword", lang)}</label>
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
              {loading ? "..." : t("setNewPassword", lang)}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

