"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/i18n-provider";
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
import {
  createJobCategoryAction,
  createMaterialAction,
  createServiceAction,
  deleteServiceAction,
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
  today,
}: {
  services: Service[];
  materials: Material[];
  categories: JobCategory[];
  currency: string;
  today: string;
}) {
  const router = useRouter();
  const { t, formatMoney } = useI18n();
  const money = (n: number) => formatMoney(n, currency);
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("services");
  const [modal, setModal] = useState<null | "service" | "material" | "category" | "price">(null);
  const [priceMaterialId, setPriceMaterialId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [toggleId, setToggleId] = useState<string | null>(null);
  const [activeOverrides, setActiveOverrides] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleting, setDeleting] = useState(false);
  const forms = {
    service: useRef<HTMLFormElement>(null),
    material: useRef<HTMLFormElement>(null),
    category: useRef<HTMLFormElement>(null),
    price: useRef<HTMLFormElement>(null),
  };

  function isActive(id: string, fallback: boolean) {
    return activeOverrides[id] ?? fallback;
  }

  function showResult(res: ActionResult) {
    toast(t(res.code, res.vars), res.ok ? "success" : "error");
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
      showResult(res);
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
      showResult(res);
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

  async function confirmDeleteService() {
    if (!deleteTarget || deleting || busy || toggleId) return;
    setDeleting(true);
    try {
      const res = await deleteServiceAction(deleteTarget.id);
      showResult(res);
      if (res.ok) {
        setDeleteTarget(null);
        refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "services", label: t("catalog.services"), count: services.length },
    { id: "materials", label: t("catalog.materials"), count: materials.length },
    { id: "categories", label: t("catalog.categories"), count: categories.length },
  ];

  return (
    <main className="pb-8">
      <PageHeader
        title={t("catalog.title")}
        subtitle={t("catalog.subtitle")}
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
            + {t("common.new")}
          </Button>
        }
      />

      <div
        role="tablist"
        aria-label={t("catalog.tabs_aria")}
        className="mb-5 flex gap-1 rounded-[8px] border border-[var(--border)] bg-[var(--surface-2)] p-1"
      >
        {tabs.map((tabItem) => (
          <button
            key={tabItem.id}
            role="tab"
            aria-selected={tab === tabItem.id}
            type="button"
            onClick={() => setTab(tabItem.id)}
            className={`flex-1 rounded-[6px] px-2 py-2.5 text-xs font-semibold transition-colors ${
              tab === tabItem.id
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-[0_1px_2px_rgba(28,29,31,0.06)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
          >
            {tabItem.label}
            <span className="metric ml-1 text-[10px] opacity-70">{tabItem.count}</span>
          </button>
        ))}
      </div>

      {tab === "services" && (
        <div className="space-y-2">
          {services.length === 0 && (
            <EmptyState
              title={t("catalog.no_services")}
              description={t("catalog.no_services_hint")}
              action={
                <Button size="sm" onClick={() => setModal("service")}>
                  {t("catalog.add_service")}
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
                    {s.base_price != null ? money(s.base_price) : t("catalog.no_price")}
                    {s.estimated_minutes
                      ? ` · ${s.estimated_minutes} ${t("common.minutes_short")}`
                      : ""}
                    {s.category ? ` · ${s.category}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t("catalog.delete_item", { name: s.name })}
                    disabled={busy || toggleId !== null || deleting}
                    onClick={() => setDeleteTarget(s)}
                  >
                    {t("common.delete")}
                  </Button>
                  <Switch
                    checked={on}
                    busy={toggleId === s.id}
                    aria-label={t(on ? "catalog.deactivate_item" : "catalog.activate_item", {
                      name: s.name,
                    })}
                    onChange={(next) => {
                      void toggleActive(s.id, next, toggleServiceAction);
                    }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {tab === "materials" && (
        <div className="space-y-2">
          {materials.length === 0 && (
            <EmptyState
              title={t("catalog.no_materials")}
              description={t("catalog.no_materials_hint")}
              action={
                <Button size="sm" onClick={() => setModal("material")}>
                  {t("catalog.add_material")}
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
                      {m.current_price != null
                        ? money(m.current_price)
                        : t("catalog.no_price")}
                    </p>
                    <p className="text-[11px] text-[var(--ink-muted)]">
                      {m.price_count > 0
                        ? t(
                            m.price_count > 1
                              ? "catalog.price_history"
                              : "catalog.price_history_one",
                            { count: m.price_count },
                          )
                        : t("catalog.no_price_history")}
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
                      {t("catalog.price")}
                    </Button>
                    <Switch
                      checked={on}
                      busy={toggleId === m.id}
                      aria-label={t(on ? "catalog.deactivate_item" : "catalog.activate_item", {
                        name: m.name,
                      })}
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
              title={t("catalog.no_categories")}
              description={t("catalog.no_categories_hint")}
              action={
                <Button size="sm" onClick={() => setModal("category")}>
                  {t("catalog.add_category")}
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
                  aria-label={t(on ? "catalog.deactivate_item" : "catalog.activate_item", {
                    name: c.name,
                  })}
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
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title={t("catalog.delete_service_title")}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--ink-muted)]">
            {t("catalog.delete_service_body", { name: deleteTarget?.name ?? "" })}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant="danger"
              className="flex-1"
              loading={deleting}
              onClick={() => {
                void confirmDeleteService();
              }}
            >
              {t("common.delete")}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal === "service"}
        onClose={() => setModal(null)}
        title={t("catalog.new_service")}
      >
        <form
          ref={forms.service}
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submitForm("service", createServiceAction);
          }}
        >
          <Field label={`${t("common.name")} *`}>
            <input
              name="name"
              required
              autoComplete="off"
              placeholder={t("catalog.name_placeholder_service")}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("catalog.base_price")}>
              <input
                name="base_price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className={inputClass}
              />
            </Field>
            <Field label={t("catalog.minutes")}>
              <input
                name="estimated_minutes"
                type="number"
                min="0"
                placeholder="60"
                className={inputClass}
              />
            </Field>
          </div>
          <Field label={t("catalog.category_optional")} hint={t("common.optional")}>
            <input
              name="category"
              placeholder={t("catalog.category_placeholder_service")}
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
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" loading={busy}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={modal === "material"}
        onClose={() => setModal(null)}
        title={t("catalog.new_material")}
      >
        <form
          ref={forms.material}
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submitForm("material", createMaterialAction);
          }}
        >
          <Field label={`${t("common.name")} *`}>
            <input
              name="name"
              required
              autoComplete="off"
              placeholder={t("catalog.name_placeholder_material")}
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("catalog.unit")}>
              <input name="unit" defaultValue="m" className={inputClass} />
            </Field>
            <Field label={t("catalog.price_currency", { currency })}>
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
          <Field label={t("catalog.category_optional")} hint={t("common.optional")}>
            <input
              name="category"
              placeholder={t("catalog.category_placeholder_material")}
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
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" loading={busy}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={modal === "category"}
        onClose={() => setModal(null)}
        title={t("catalog.new_category")}
      >
        <form
          ref={forms.category}
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void submitForm("category", createJobCategoryAction);
          }}
        >
          <Field label={`${t("common.name")} *`}>
            <input
              name="name"
              required
              autoComplete="off"
              placeholder={t("catalog.name_placeholder_category")}
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
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" loading={busy}>
              {t("common.save")}
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
        title={t("catalog.new_price_title")}
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
            {t("catalog.price_history_note")}
          </p>
          <Field label={t("catalog.new_price_currency", { currency })}>
            <input
              name="unit_price"
              type="number"
              step="0.01"
              min="0"
              required
              className={inputClass}
            />
          </Field>
          <Field label={t("catalog.valid_from")}>
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
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" loading={busy}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  );
}
