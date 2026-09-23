"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, inputClass } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { createPersonAction } from "@/modules/clients/actions";

export function PersonForm({ clientId }: { clientId?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, setPending] = useState(false);

  return (
    <form
      action={async (fd) => {
        if (pending) return;
        setPending(true);
        try {
          await createPersonAction(fd);
          toast("Persona añadida", "success");
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
          const msg = e instanceof Error ? e.message : "Error al guardar";
          toast(msg, "error");
        } finally {
          setPending(false);
          router.refresh();
        }
      }}
      className="space-y-3"
    >
      <input type="hidden" name="client_id" value={clientId ?? ""} />
      <Field label="Nombre de la persona *">
        <input
          name="name"
          required
          placeholder="ej: Ana"
          className={inputClass}
        />
      </Field>
      <Field label="Notas">
        <textarea
          name="notes"
          rows={2}
          className={`${inputClass} h-auto min-h-[64px] py-2`}
        />
      </Field>
      <Button type="submit" loading={pending} className="w-full">
        Añadir persona
      </Button>
    </form>
  );
}
