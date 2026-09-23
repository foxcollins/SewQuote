export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <div className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="font-display text-2xl">SewQuote</p>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Iniciar sesión / Registrarse (SPEC-009: email, un tenant por usuaria)
        </p>
        <form className="mt-6 space-y-4">
          <label className="block text-sm font-semibold">
            Correo electrónico del taller
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="mt-1 h-11 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--primary)]"
              placeholder="maria@atelier.com"
            />
          </label>
          <label className="block text-sm font-semibold">
            Contraseña
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="mt-1 h-11 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--primary)]"
            />
          </label>
          <button
            type="submit"
            className="h-11 w-full rounded-[6px] bg-[var(--primary)] text-sm font-semibold text-[var(--on-primary)]"
          >
            Entrar a mi Atelier
          </button>
        </form>
        <p className="mt-4 text-xs text-[var(--ink-muted)]">
          ES · PT — sin Google en MVP · sin WhatsApp en MVP
        </p>
      </div>
    </main>
  );
}
