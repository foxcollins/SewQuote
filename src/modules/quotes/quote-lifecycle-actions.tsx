"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useI18n } from "@/components/i18n/i18n-provider";
import { t, translateError } from "@/lib/i18n";
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
  workOrderId,
}: {
  quoteId: string;
  status: string;
  publicHref?: string | null;
  quoteNumber?: number | string;
  clientName?: string | null;
  totalLabel?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  workOrderId?: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { locale } = useI18n();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  function run(
    fn: () => Promise<void>,
    successKey: string,
  ) {
    if (busy || pending) return;
    setBusy(true);
    startTransition(async () => {
      try {
        await fn();
        toast(t(locale, successKey), "success");
        router.refresh();
      } catch (e) {
        toast(translateError(e, locale), "error");
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
          {t(locale, "quotes.lifecycle.edit_quote")}
        </Link>
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          loading={busy || pending}
          onClick={() =>
            run(() => sendQuoteAction(quoteId), "quotes.lifecycle.send")
          }
        >
          {t(locale, "quotes.lifecycle.publish")}
        </Button>
        <Button
          size="lg"
          variant="danger"
          className="w-full"
          loading={busy || pending}
          onClick={() =>
            run(() => cancelQuoteAction(quoteId), "quotes.lifecycle.cancelled")
          }
        >
          {t(locale, "common.cancel")}
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
      clientName
        ? t(locale, "quotes.lifecycle.whatsapp_hello", { name: clientName })
        : t(locale, "quotes.lifecycle.whatsapp_hello"),
      quoteLabel
        ? t(locale, "quotes.lifecycle.whatsapp_share", { quote: quoteLabel })
        : t(locale, "quotes.lifecycle.whatsapp_share_short"),
      totalLabel ? t(locale, "quotes.lifecycle.whatsapp_total", { total: totalLabel }) : null,
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
            run(() => acceptQuoteAction(quoteId), "quotes.lifecycle.accepted")
          }
        >
          {t(locale, "quotes.lifecycle.accept_internal")}
        </Button>
        <Button
          size="lg"
          variant="danger"
          className="w-full"
          loading={busy || pending}
          onClick={() =>
            run(() => rejectQuoteAction(quoteId), "quotes.lifecycle.rejected")
          }
        >
          {t(locale, "quotes.lifecycle.reject")}
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="w-full"
          loading={busy || pending}
          onClick={() =>
            run(() => expireQuoteAction(quoteId), "quotes.lifecycle.marked_expired")
          }
        >
          {t(locale, "quotes.lifecycle.mark_expired")}
        </Button>
        <Button
          size="lg"
          variant="danger"
          className="w-full"
          loading={busy || pending}
          onClick={() =>
            run(() => cancelQuoteAction(quoteId), "quotes.lifecycle.cancelled")
          }
        >
          {t(locale, "common.cancel")}
        </Button>
        {waHref ? (
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center rounded-[6px] border border-[var(--success)] bg-[var(--success-bg)] text-sm font-semibold text-[var(--success)] transition-opacity hover:opacity-90"
          >
            {t(locale, "quotes.lifecycle.send_whatsapp")}
          </a>
        ) : publicHref ? (
          <p className="text-center text-xs text-[var(--ink-muted)]">
            {t(locale, "quotes.lifecycle.whatsapp_needs_number")}
          </p>
        ) : null}
        {publicHref && (
          <a
            href={publicHref}
            className="flex h-12 items-center justify-center rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold"
          >
            {t(locale, "quotes.lifecycle.open_public")}
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
            "quotes.lifecycle.recalculated",
          )
        }
      >
        {t(locale, "quotes.lifecycle.recalculate_resend")}
      </Button>
    );
  }

  if (status === "accepted") {
    if (workOrderId) {
      return (
        <Link
          href={`/works/${workOrderId}` as Route}
          className="flex h-12 items-center justify-center rounded-[6px] bg-[var(--primary)] text-center text-sm font-semibold text-[var(--on-primary)] transition-colors hover:bg-[var(--primary-hover)]"
        >
          {t(locale, "quotes.lifecycle.view_work")}
        </Link>
      );
    }
    return (
      <Button
        size="lg"
        className="w-full"
        loading={busy || pending}
        onClick={() =>
          run(
            () => convertQuoteToWorkOrderAction(quoteId),
            "quotes.lifecycle.work_created",
          )
        }
      >
        {t(locale, "quotes.lifecycle.convert_work")}
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
