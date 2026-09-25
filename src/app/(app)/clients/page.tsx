import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

import { EmptyState, PageHeader, PrimaryLink, inputClass } from "@/components/ui/primitives";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");
  const { q = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("clients")
    .select("id, name, phone, whatsapp, email, archived_at")
    .is("archived_at", null)
    .order("name");
  if (q.trim()) {
    const term = q.trim();
    query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%`);
  }
  const { data: clients } = await query;

  return (
    <main className="w-full min-w-0 pb-8">
      <PageHeader
        title="Clientes"
        subtitle="Ficha, personas destinatarias y medidas"
        action={
          <PrimaryLink href={"/clients/new" as Route} size="sm">
            + Nuevo
          </PrimaryLink>
        }
      />

      <form className="mb-4 w-full max-w-md" role="search">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o teléfono"
          className={`${inputClass} h-10`}
        />
      </form>

      <ul className="grid w-full min-w-0 grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {(clients ?? []).map((c) => (
          <li key={c.id} className="min-w-0">
            <Link
              href={`/clients/${c.id}` as Route}
              className="flex w-full min-w-0 items-center gap-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[0_1px_2px_rgba(28,29,31,0.04)] transition-colors hover:border-[var(--primary)]/40"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.name}</p>
                <p className="truncate text-xs text-[var(--ink-muted)]">
                  {[c.phone, c.whatsapp, c.email].filter(Boolean).join(" · ") ||
                    "Sin contacto"}
                </p>
              </div>
              <span aria-hidden className="shrink-0 text-[var(--ink-muted)]">
                →
              </span>
            </Link>
          </li>
        ))}
        {!clients?.length && (
          <li className="min-w-0">
            <EmptyState
              title={q ? "Sin resultados" : "Sin clientes"}
              description={
                q
                  ? "Prueba con otro nombre o teléfono."
                  : "Crea el primero para emitir presupuestos."
              }
              action={
                !q ? (
                  <PrimaryLink href={"/clients/new" as Route} size="sm">
                    Nuevo cliente
                  </PrimaryLink>
                ) : undefined
              }
            />
          </li>
        )}
      </ul>
    </main>
  );
}
