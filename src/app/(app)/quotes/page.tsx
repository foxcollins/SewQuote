export default function QuotesPage() {
  return (
    <main className="mx-auto max-w-lg p-4 pb-24">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl">Presupuestos</h1>
        <a
          href="/quotes/new"
          className="inline-flex h-10 items-center rounded-[6px] bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--on-primary)]"
        >
          + Nuevo presupuesto
        </a>
      </header>
      <p className="text-sm text-[var(--ink-muted)]">
        Listado por tenant (RLS). Estados: borrador → enviado → aprobado /
        rechazado / vencido / cancelado.
      </p>
      <ul className="mt-4 space-y-3">
        <li className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="flex items-center justify-between">
            <span className="metric text-sm">#001</span>
            <span className="rounded-[4px] border border-[var(--border)] bg-[var(--draft-bg)] px-2 py-0.5 text-[11px] font-semibold uppercase text-[var(--draft)]">
              Borrador
            </span>
          </div>
          <p className="mt-2 text-sm">Sin presupuestos de ejemplo reales aún.</p>
        </li>
      </ul>
    </main>
  );
}
