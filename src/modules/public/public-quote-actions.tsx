"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
            ? "Presupuesto aprobado. ¡Gracias!"
            : "Presupuesto rechazado.",
        );
        router.refresh();
      } else if (res.error === "expired") {
        setMessage("Este presupuesto está vencido — no se puede aprobar.");
      } else {
        setMessage("No se pudo completar la acción.");
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
        setMessage("Comentario enviado.");
        setBody("");
        setShowComment(false);
        router.refresh();
      } else {
        setMessage("No se pudo enviar el comentario.");
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
              Aprobar presupuesto
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => act("reject")}
                className="h-11 rounded-[6px] border border-[var(--error)] text-sm font-semibold text-[var(--error)] uppercase disabled:opacity-60"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => setShowComment((v) => !v)}
                className="h-11 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] text-sm font-semibold uppercase"
              >
                Sugerir cambios
              </button>
            </div>
            {showComment && (
              <div className="space-y-2 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] p-3">
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Tu nombre"
                  className="h-10 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm"
                />
                <textarea
                  rows={3}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Deja una nota o sugerencia de cambios…"
                  className="w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={pending || !body.trim()}
                  onClick={submitComment}
                  className="h-10 w-full rounded-[6px] bg-[var(--primary)] text-sm font-semibold text-[var(--on-primary)] disabled:opacity-60"
                >
                  Enviar comentario
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
              ? "Presupuesto aprobado"
              : status === "rejected"
                ? "Presupuesto rechazado"
                : "Enviar comentario"}
          </button>
        )}
        {canAct && status === "sent" && showComment && null}
      </div>
    </div>
  );
}
