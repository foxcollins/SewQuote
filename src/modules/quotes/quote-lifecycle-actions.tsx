"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import {
  acceptQuoteAction,
  cancelQuoteAction,
  expireQuoteAction,
  recalculateQuoteAfterExpiryAction,
  rejectQuoteAction,
  sendQuoteAction,
} from "@/modules/quotes/actions";
import { convertQuoteToWorkOrderAction } from "@/modules/works/actions";

export function QuoteLifecycleActions({
  quoteId,
  status,
  publicHref,
}: {
  quoteId: string;
  status: string;
  publicHref?: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function run(
    fn: () => Promise<void>,
    success: string,
  ) {
    if (busy || pending) return;
    setBusy(true);
    startTransition(async () => {
      try {
        await fn();
        toast(success, "success");
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "No se pudo completar";
        toast(msg, "error");
      } finally {
        setBusy(false);
      }
    });
  }

  if (status === "draft") {
    return (
      <div className="space-y-2">
        <Button
          size="lg"
          className="w-full"
          loading={busy || pending}
          onClick={() =>
            run(() => sendQuoteAction(quoteId), "Presupuesto enviado")
          }
        >
          Enviar / publicar
        </Button>
        <Button
          size="lg"
          variant="danger"
          className="w-full"
          loading={busy || pending}
          onClick={() =>
            run(() => cancelQuoteAction(quoteId), "Presupuesto cancelado")
          }
        >
          Cancelar
        </Button>
      </div>
    );
  }

  if (status === "sent") {
    return (
      <div className="space-y-2">
        <Button
          size="lg"
          className="w-full"
          loading={busy || pending}
          onClick={() =>
            run(() => acceptQuoteAction(quoteId), "Presupuesto aprobado")
          }
        >
          Aprobar (interna)
        </Button>
        <Button
          size="lg"
          variant="danger"
          className="w-full"
          loading={busy || pending}
          onClick={() =>
            run(() => rejectQuoteAction(quoteId), "Presupuesto rechazado")
          }
        >
          Rechazar
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          loading={busy || pending}
          onClick={() =>
            run(() => expireQuoteAction(quoteId), "Marcado como vencido")
          }
        >
          Marcar vencido
        </Button>
        <Button
          size="lg"
          variant="danger"
          className="w-full"
          loading={busy || pending}
          onClick={() =>
            run(() => cancelQuoteAction(quoteId), "Presupuesto cancelado")
          }
        >
          Cancelar
        </Button>
        {publicHref && (
          <a
            href={publicHref}
            className="flex h-12 items-center justify-center rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold"
          >
            Abrir página pública
          </a>
        )}
      </div>
    );
  }

  if (status === "expired") {
    return (
      <Button
        size="lg"
        className="w-full"
        loading={busy || pending}
        onClick={() =>
          run(
            () => recalculateQuoteAfterExpiryAction(quoteId),
            "Recalculado y reenviado",
          )
        }
      >
        Recalcular y reenviar
      </Button>
    );
  }

  if (status === "accepted") {
    return (
      <Button
        size="lg"
        className="w-full"
        loading={busy || pending}
        onClick={() =>
          run(
            () => convertQuoteToWorkOrderAction(quoteId),
            "Orden de trabajo creada",
          )
        }
      >
        Convertir en orden de trabajo
      </Button>
    );
  }

  return null;
}
