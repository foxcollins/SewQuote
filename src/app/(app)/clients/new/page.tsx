import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { ClientForm } from "@/modules/clients/client-form";
import { PageHeader } from "@/components/ui/primitives";

export default async function NewClientPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");

  return (
    <main className="mx-auto max-w-lg p-4 pb-28">
      <PageHeader title="Nuevo cliente" subtitle="Datos de contacto y notas" />
      <ClientForm mode="create" />
    </main>
  );
}
