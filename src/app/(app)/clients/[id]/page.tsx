import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { ClientForm } from "@/modules/clients/client-form";
import { archiveClientAction } from "@/modules/clients/actions";
import { Card, EmptyState, PageHeader, SectionTitle } from "@/components/ui/primitives";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", ctx.tenantId)
    .single();
  if (!client) notFound();

  const [{ data: persons }, { data: quotes }] = await Promise.all([
    supabase
      .from("persons")
      .select("id, name, notes, measurement_sets(id, label, recorded_at)")
      .eq("client_id", id)
      .order("name"),
    supabase
      .from("quotes")
      .select("id, quote_number, status, suggested_price, final_price, valid_until")
      .eq("client_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return (
    <main className="mx-auto max-w-3xl pb-8">
      <PageHeader title={client.name} subtitle="Cliente" />

      <Card className="mb-6 p-4">
        <SectionTitle>Datos</SectionTitle>
        <ClientForm mode="edit" clientId={id} initial={client} />
        <form
          action={async () => {
            "use server";
            await archiveClientAction(id);
          }}
          className="mt-4 text-center"
        >
          <button
            type="submit"
            className="text-xs font-semibold text-[var(--error)] hover:underline"
          >
            Archivar cliente
          </button>
        </form>
      </Card>

      <section className="mb-6">
        <SectionTitle>Personas destinatarias</SectionTitle>
        <ul className="space-y-2">
          {(persons ?? []).map((p) => (
            <li key={p.id}>
              <Link
                href={`/persons/${p.id}` as Route}
                className="flex items-center justify-between rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[0_1px_2px_rgba(28,29,31,0.04)] transition-colors hover:border-[var(--primary)]/40"
              >
                <span className="text-sm font-semibold">{p.name}</span>
                <span className="text-xs text-[var(--ink-muted)]">
                  {p.measurement_sets?.length ?? 0} sets de medidas
                </span>
              </Link>
            </li>
          ))}
          {!persons?.length && (
            <li>
              <EmptyState
                title="Sin personas"
                description="Añade a quien usa la prenda (ej. Ana para el vestido de María)."
              />
            </li>
          )}
        </ul>
      </section>

      <section>
        <SectionTitle
          action={
            <Link
              href={`/quotes/new?client_id=${id}` as Route}
              className="text-xs font-semibold text-[var(--primary)]"
            >
              + Nuevo
            </Link>
          }
        >
          Presupuestos
        </SectionTitle>
        <ul className="space-y-2">
          {(quotes ?? []).map((q) => (
            <li key={q.id}>
              <Link
                href={`/quotes/${q.id}` as Route}
                className="flex items-center justify-between rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[0_1px_2px_rgba(28,29,31,0.04)] transition-colors hover:border-[var(--primary)]/40"
              >
                <span className="text-sm font-semibold">
                  #{String(q.quote_number).padStart(3, "0")}
                </span>
                <span className="text-xs uppercase text-[var(--ink-muted)]">
                  {q.status}
                </span>
              </Link>
            </li>
          ))}
          {!quotes?.length && (
            <li>
              <EmptyState
                title="Sin presupuestos"
                description="Crea el primero desde el botón superior."
              />
            </li>
          )}
        </ul>
      </section>
    </main>
  );
}
