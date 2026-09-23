import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { formatMoney, type Locale } from "@/lib/i18n";
import {
  createJobCategoryAction,
  createMaterialAction,
  createServiceAction,
  toggleJobCategoryAction,
  toggleServiceAction,
  upsertMaterialPriceAction,
} from "@/modules/catalog/actions";

const input =
  "mt-1 h-10 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm";

export default async function CatalogPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");
  const locale = (ctx.locale as Locale) || "es";
  const supabase = await createClient();

  const [servicesRes, materialsRes, catsRes, pricesRes] = await Promise.all([
    supabase.from("services").select("*").order("name"),
    supabase.from("materials").select("*").order("name"),
    supabase.from("job_categories").select("*").order("name"),
    supabase
      .from("material_prices")
      .select("material_id, unit_price, valid_from")
      .order("valid_from", { ascending: false }),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const currentPrice = new Map<string, number>();
  for (const p of pricesRes.data ?? []) {
    if (p.valid_from <= today && !currentPrice.has(p.material_id)) {
      currentPrice.set(p.material_id, Number(p.unit_price));
    }
  }

  return (
    <main className="mx-auto max-w-lg p-4 pb-24">
      <h1 className="mb-4 text-2xl font-semibold">Catálogo</h1>

      <section className="mb-6 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="mb-3 text-sm font-semibold">Servicios</h2>
        <ul className="mb-3 space-y-2">
          {(servicesRes.data ?? []).map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-[4px] bg-[var(--surface-2)] px-3 py-2 text-sm"
            >
              <div>
                <p className={s.active ? "" : "opacity-50"}>{s.name}</p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {s.base_price != null
                    ? formatMoney(Number(s.base_price), ctx.currency, locale)
                    : "—"}
                  {s.estimated_minutes ? ` · ${s.estimated_minutes} min` : ""}
                </p>
              </div>
              <form action={toggleServiceAction.bind(null, s.id, !s.active)}>
                <button className="text-xs font-semibold text-[var(--primary)]">
                  {s.active ? "Desactivar" : "Activar"}
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={createServiceAction} className="grid grid-cols-2 gap-2">
          <label className="col-span-2 block text-sm font-semibold">
            Nombre
            <input name="name" required className={input} />
          </label>
          <label className="block text-sm font-semibold">
            Precio base
            <input name="base_price" type="number" step="0.01" className={input} />
          </label>
          <label className="block text-sm font-semibold">
            Minutos
            <input name="estimated_minutes" type="number" className={input} />
          </label>
          <label className="col-span-2 block text-sm font-semibold">
            Categoría
            <input name="category" className={input} />
          </label>
          <button
            type="submit"
            className="col-span-2 h-10 rounded-[6px] bg-[var(--primary)] text-sm font-semibold text-[var(--on-primary)]"
          >
            Añadir servicio
          </button>
        </form>
      </section>

      <section className="mb-6 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="mb-3 text-sm font-semibold">Materiales</h2>
        <ul className="mb-3 space-y-2">
          {(materialsRes.data ?? []).map((m) => {
            const price = currentPrice.get(m.id);
            return (
              <li
                key={m.id}
                className="rounded-[4px] bg-[var(--surface-2)] px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className={m.active ? "" : "opacity-50"}>
                    {m.name} ({m.unit})
                  </span>
                  <span className="metric text-xs font-semibold">
                    {price != null
                      ? formatMoney(price, ctx.currency, locale)
                      : "sin precio"}
                  </span>
                </div>
                <form
                  action={upsertMaterialPriceAction}
                  className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2"
                >
                  <input type="hidden" name="material_id" value={m.id} />
                  <input
                    name="unit_price"
                    type="number"
                    step="0.01"
                    placeholder="Nuevo precio"
                    className="h-9 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
                  />
                  <input
                    name="valid_from"
                    type="date"
                    defaultValue={today}
                    className="h-9 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
                  />
                  <button className="h-9 rounded-[6px] border border-[var(--border)] px-2 text-xs font-semibold">
                    Guardar
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
        <form action={createMaterialAction} className="grid grid-cols-2 gap-2">
          <label className="col-span-2 block text-sm font-semibold">
            Nombre
            <input name="name" required className={input} />
          </label>
          <label className="block text-sm font-semibold">
            Unidad
            <input name="unit" defaultValue="m" className={input} />
          </label>
          <label className="block text-sm font-semibold">
            Precio unitario
            <input name="unit_price" type="number" step="0.01" className={input} />
          </label>
          <button
            type="submit"
            className="col-span-2 h-10 rounded-[6px] bg-[var(--primary)] text-sm font-semibold text-[var(--on-primary)]"
          >
            Añadir material
          </button>
        </form>
      </section>

      <section className="rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <h2 className="mb-3 text-sm font-semibold">Categorías de trabajo</h2>
        <ul className="mb-3 space-y-2">
          {(catsRes.data ?? []).map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between rounded-[4px] bg-[var(--surface-2)] px-3 py-2 text-sm"
            >
              <span className={c.active ? "" : "opacity-50"}>{c.name}</span>
              <form action={toggleJobCategoryAction.bind(null, c.id, !c.active)}>
                <button className="text-xs font-semibold text-[var(--primary)]">
                  {c.active ? "Desactivar" : "Activar"}
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={createJobCategoryAction} className="grid grid-cols-[1fr_auto] gap-2">
          <input
            name="name"
            required
            placeholder="ej: Vestido, Camisa…"
            className="h-10 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
          />
          <button className="h-10 rounded-[6px] bg-[var(--primary)] px-4 text-sm font-semibold text-[var(--on-primary)]">
            Añadir
          </button>
        </form>
      </section>
    </main>
  );
}
