"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n/i18n-provider";
import { statusLabel, t, translateError } from "@/lib/i18n";
import { transitionWorkOrderAction } from "@/modules/works/actions";

export function WorkLifecycleActions({
  workId,
  nexts,
}: {
  workId: string;
  nexts: string[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { locale } = useI18n();
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      {nexts.map((s) => (
        <Button
          key={s}
          size="lg"
          variant={s === "cancelled" ? "danger" : "primary"}
          className="w-full"
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              try {
                await transitionWorkOrderAction(workId, s);
                toast(
                  t(locale, "works.lifecycle.moved", {
                    status: statusLabel(locale, "work", s),
                  }),
                  "success",
                );
                router.refresh();
              } catch (e) {
                toast(translateError(e, locale), "error");
              }
            })
          }
        >
          {statusLabel(locale, "work", s)}
        </Button>
      ))}
    </div>
  );
}
