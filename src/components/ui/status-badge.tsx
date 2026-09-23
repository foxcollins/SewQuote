export function StatusBadge({
  status,
  label,
  tone,
}: {
  status: string;
  label: string;
  tone?: "draft" | "sent" | "accepted" | "rejected" | "expired" | "cancelled" | "warning";
}) {
  const t = tone ?? status;
  const styles: Record<string, string> = {
    draft: "bg-[var(--draft-bg)] text-[var(--draft)] border-[var(--border)]",
    sent: "bg-[var(--surface-2)] text-[var(--ink)] border-[var(--border)]",
    accepted: "bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]",
    ready: "bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]",
    delivered: "bg-[var(--success-bg)] text-[var(--success)] border-[var(--success)]",
    rejected: "bg-[var(--error-bg)] text-[var(--error)] border-[var(--error)]",
    cancelled: "bg-[var(--error-bg)] text-[var(--error)] border-[var(--error)]",
    expired: "bg-[var(--error-bg)] text-[var(--error)] border-[var(--error)]",
    warning: "bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning)]",
    in_production:
      "bg-[var(--warning-bg)] text-[var(--warning)] border-[var(--warning)]",
  };

  return (
    <span
      data-status={status}
      className={`inline-flex h-6 items-center rounded-[4px] border px-2 text-[11px] font-semibold uppercase tracking-wide ${
        styles[t] ?? styles.sent
      }`}
    >
      {label}
    </span>
  );
}
