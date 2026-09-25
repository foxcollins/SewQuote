import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { ClientForm } from "@/modules/clients/client-form";
import { PageHeader } from "@/components/ui/primitives";
import { t } from "@/lib/i18n";

export default async function NewClientPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");

  return (
    <main className="mx-auto max-w-xl pb-8">
      <PageHeader
        title={t(ctx.locale, "clients.new")}
        subtitle={t(ctx.locale, "clients.subtitle")}
      />
      <ClientForm mode="create" />
    </main>
  );
}
