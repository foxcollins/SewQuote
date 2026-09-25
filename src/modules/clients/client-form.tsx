"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, inputClass } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n/i18n-provider";
import { translateError } from "@/lib/i18n";
import {
  createClientAction,
  updateClientAction,
} from "@/modules/clients/actions";

export function ClientForm({
  mode,
  clientId,
  initial,
}: {
  mode: "create" | "edit";
  clientId?: string;
  initial?: {
    name: string;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
  };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { locale, t } = useI18n();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-3"
      action={async (formData) => {
        if (pending) return;
        setPending(true);
        setError(null);
        try {
          if (mode === "create") {
            await createClientAction(formData);
            toast(t("clients.created"), "success");
          } else if (clientId) {
            await updateClientAction(clientId, formData);
            toast(t("clients.saved"), "success");
            router.refresh();
          }
        } catch (e) {
          if (
            e &&
            typeof e === "object" &&
            "digest" in e &&
            typeof e.digest === "string" &&
            e.digest.includes("NEXT_REDIRECT")
          ) {
            return;
          }
          const msg = translateError(e, locale);
          setError(msg);
          toast(msg, "error");
        } finally {
          setPending(false);
        }
      }}
    >
      {error && (
        <p className="rounded-[6px] bg-[var(--error-bg)] px-3 py-2 text-xs text-[var(--error)]">
          {error}
        </p>
      )}
      <Field label={t("clients.name")}>
        <input
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label={t("clients.phone")}>
          <input
            name="phone"
            type="tel"
            defaultValue={initial?.phone ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="WhatsApp">
          <input
            name="whatsapp"
            type="tel"
            defaultValue={initial?.whatsapp ?? ""}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label={t("clients.email")}>
        <input
          name="email"
          type="email"
          defaultValue={initial?.email ?? ""}
          className={inputClass}
        />
      </Field>
      <Field label={t("clients.address")}>
        <input
          name="address"
          defaultValue={initial?.address ?? ""}
          className={inputClass}
        />
      </Field>
      <Field label={t("clients.form.notes")}>
        <textarea
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ""}
          className={`${inputClass} h-auto min-h-[88px] py-2`}
        />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {mode === "create" ? t("clients.create") : t("clients.save")}
      </Button>
    </form>
  );
}
