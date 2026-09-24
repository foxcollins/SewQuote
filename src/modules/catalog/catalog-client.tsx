"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Switch,
  inputClass,
} from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { formatMoney, type Locale } from "@/lib/i18n";
import {
  createJobCategoryAction,
  createMaterialAction,
  createServiceAction,
  toggleJobCategoryAction,
  toggleMaterialAction,
  toggleServiceAction,
  upsertMaterialPriceAction,
  type ActionResult,
} from "@/modules/catalog/actions";

type Service = {
  id: string;
  name: string;
  category: string | null;
  base_price: number | null;
  estimated_minutes: number | null;
  active: boolean;
};

type Material = {
  id: string;
  name: string;
  unit: string;
  category: string | null;
  active: boolean;
  current_price: number | null;
  price_count: number;
};

type JobCategory = {
  id: string;
  name: string;
  active: boolean;
};

type Tab = "services" | "materials" | "categories";

export function CatalogClient({
  services,
  materials,
  categories,
  currency,
  locale,
  today,
}: {
  services: Service[];
  materials: Material[];
  categories: JobCategory[];
  currency: string;
  locale: Locale;
  today: string;
}) {
  const router = useRouter();
  const money = (n: number) => formatMoney(n, currency, locale);
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("services");
  const [modal, setModal] = useState<null | "service" | "material" | "category" | "price">(null);
  const [priceMaterialId, setPriceMaterialId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toggleId, setToggleId] = useState<string | null>(null);
  const [activeOverrides, setActiveOverrides] = useState<Record<string, boolean>>({});
  const forms = {
    service: useRef<HTMLFormElement>(null),
    material: useRef<HTMLFormElement>(null),
    category: useRef<HTMLFormElement>(null),
    price: useRef<HTMLFormElement>(null),
  };

  function isActive(id: string, fallback: boolean) {
    return activeOverrides[id] ?? fallback;
  }

  useEffect(() => {
    const server = new Map<string, boolean>();
    for (const s of services) server.set(s.id, s.active);
    for (const m of materials) server.set(m.id, m.active);
    for (const c of categories) server.set(c.id, c.active);
    setActiveOverrides((prev) => {
      const next: Record<string, boolean> = {};
      let changed = false;
      for (const [id, val] of Object.entries(prev)) {
        if (server.get(id) !== val) next[id] = val;
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [services, materials, categories]);

  function refresh() {
    router.refresh();
  }

  async function submitForm(
    kind: "service" | "material" | "category" | "price",
    action: (
      prev: ActionResult | null,
      fd: FormData,
    ) => Promise<ActionResult>,
  ) {
    const form = forms[kind].current;
    if (!form || busy || toggleId) return;
    if (!form.reportValidity()) return;
    setBusy(true);
    try {
      const fd = new FormData(form);
      const res = await action(null, fd);
      toast(res.message, res.ok ? "success" : "error");
      if (res.ok) {
        form.reset();
        setModal(null);
        setPriceMaterialId(null);
        refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(
    id: string,
    next: boolean,
    action: (id: string, active: boolean) => Promise<ActionResult>,
  ) {
    if (toggleId) return;
    setToggleId(id);
    setActiveOverrides((prev) => ({ ...prev, [id]: next }));
    try {
      const res = await action(id, next);
      toast(res.message, res.ok ? "success" : "error");
      if (res.ok) refresh();
      else
        setActiveOverrides((prev) => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
    } finally {
      setToggleId(null);
    }
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "services", label: "Servicios", count: services.length },
    { id: "materials", label: "Materiales", count: materials.length },
    { id: "categories", label: "Categorías", count: categories.length },
  ];

  return (
    <main className="mx-auto max-w-lg p-4 pb-28">
      <PageHeader
        title="Catálogo"
        subtitle="Servicios, materiales y tipos de trabajo"
        action={
          <Button
            size="sm"
            onClick={() =>
              setModal(
                tab === "services"
                  ? "service"
                  : tab === "materials"
                    ? "material"
                    : "category",
              )
            }
          >
            + Nuevo
          </Button>
        }
      />

      <div
        role="tablist"
        aria-label="Secciones del catálogo"
        className="mb-5 flex gap-1 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] p-1"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-[6px] px-2 py-2.5 text-xs font-semibold transition-colors ${
              tab === t.id
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-[0_1px_2px_rgba(28,29,31,0.06)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            {t.label}
            <span className="metric ml-1 text-[10px] opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "services" && (
        <div className="space-y-2">
          {services.length === 0 && (
            <EmptyState
              title="Sin servicios"
              description="Añade confección, arreglos u otros servicios con precio base."
              action={
                <Button size="sm" onClick={() => setModal("service")}>
                  Añadir servicio
                </Button>
              }
            />
          )}
          {services.map((s) => {
            const on = isActive(s.id, s.active);
            return (
              <Card key={s.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${on ? "" : "opacity-50"}`}>
                    {s.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                    {s.base_price != null ? money(s.base_price) : "Sin precio"}
                    {s.estimated_minutes ? ` · ${s.estimated_minutes} min` : ""}
                    {s.category ? ` · ${s.category}` : ""}
                  </p>
                </div>
                <Switch
                  checked={on}
                  busy={toggleId === s.id}
                  aria-label={`${on ? "Desactivar" : "Activar"} ${s.name}`}
                  onChange={(next) => {
                    void toggleActive(s.id, next, toggleServiceAction);
                  }}
                />
              </Card>
            );
          })}
        </div>
      )}

      {tab === "materials" && (
        <div className="space-y-2">
          {materials.length === 0 && (
            <EmptyState
              title="Sin materiales"
              description="Tejidos, forros, cierres… con precio vigente e historial."
              action={
                <Button size="sm" onClick={() => setModal("material")}>
                  Añadir material
                </Button>
              }
            />
          )}
          {materials.map((m) => {
            const on = isActive(m.id, m.active);
            return (
              <Card key={m.id} className="px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${on ? "" : "opacity-50"}`}>
                      {m.name}
                      <span className="ml-1.5 text-xs font-normal text-[var(--ink-muted)]">
                        ({m.unit})
                      </span>
                    </p>
                    <p className="metric mt-0.5 text-sm font-semibold text-[var(--primary)]">
                      {m.current_price != null ? money(m.current_price) : "Sin precio"}
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      {m.price_count > 0
                        ? `${m.price_count} precio${m.price_count > 1 ? "s" : ""} en historial`
                        : "Aún sin historial"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={busy || toggleId !== null}
                      onClick={() => {
                        setPriceMaterialId(m.id);
                        setModal("price");
                      }}
                    >
                      Precio
                    </Button>
                    <Switch
                      checked={on}
                      busy={toggleId === m.id}
                      aria-label={`${on ? "Desactivar" : "Activar"} ${m.name}`}
                      onChange={(next) => {
                        void toggleActive(m.id, next, toggleMaterialAction);
                      }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "categories" && (
        <div className="space-y-2">
          {categories.length === 0 && (
            <EmptyState
              title="Sin categorías"
              description="ej: Vestido, Camisa, Ajuste… para clasificar trabajos."
              action={
                <Button size="sm" onClick={() => setModal("category")}>
                  Añadir categoría
                </Button>
              }
            />
          )}
          {categories.map((c) => {
            const on = isActive(c.id, c.active);
            return (
              <Card key={c.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${on ? "" : "opacity-50"}`}>
                    {c.name}
                  </p>
                </div>
                <Switch
                  checked={on}
                  busy={toggleId === c.id}
                  aria-label={`${on ? "Desactivar" : "Activar"} ${c.name}`}
                  onChange={(next) => {
                    void toggleActive(c.id, next, toggleJobCategoryAction);
                  }}
                />
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modal === "service"}
        onClose={() => setModal(null)}
        title="Nuevo servicio"
      >
        <form
          ref={forms.service}
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submitForm("service", createServiceAction);
          }}
        >
          <Field label="Nombre *">
            <input
              name="name"
              required
              autoComplete="off"
              placeholder="ej: Confección de vestido"
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio base">
              <input
                name="base_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className={inputClass}
              />
            </Field>
            <Field label="Minutos">
              <input
                name="estimated_minutes"
                type="number"
                min="0"
                placeholder="60"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Categoría" hint="Opcional">
            <input
              name="category"
              placeholder="ej: Confección"
              className={inputClass}
            />
          </Field>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setModal(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={busy}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={modal === "material"}
        onClose={() => setModal(null)}
        title="Nuevo material"
      >
        <form
          ref={forms.material}
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submitForm("material", createMaterialAction);
          }}
        >
          <Field label="Nombre *">
            <input
              name="name"
              required
              autoComplete="off"
              placeholder="ej: Satén de seda"
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unidad">
              <input name="unit" defaultValue="m" className={inputClass} />
            </Field>
            <Field label={`Precio (${currency})`}>
              <input
                name="unit_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label="Categoría" hint="Opcional">
            <input
              name="category"
              placeholder="ej: Tejidos"
              className={inputClass}
            />
          </Field>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setModal(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={busy}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={modal === "category"}
        onClose={() => setModal(null)}
        title="Nueva categoría"
      >
        <form
          ref={forms.category}
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submitForm("category", createJobCategoryAction);
          }}
        >
          <Field label="Nombre *">
            <input
              name="name"
              required
              autoComplete="off"
              placeholder="ej: Vestido"
              className={inputClass}
            />
          </Field>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setModal(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={busy}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={modal === "price"}
        onClose={() => {
          setModal(null);
          setPriceMaterialId(null);
        }}
        title="Actualizar precio"
      >
        <form
          ref={forms.price}
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submitForm("price", upsertMaterialPriceAction);
          }}
        >
          <input type="hidden" name="material_id" value={priceMaterialId ?? ""} />
          <p className="rounded-[6px] bg-[var(--surface-2)] px-3 py-2 text-xs text-[var(--ink-muted)]">
            Se añade al historial. El precio anterior no se borra (congelado en
            presupuestos existentes).
          </p>
          <Field label={`Nuevo precio (${currency}) *`}>
            <input
              name="unit_price"
              type="number"
              step="0.01"
              min="0"
              required
              className={inputClass}
            />
          </Field>
          <Field label="Vigente desde">
            <input
              name="valid_from"
              type="date"
              defaultValue={today}
              className={inputClass}
            />
          </Field>
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setModal(null)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={busy}>
              Guardar precio
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
