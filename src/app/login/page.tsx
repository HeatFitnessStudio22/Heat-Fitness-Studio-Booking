"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang, t } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const [lang, setLang] = useLang();
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
      setError(t("wrongCreds", lang));
      return;
    }
    router.push("/");
    router.refresh();
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
          {t("login", lang)}
        </h1>
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
          {loading ? "..." : t("login", lang)}
        </button>
        <p className="text-center text-sm text-gray-400">
          <Link href="/forgot-password" className="text-gray-400 underline">
            {t("forgotPassword", lang)}
          </Link>
        </p>
        <p className="text-center text-sm text-gray-400">
          {t("noAccount", lang)}{" "}
          <Link href="/register" className="neon-text underline">
            {t("register", lang)}
          </Link>
        </p>
      </form>
    </main>
  );
}

