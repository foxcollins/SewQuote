import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { ClientForm } from "@/modules/clients/client-form";
import { archiveClientAction } from "@/modules/clients/actions";

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
    <main className="mx-auto max-w-lg p-4 pb-24">
      <header className="mb-4">
        <p className="text-xs text-[var(--ink-muted)]">Cliente</p>
        <h1 className="text-2xl font-semibold">{client.name}</h1>
      </header>

      <section className="mb-6 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="mb-3 text-sm font-semibold">Datos</h2>
        <ClientForm mode="edit" clientId={id} initial={client} />
        <form
          action={async () => {
            "use server";
            await archiveClientAction(id);
          }}
          className="mt-4"
        >
          <button
            type="submit"
            className="text-xs font-semibold text-[var(--error)] hover:underline"
          >
            Archivar cliente
          </button>
        </form>
      </section>

      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Personas destinatarias</h2>
        </div>
        <ul className="space-y-2">
          {(persons ?? []).map((p) => (
            <li key={p.id}>
              <Link
                href={`/persons/${p.id}` as Route}
                className="flex items-center justify-between rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
              >
                <span className="text-sm font-semibold">{p.name}</span>
                <span className="text-xs text-[var(--ink-muted)]">
                  {p.measurement_sets?.length ?? 0} sets de medidas
                </span>
              </Link>
            </li>
          ))}
          {!persons?.length && (
            <li className="text-xs text-[var(--ink-muted)]">
              Sin personas aún. Añade a quien usa la prenda (ej. Ana para el vestido de María).
            </li>
          )}
        </ul>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Presupuestos</h2>
          <Link
            href={`/quotes/new?client_id=${id}` as Route}
            className="text-xs font-semibold text-[var(--primary)]"
          >
            + Nuevo
          </Link>
        </div>
        <ul className="space-y-2">
          {(quotes ?? []).map((q) => (
            <li key={q.id}>
              <Link
                href={`/quotes/${q.id}` as Route}
                className="flex items-center justify-between rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
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
        </ul>
      </section>
    </main>
  );
}
