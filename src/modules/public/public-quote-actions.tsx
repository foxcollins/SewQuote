"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/i18n-provider";
import { t } from "@/lib/i18n";
import {
  publicAcceptAction,
  publicCommentAction,
  publicRejectAction,
} from "@/modules/public/actions";

export function PublicQuoteActions({
  token,
  canAct,
  status,
}: {
  token: string;
  canAct: boolean;
  status: string;
}) {
  const router = useRouter();
  const { locale } = useI18n();
  const [showComment, setShowComment] = useState(false);
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function act(kind: "accept" | "reject") {
    setPending(true);
    setMessage(null);
    try {
      const res =
        kind === "accept"
          ? await publicAcceptAction(token)
          : await publicRejectAction(token);
      if (res.ok) {
        setMessage(
          kind === "accept"
            ? t(locale, "public.thanks")
            : t(locale, "public.rejected"),
        );
        router.refresh();
      } else if (res.error === "expired") {
        setMessage(t(locale, "public.expired_block"));
      } else {
        setMessage(t(locale, "public.action_failed"));
      }
    } finally {
      setPending(false);
    }
  }

  async function submitComment() {
    if (!body.trim()) return;
    setPending(true);
    setMessage(null);
    try {
      const res = await publicCommentAction(token, body, author || undefined);
      if (res.ok) {
        setMessage(t(locale, "public.comment_sent"));
        setBody("");
        setShowComment(false);
        router.refresh();
      } else {
        setMessage(t(locale, "public.comment_failed"));
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--canvas)]/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0 lg:pb-0 lg:backdrop-blur-none">
      <div className="mx-auto max-w-lg space-y-2 lg:mx-0 lg:max-w-none">
        {message && (
          <p className="rounded-[6px] bg-[var(--surface-2)] px-3 py-2 text-center text-xs">
            {message}
          </p>
        )}
        {canAct ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => act("accept")}
              className="h-12 w-full rounded-[6px] bg-[var(--primary)] text-sm font-semibold tracking-wide text-[var(--on-primary)] uppercase disabled:opacity-60"
            >
              {t(locale, "public.accept_cta")}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => act("reject")}
                className="h-11 rounded-[6px] border border-[var(--error)] text-sm font-semibold text-[var(--error)] uppercase disabled:opacity-60"
              >
                {t(locale, "public.reject_cta")}
              </button>
              <button
                type="button"
                onClick={() => setShowComment((v) => !v)}
                className="h-11 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold uppercase"
              >
                {t(locale, "public.suggest_cta")}
              </button>
            </div>
            {showComment && (
              <div className="space-y-2 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-3">
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder={t(locale, "public.author_placeholder")}
                  aria-label={t(locale, "public.author_placeholder")}
                  className="h-10 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                />
                <textarea
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={t(locale, "public.comment_box_placeholder")}
                  aria-label={t(locale, "public.comment_placeholder")}
                  className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={pending || !body.trim()}
                  onClick={submitComment}
                  className="h-10 w-full rounded-[6px] bg-[var(--primary)] text-sm font-semibold text-[var(--on-primary)] disabled:opacity-60"
                >
                  {t(locale, "public.send")}
                </button>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => setShowComment((v) => !v)}
            className="h-11 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold"
          >
            {status === "accepted"
              ? t(locale, "public.accepted_cta")
              : status === "rejected"
                ? t(locale, "public.rejected_cta")
                : t(locale, "public.send_comment")}
          </button>
        )}
      </div>
    </div>
  );
}
