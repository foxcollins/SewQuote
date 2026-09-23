import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
    <ToastProvider>
      <AppShell tenantName={ctx.tenantName}>{children}</AppShell>
    </ToastProvider>
  );
}
