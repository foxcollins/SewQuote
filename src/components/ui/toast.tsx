"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ToastTone = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let seq = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);

  const toast = useCallback((message: string, tone: ToastTone = "success") => {
    const id = ++seq;
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4"
        aria-live="polite"
        aria-atomic="true"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto max-w-sm rounded-[6px] border px-4 py-2.5 text-sm font-semibold shadow-[0_8px_24px_rgba(28,29,31,0.12)] ${
              t.tone === "success"
                ? "border-[var(--success)] bg-[var(--success-bg)] text-[var(--success)]"
                : t.tone === "error"
                  ? "border-[var(--error)] bg-[var(--error-bg)] text-[var(--error)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

export function useToastEffect() {
  return useToast();
}

/** Reads one-shot query params for server-action feedback (e.g. ?saved=service). */
export function useQueryToasts() {
  const { toast } = useToast();
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const saved = params.get("saved");
    const error = params.get("error");
    if (saved) {
      toast(decodeURIComponent(saved), "success");
      params.delete("saved");
    }
    if (error) {
      toast(decodeURIComponent(error), "error");
      params.delete("error");
    }
    if (saved || error) {
      const qs = params.toString();
      window.history.replaceState(
        null,
        "",
        window.location.pathname + (qs ? `?${qs}` : ""),
      );
    }
  }, [toast]);
}
