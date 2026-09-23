"use client";

import Link from "next/link";
import type { Route } from "next";
import { forwardRef } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-[var(--ink-muted)]">{subtitle}</p>
        )}
      </div>
      {action}
    </header>
  );
}

export function Card({
  children,
  className = "",
  as: As = "section",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "li";
}) {
  return (
    <As
      className={`rounded-[8px] border border-[var(--border)] bg-[var(--surface)] shadow-[0_1px_2px_rgba(28,29,31,0.04)] ${className}`}
    >
      {children}
    </As>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-muted)]">
        {children}
      </h2>
      {action}
    </div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "primary", size = "md", loading, className = "", children, disabled, ...rest },
    ref,
  ) {
    const base =
      "inline-flex items-center justify-center gap-2 rounded-[6px] font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none";
    const sizes = {
      sm: "h-9 px-3 text-xs min-w-0",
      md: "h-11 px-4 text-sm min-w-[44px]",
      lg: "h-12 px-5 text-sm min-w-[44px]",
    } as const;
    const variants = {
      primary:
        "bg-[var(--primary)] text-[var(--on-primary)] hover:bg-[var(--primary-hover)] active:scale-[0.99]",
      secondary:
        "border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)]",
      ghost: "text-[var(--primary)] hover:bg-[var(--surface-2)]",
      danger:
        "border border-[var(--error)] bg-transparent text-[var(--error)] hover:bg-[var(--error-bg)]",
    } as const;
    return (
      <button
        ref={ref}
        className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
        disabled={disabled || loading}
        {...rest}
      >
        {loading && (
          <span
            className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
        )}
        {children}
      </button>
    );
  },
);

export function PrimaryLink({
  href,
  children,
  size = "md",
  className = "",
}: {
  href: Route;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-9 px-3 text-xs",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-5 text-sm",
  } as const;
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-[6px] bg-[var(--primary)] font-semibold text-[var(--on-primary)] transition-colors hover:bg-[var(--primary-hover)] ${sizes[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-semibold tracking-wide text-[var(--ink-muted)]">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-[var(--ink-muted)]">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "h-11 w-full rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-[8px] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-10 text-center">
      <p className="font-display text-lg">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-xs text-sm text-[var(--ink-muted)]">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  labelOn = "Activo",
  labelOff = "Inactivo",
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  labelOn?: string;
  labelOff?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex h-11 min-w-[44px] items-center gap-2 text-xs font-semibold text-[var(--ink-muted)] disabled:opacity-50"
    >
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-[var(--primary)]" : "bg-[var(--border)]"
        }`}
      >
        <span
          className={`inline-block size-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5.5" : "translate-x-0.5"
          }`}
          style={{ transform: checked ? "translateX(22px)" : "translateX(2px)" }}
        />
      </span>
      <span className="hidden sm:inline">{checked ? labelOn : labelOff}</span>
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 bg-[rgba(28,29,31,0.4)] backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-[12px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0 -8px 32px_rgba(28,29,31,0.16)] sm:rounded-[12px] sm:bottom-auto">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-[6px] text-[var(--ink-muted)] hover:bg-[var(--surface-2)]"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
