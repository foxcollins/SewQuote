export default function NewQuotePage() {
  return (
    <main className="mx-auto max-w-lg p-4 pb-24">
      <h1 className="mb-4 text-2xl">Nuevo presupuesto</h1>
      <p className="text-sm text-[var(--ink-muted)]">
        Form mobile-first: cliente → trabajos (N) → servicios/materiales →
        mano de obra → calcular → guardar borrador (snapshots).
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
        <li>Cliente y persona destinataria (opcional)</li>
        <li>Agregar trabajo con categoría</li>
        <li>Servicios y materiales con precio vigente</li>
        <li>Complejidad, urgencia, validez</li>
        <li>Ver desglose (SPEC-001) y guardar</li>
      </ol>
    </main>
  );
}
