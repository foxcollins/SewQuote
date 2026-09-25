"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/i18n-provider";
import { Button } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { translateError } from "@/lib/i18n";
import { updateTenantSettingsAction } from "@/modules/tenant/actions";

export function SettingsForm({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { locale, setLocale, t } = useI18n();
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (fd) => {
        if (pending) return;
        setPending(true);
        try {
          const result = await updateTenantSettingsAction(fd);
          const nextLocale = result?.locale ?? locale;
          if (nextLocale !== locale) setLocale(nextLocale);
          toast(t("settings.saved"), "success");
          router.refresh();
        } catch (e) {
          toast(translateError(e, locale), "error");
        } finally {
          setPending(false);
        }
      }}
      className="space-y-4 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_1px_2px_rgba(28,29,31,0.04)]"
    >
      {children}
      <Button type="submit" size="lg" className="mt-2 w-full" loading={pending}>
        {t("settings.save_full")}
      </Button>
    </form>
  );
}
