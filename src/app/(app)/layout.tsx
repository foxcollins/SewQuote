import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { AppShell } from "@/components/shell/app-shell";
import { ToastProvider } from "@/components/ui/toast";
import { getSessionContext } from "@/lib/session";

export const metadata: Metadata = { title: "SewQuote" };
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");

  return (
    <I18nProvider initialLocale={ctx.locale} syncDocumentLang>
      <ToastProvider>
        <AppShell tenantName={ctx.tenantName}>{children}</AppShell>
      </ToastProvider>
    </I18nProvider>
  );
}
