import Link from "next/link";
import type { Route } from "next";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

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
    <main className="mx-auto max-w-lg p-4 pb-24">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <Link
          href={"/clients/new" as Route}
          className="rounded-[6px] bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-[var(--on-primary)]"
        >
          + Nuevo
        </Link>
      </header>

      <form className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o teléfono"
          className="h-10 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
        />
      </form>

      <ul className="space-y-2">
        {(clients ?? []).map((c) => (
          <li key={c.id}>
            <Link
              href={`/clients/${c.id}` as Route}
              className="flex items-center justify-between rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-3"
            >
              <div>
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {[c.phone, c.whatsapp, c.email].filter(Boolean).join(" · ")}
                </p>
              </div>
              <span aria-hidden className="text-[var(--ink-muted)]">
                →
              </span>
            </Link>
          </li>
        ))}
        {!clients?.length && (
          <li className="rounded-[6px] border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--ink-muted)]">
            Sin clientes. Crea el primero para emitir presupuestos.
          </li>
        )}
      </ul>
    </main>
  );
}
