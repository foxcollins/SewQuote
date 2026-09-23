export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 p-6">
      <div className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="font-display text-3xl">SewQuote</p>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          Smart quotes &amp; atelier management
        </p>
        <p className="mt-4 text-sm">
          Fase de implementación: scaffold + design tokens + motor de cálculo.
          Auth y módulos de dominio siguen los specs SDD.
        </p>
        <a
          href="/login"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-[6px] bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--on-primary)]"
        >
          Entrar a mi Atelier
        </a>
      </div>
    </main>
  );
}
