"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { updateTenantSettingsAction } from "@/modules/tenant/actions";

export function SettingsForm({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (fd) => {
        if (pending) return;
        setPending(true);
        try {
          await updateTenantSettingsAction(fd);
          toast("Configuración guardada", "success");
          router.refresh();
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Error al guardar";
          toast(msg, "error");
        } finally {
          setPending(false);
        }
      }}
      className="space-y-4 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_1px_2px_rgba(28,29,31,0.04)]"
    >
      {children}
      <Button type="submit" size="lg" className="mt-2 w-full" loading={pending}>
        Guardar configuración
      </Button>
    </form>
  );
}
