"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/i18n-provider";
import { translateServerMessage } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import { syncTenantLocaleAction } from "@/modules/tenant/actions";

type Mode = "login" | "register";

const inputClass =
  "h-11 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-muted)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]";

function FieldIcon({ path }: { path: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--ink-muted)]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  );
}

const icons = {
  user: "M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8",
  store: "M3 9l1.5-5h15L21 9M4 9v11h16V9M4 9h16M9 20v-6h6v6",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v10H6z",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff:
    "M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 5.1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17.5 17.5 0 0 1-3.2 4M6.1 6.1C3.8 7.8 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.9-.8",
  scissors:
    "M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.5 7.5 20 18M8.5 16.5 20 6",
  straighten: "M3 17 17 3l4 4L7 21z M7 13l2 2M11 9l2 2M15 5l2 2",
  verified:
    "M12 3l2.2 1.6 2.7-.1.9 2.6 2.2 1.6-1 2.5 1 2.5-2.2 1.6-.9 2.6-2.7-.1L12 21l-2.2-1.6-2.7.1-.9-2.6L4 15.3l1-2.5-1-2.5 2.2-1.6.9-2.6 2.7.1z M9 12l2 2 4-4",
  arrow: "M5 12h14M13 6l6 6-6 6",
};

export function AuthScreen() {
  const router = useRouter();
  const { locale, setLocale, t } = useI18n();
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isRegister = mode === "register";
  const activeTab =
    "flex-1 rounded-[6px] bg-[var(--surface)] px-3 py-2 text-center text-sm font-semibold text-[var(--primary)] shadow-sm";
  const idleTab =
    "flex-1 rounded-[6px] px-3 py-2 text-center text-sm font-medium text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]";

  function redirectToDashboard() {
    router.push("/dashboard");
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setNotice(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("name") ?? "").trim();
    const atelierName = String(form.get("atelier") ?? "").trim();
    const origin =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    try {
      const supabase = createClient();

      if (isRegister) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
            data: {
              full_name: fullName,
              atelier_name: atelierName,
              locale,
            },
          },
        });
        if (signUpError) throw signUpError;
        if (data.session) {
          redirectToDashboard();
        } else {
          setNotice(t("auth.check_email"));
        }
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;

      await supabase.auth.updateUser({ data: { locale } });
      await syncTenantLocaleAction(locale).catch(() => undefined);

      redirectToDashboard();
    } catch (err) {
      setError(translateServerMessage(err, locale));
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (loading) return;
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(translateServerMessage(err, locale));
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (loading) return;
    const email = (
      document.getElementById("auth-email") as HTMLInputElement | null
    )?.value?.trim();
    if (!email) {
      setError(t("auth.error_email"));
      return;
    }
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${origin}/auth/callback?next=/dashboard` },
      );
      if (resetError) throw resetError;
      setNotice(t("auth.reset_sent"));
    } catch (err) {
      setError(translateServerMessage(err, locale));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-[var(--border)]/60 bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-lg items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--primary)]">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d={icons.scissors} />
              </svg>
            </span>
            <span className="font-display text-lg font-medium tracking-tight">
              {t("app.name")}
            </span>
          </div>
          <div
            className="flex items-center gap-1 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-0.5"
            role="group"
            aria-label={t("auth.select_language")}
          >
            {(["es", "pt-BR"] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                className={
                  locale === code
                    ? "rounded-[4px] bg-[var(--surface-2)] px-2 py-1 text-xs font-semibold text-[var(--primary)]"
                    : "rounded-[4px] px-2 py-1 text-xs font-medium text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }
                aria-pressed={locale === code}
              >
                {code === "es" ? "ES" : "PT"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-size:24px_24px]"
        />
        <div className="relative z-10 flex w-full max-w-[480px] flex-col items-center">
          <div className="mb-6 w-full text-center">
            <div className="relative mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--primary)] shadow-sm">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d={icons.scissors} />
              </svg>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--secondary)] text-[var(--on-primary)] ring-2 ring-[var(--canvas)]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d={icons.straighten} />
                </svg>
              </span>
            </div>
            <h1 className="mt-3 font-display text-3xl tracking-tight text-[var(--ink)] sm:text-4xl">
              {t("app.name")}
            </h1>
            <p className="mt-1 font-display text-base italic text-[var(--secondary)]">
              {t("app.tagline")}
            </p>
          </div>

          <div className="w-full rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-6">
            <div
              role="tablist"
              aria-label={t("auth.title")}
              className="mb-5 flex items-center rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={!isRegister}
                onClick={() => {
                  setMode("login");
                  setError(null);
                  setNotice(null);
                }}
                className={isRegister ? idleTab : activeTab}
              >
                {t("auth.login")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isRegister}
                onClick={() => {
                  setMode("register");
                  setError(null);
                  setNotice(null);
                }}
                className={isRegister ? activeTab : idleTab}
              >
                {t("auth.register")}
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="mb-4 flex h-11 w-full items-center justify-center gap-3 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold text-[var(--ink)] transition-all hover:bg-[var(--surface-2)] active:scale-[0.99] disabled:opacity-60"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              {t("auth.continue_google")}
            </button>

            <div className="mb-4 flex items-center justify-center gap-3">
              <span className="h-px flex-1 bg-[var(--border)]" />
              <span className="text-xs text-[var(--ink-muted)]">{t("auth.or")}</span>
              <span className="h-px flex-1 bg-[var(--border)]" />
            </div>

            {error && (
              <p
                role="alert"
                className="mb-3 rounded-[6px] border border-[var(--error)]/30 bg-[var(--error-bg)] px-3 py-2 text-xs text-[var(--error)]"
              >
                {error}
              </p>
            )}
            {notice && (
              <p
                role="status"
                className="mb-3 rounded-[6px] border border-[var(--success)]/30 bg-[var(--success-bg)] px-3 py-2 text-xs text-[var(--success)]"
              >
                {notice}
              </p>
            )}

            <form className="space-y-3" onSubmit={handleSubmit}>
              {isRegister && (
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-[var(--ink)]">
                    {t("auth.full_name")}
                    <span className="relative mt-1 block">
                      <FieldIcon path={icons.user} />
                      <input
                        type="text"
                        name="name"
                        autoComplete="name"
                        required
                        placeholder={t("auth.placeholder_full_name")}
                        className={`${inputClass} pl-10`}
                      />
                    </span>
                  </label>
                  <label className="block text-sm font-semibold text-[var(--ink)]">
                    <span className="mb-1 flex items-center justify-between gap-2">
                      <span>{t("auth.atelier")}</span>
                      <span className="text-[11px] font-normal text-[var(--secondary)]">
                        {t("auth.atelier_hint")}
                      </span>
                    </span>
                    <span className="relative block">
                      <FieldIcon path={icons.store} />
                      <input
                        type="text"
                        name="atelier"
                        autoComplete="organization"
                        required
                        placeholder={t("auth.placeholder_atelier")}
                        className={`${inputClass} pl-10`}
                      />
                    </span>
                  </label>
                </div>
              )}

              <label className="block text-sm font-semibold text-[var(--ink)]">
                {t("auth.email")}
                <span className="relative mt-1 block">
                  <FieldIcon path={icons.mail} />
                  <input
                    id="auth-email"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder={t("auth.placeholder_email")}
                    className={`${inputClass} pl-10`}
                  />
                </span>
              </label>

              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold text-[var(--ink)]"
                  >
                    {t("auth.password")}
                  </label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={loading}
                      className="text-xs font-semibold text-[var(--primary)] hover:underline disabled:opacity-60"
                    >
                      {t("auth.forgot_password")}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <FieldIcon path={icons.lock} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    minLength={isRegister ? 8 : undefined}
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    placeholder={t("auth.placeholder_password")}
                    className={`${inputClass} pl-10 pr-11 font-mono`}
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? t("auth.hide_password") : t("auth.show_password")
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-[4px] p-1 text-[var(--ink-muted)] hover:text-[var(--ink)]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-[18px] w-[18px]"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d={showPassword ? icons.eyeOff : icons.eye} />
                    </svg>
                  </button>
                </div>
                {isRegister && (
                  <p className="mt-1 text-[11px] text-[var(--ink-muted)]">
                    {t("auth.password_hint")}
                  </p>
                )}
              </div>

              <label className="flex cursor-pointer select-none items-center gap-2.5 pt-1 text-sm text-[var(--ink)]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] accent-[var(--primary)]"
                />
                {t("auth.remember")}
              </label>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-[6px] bg-[var(--primary)] text-sm font-semibold tracking-wide text-[var(--on-primary)] transition-colors hover:bg-[var(--primary-hover)] active:scale-[0.98] disabled:opacity-60"
                >
                  {loading
                    ? t("auth.loading")
                    : isRegister
                      ? t("auth.submit_register")
                      : t("auth.submit")}
                  {!loading && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d={icons.arrow} />
                    </svg>
                  )}
                </button>
              </div>
            </form>

            {isRegister && (
              <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--ink-muted)]">
                {t("auth.terms")}
              </p>
            )}
          </div>

          <div className="mt-4 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface-2)]/70 px-4 py-3 text-center">
            <p className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--ink)]">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-[var(--secondary)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d={icons.verified} />
              </svg>
              {t("auth.trust_title")}
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border)]/60 bg-[var(--surface)]/90">
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-1 px-4 py-3 text-center text-[11px] text-[var(--ink-muted)] sm:flex-row sm:gap-2">
          <span>{t("auth.footer_copy")}</span>
          <span aria-hidden>·</span>
          <span>{t("auth.footer_terms")}</span>
          <span aria-hidden>·</span>
          <span>{t("auth.footer_privacy")}</span>
        </div>
      </footer>
    </div>
  );
}
