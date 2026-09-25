import Link from "next/link";
import type { Route } from "next";
import { notFound, redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { ClientForm } from "@/modules/clients/client-form";
import { archiveClientAction } from "@/modules/clients/actions";
import { PersonForm } from "@/modules/clients/person-form";
import {
  Card,
  EmptyState,
  PageHeader,
  SectionTitle,
} from "@/components/ui/primitives";
import { t, tp, statusLabel } from "@/lib/i18n";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");
  const { id } = await params;
  const supabase = await createClient();
  const locale = ctx.locale;

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
      <PageHeader
        title={client.name}
        subtitle={t(locale, "clients.detail.subtitle")}
      />

      <Card className="mb-6 p-4">
        <SectionTitle>{t(locale, "clients.details")}</SectionTitle>
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
            {t(locale, "clients.detail.archive")}
          </button>
        </form>
      </Card>

      <section className="mb-6">
        <SectionTitle>{t(locale, "clients.persons")}</SectionTitle>
        <ul className="space-y-2">
          {(persons ?? []).map((p) => (
            <li key={p.id}>
              <Link
                href={`/persons/${p.id}` as Route}
                className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[0_1px_2px_rgba(28,29,31,0.04)] transition-colors hover:border-[var(--primary)]/40"
              >
                <span className="min-w-0 truncate text-sm font-semibold">{p.name}</span>
                <span className="shrink-0 text-xs whitespace-nowrap text-[var(--ink-muted)]">
                  {tp(locale, "clients.detail.sets_count", p.measurement_sets?.length ?? 0)}
                </span>
              </Link>
            </li>
          ))}
          {!persons?.length && (
            <li>
              <EmptyState
                title={t(locale, "clients.detail.no_persons")}
                description={t(locale, "clients.detail.no_persons_hint")}
              />
            </li>
          )}
        </ul>
        <Card className="mt-3 p-4">
          <SectionTitle>
            {t(
              locale,
              persons?.length ? "clients.person.add" : "clients.detail.first_person"
            )}
          </SectionTitle>
          <PersonForm clientId={id} />
        </Card>
      </section>

      <section>
        <SectionTitle
          action={
            <Link
              href={`/quotes/new?client_id=${id}` as Route}
              className="text-xs font-semibold text-[var(--primary)]"
            >
              {t(locale, "clients.detail.new_quote")}
            </Link>
          }
        >
          {t(locale, "quotes.title")}
        </SectionTitle>
        <ul className="space-y-2">
          {(quotes ?? []).map((q) => (
            <li key={q.id}>
              <Link
                href={`/quotes/${q.id}` as Route}
                className="flex items-center justify-between gap-3 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[0_1px_2px_rgba(28,29,31,0.04)] transition-colors hover:border-[var(--primary)]/40"
              >
                <span className="metric min-w-0 truncate text-sm font-semibold">
                  #{String(q.quote_number).padStart(3, "0")}
                </span>
                <span className="shrink-0 text-xs whitespace-nowrap text-[var(--ink-muted)] uppercase">
                  {statusLabel(locale, "quote", q.status)}
                </span>
              </Link>
            </li>
          ))}
          {!quotes?.length && (
            <li>
              <EmptyState
                title={t(locale, "clients.detail.no_quotes")}
                description={t(locale, "clients.detail.no_quotes_hint")}
              />
            </li>
          )}
        </ul>
      </section>

      <p className="mt-4">
        <Link href={"/clients" as Route} className="text-sm font-semibold text-[var(--primary)]">
          ← {t(locale, "clients.back")}
        </Link>
      </p>
    </main>
  );
}
