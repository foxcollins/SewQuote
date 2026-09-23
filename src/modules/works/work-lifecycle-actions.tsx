"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { transitionWorkOrderAction } from "@/modules/works/actions";

const LABEL: Record<string, string> = {
  waiting_garment: "Esperando prenda",
  in_production: "En producción",
  fitting: "Prueba",
  adjustments: "Ajustes",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export function WorkLifecycleActions({
  workId,
  nexts,
}: {
  workId: string;
  nexts: string[];
}) {
  const router = useRouter();
  const { toast } = useToast();
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
                toast(`Estado: ${LABEL[s] ?? s}`, "success");
                router.refresh();
              } catch (e) {
                const msg =
                  e instanceof Error ? e.message : "No se pudo actualizar";
                toast(msg, "error");
              }
            })
          }
        >
          {LABEL[s] ?? s}
        </Button>
      ))}
    </div>
  );
}
