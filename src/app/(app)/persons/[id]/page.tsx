import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PersonForm } from "@/modules/clients/person-form";
import { MeasurementForm } from "@/modules/clients/measurement-form";
import { Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { formatDate, type Locale } from "@/lib/i18n";

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");
  const { id } = await params;
  const supabase = await createClient();
  const locale = (ctx.locale as Locale) || "es";

  const { data: person } = await supabase
    .from("persons")
    .select("id, name, notes, client_id, clients(name)")
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .single();
  if (!person) notFound();

  const { data: sets } = await supabase
    .from("measurement_sets")
    .select("id, label, recorded_at, notes, measurement_values(name, value, unit)")
    .eq("person_id", id)
    .order("recorded_at", { ascending: false });

  const staleDays = ctx.measurementStaleDays ?? 30;
  const now = Date.now();

  return (
    <main className="mx-auto max-w-lg p-4 pb-28">
      <PageHeader
        title={person.name}
        subtitle={
          (person.clients as { name?: string } | null)?.name
            ? `Persona destinataria · de ${(person.clients as { name?: string }).name}`
            : "Persona destinataria"
        }
      />
      {person.notes && (
        <p className="mb-4 text-sm text-[var(--ink-muted)]">{person.notes}</p>
      )}

      <section className="mb-6">
        <SectionTitle>Historial de medidas</SectionTitle>
        <ul className="space-y-3">
          {(sets ?? []).map((set) => {
            const ageMs = now - new Date(set.recorded_at).getTime();
            const stale = ageMs > staleDays * 24 * 60 * 60 * 1000;
            const months = Math.floor(ageMs / (30 * 24 * 60 * 60 * 1000));
            return (
              <li
                key={set.id}
                className="rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_1px_2px_rgba(28,29,31,0.04)]"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">
                    {set.label || formatDate(set.recorded_at, locale)}
                  </p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {formatDate(set.recorded_at, locale)}
                  </p>
                </div>
                {stale && (
                  <p className="mb-2 rounded-[4px] bg-[var(--warning-bg)] px-2 py-1 text-[11px] text-[var(--warning)]">
                    Estas medidas fueron registradas hace {months} meses. Se
                    recomienda confirmar antes de usarlas.
                  </p>
                )}
                <dl className="grid grid-cols-3 gap-2">
                  {(set.measurement_values ?? []).map((v, i) => (
                    <div key={i} className="rounded-[4px] bg-[var(--surface-2)] px-2 py-1">
                      <dt className="text-[10px] uppercase text-[var(--ink-muted)]">
                        {v.name}
                      </dt>
                      <dd className="metric text-sm font-semibold">
                        {v.value} {v.unit}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            );
          })}
          {!sets?.length && (
            <li>
              <EmptyState
                title="Sin medidas todavía"
                description="Registra el primer set para congelarlo en presupuestos."
              />
            </li>
          )}
        </ul>
      </section>

      <Card className="mb-6 p-4">
        <SectionTitle>Nuevo set de medidas</SectionTitle>
        <MeasurementForm personId={id} />
      </Card>

      <Card className="p-4">
        <SectionTitle>Añadir otra persona</SectionTitle>
        <PersonForm clientId={typeof person.client_id === "string" ? person.client_id : undefined} />
      </Card>

      {typeof person.client_id === "string" && (
        <p className="mt-4">
          <Link
            href={`/clients/${person.client_id}` as Route}
            className="text-sm font-semibold text-[var(--primary)]"
          >
            ← Volver al cliente
          </Link>
        </p>
      )}
    </main>
  );
}
