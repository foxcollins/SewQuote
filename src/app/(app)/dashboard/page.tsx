export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-lg p-4 pb-24">
      <header className="mb-4">
        <p className="text-sm text-[var(--ink-muted)]">LUN 24 OCT</p>
        <h1 className="display text-3xl">Buenos días, María</h1>
        <p className="text-sm text-[var(--ink-muted)]">
          El pulso operativo de tu atelier hoy
        </p>
      </header>
      <div className="grid grid-cols-2 gap-3">
        {[
          { n: "0", label: "Entregas hoy" },
          { n: "0", label: "Atrasado" },
          { n: "0", label: "Por aprobar" },
          { n: "0", label: "Vence hoy" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <p className="metric text-2xl font-semibold text-[var(--primary)]">
              {m.n}
            </p>
            <p className="text-xs text-[var(--ink-muted)]">{m.label}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-[var(--ink-muted)]">
        Asistente IA: fuera de esta versión (V2).
      </p>
    </main>
  );
}
