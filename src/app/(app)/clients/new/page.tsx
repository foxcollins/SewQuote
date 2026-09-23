import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/session";
import { ClientForm } from "@/modules/clients/client-form";

export default async function NewClientPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/");

  return (
    <main className="mx-auto max-w-lg p-4 pb-24">
      <h1 className="mb-4 text-2xl font-semibold">Nuevo cliente</h1>
      <ClientForm mode="create" />
    </main>
  );
}
