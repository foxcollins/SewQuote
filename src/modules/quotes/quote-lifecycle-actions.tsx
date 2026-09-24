"use client";

import Link from "next/link";
import type { Route } from "next";
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
  quoteNumber,
  clientName,
  totalLabel,
  whatsapp,
  phone,
}: {
  quoteId: string;
  status: string;
  publicHref?: string | null;
  quoteNumber?: number | string;
  clientName?: string | null;
  totalLabel?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
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
        <Link
          href={`/quotes/${quoteId}/edit` as Route}
          className="flex h-12 items-center justify-center rounded-[6px] bg-[var(--primary)] text-sm font-semibold text-[var(--on-primary)] transition-colors hover:bg-[var(--primary-hover)]"
        >
          Editar presupuesto
        </Link>
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          loading={busy || pending}
          onClick={() =>
            run(() => sendQuoteAction(quoteId), "Presupuesto publicado")
          }
        >
          Publicar
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
    const rawWa = (whatsapp ?? "").trim();
    const rawPhone = (phone ?? "").trim();
    const waDigits = normalizeWaNumber(rawWa || rawPhone);
    const canShareWa = Boolean(publicHref && waDigits);
    const quoteLabel =
      quoteNumber != null
        ? `#${String(quoteNumber).padStart(3, "0")}`
        : "";
    const messageParts = [
      clientName ? `Hola ${clientName},` : "Hola,",
      quoteLabel
        ? `Te comparto el presupuesto ${quoteLabel}.`
        : "Te comparto el presupuesto.",
      totalLabel ? `Total: ${totalLabel}.` : null,
      publicHref ? absoluteUrl(publicHref) : null,
    ].filter(Boolean) as string[];
    const waHref =
      canShareWa && publicHref
        ? `https://wa.me/${waDigits}?text=${encodeURIComponent(messageParts.join("\n"))}`
        : null;

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
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center rounded-[6px] border border-[var(--success)] bg-[var(--success-bg)] text-sm font-semibold text-[var(--success)] transition-opacity hover:opacity-90"
          >
            Enviar por WhatsApp
          </a>
        ) : publicHref ? (
          <p className="text-center text-xs text-[var(--ink-muted)]">
            Añade WhatsApp del cliente para compartir por wa.me
          </p>
        ) : null}
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

function normalizeWaNumber(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return digits;
}

function absoluteUrl(href: string): string {
  if (/^https?:\/\//i.test(href)) return href;
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "");
  if (!base) return href;
  return `${base}${href.startsWith("/") ? "" : "/"}${href}`;
}
