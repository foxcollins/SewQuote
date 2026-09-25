"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, inputClass } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n/i18n-provider";
import { translateError } from "@/lib/i18n";
import { createPersonAction } from "@/modules/clients/actions";

export function PersonForm({ clientId }: { clientId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { locale, t } = useI18n();
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (fd) => {
        if (pending) return;
        setPending(true);
        try {
          await createPersonAction(fd);
          toast(t("clients.person.created"), "success");
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
          toast(translateError(e, locale), "error");
        } finally {
          setPending(false);
          router.refresh();
        }
      }}
      className="space-y-3"
    >
      <input type="hidden" name="client_id" value={clientId ?? ""} />
      <Field label={t("clients.person.name")}>
        <input
          name="name"
          required
          placeholder={t("clients.person.name_placeholder")}
          aria-label={t("clients.person.name")}
          className={inputClass}
        />
      </Field>
      <Field label={t("clients.person.notes")}>
        <textarea
          name="notes"
          rows={2}
          className={`${inputClass} h-auto min-h-[64px] py-2`}
        />
      </Field>
      <Button type="submit" loading={pending} className="w-full">
        {t("clients.person.add")}
      </Button>
    </form>
  );
}
