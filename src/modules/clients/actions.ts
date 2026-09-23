"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireSessionContext } from "@/lib/session";

export async function createClientAction(formData: FormData) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name required");

  const { error } = await supabase.from("clients").insert({
    tenant_id: ctx.tenantId,
    name,
    phone: String(formData.get("phone") ?? "").trim() || null,
    whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClientAction(clientId: string, formData: FormData) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name required");

  const { error } = await supabase
    .from("clients")
    .update({
      name,
      phone: String(formData.get("phone") ?? "").trim() || null,
      whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .eq("tenant_id", ctx.tenantId);
  if (error) throw new Error(error.message);

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

export async function archiveClientAction(clientId: string) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", clientId)
    .eq("tenant_id", ctx.tenantId);
  if (error) throw new Error(error.message);
  revalidatePath("/clients");
  redirect("/clients");
}

export async function createPersonAction(formData: FormData) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Name required");
  const clientId = String(formData.get("client_id") ?? "").trim() || null;

  const { data, error } = await supabase
    .from("persons")
    .insert({
      tenant_id: ctx.tenantId,
      client_id: clientId,
      name,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/clients");
  if (clientId) redirect((`/clients/${clientId}`) as never);
  redirect((`/persons/${data.id}`) as never);
}

export async function createMeasurementSetAction(formData: FormData) {
  const ctx = await requireSessionContext();
  const supabase = await createClient();

  const personId = String(formData.get("person_id") ?? "").trim();
  if (!personId) throw new Error("Person required");

  const label = String(formData.get("label") ?? "").trim() || null;
  const recordedAt = String(formData.get("recorded_at") ?? "") ||
    new Date().toISOString().slice(0, 10);
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const names = formData.getAll("m_name").map(String);
  const values = formData.getAll("m_value").map(String);
  const units = formData.getAll("m_unit").map(String);

  const { data: set, error } = await supabase
    .from("measurement_sets")
    .insert({
      tenant_id: ctx.tenantId,
      person_id: personId,
      label,
      recorded_at: recordedAt,
      notes,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const valueRows = names
    .map((n, i) => ({
      measurement_set_id: set.id,
      name: n.trim(),
      value: Number(values[i]),
      unit: (units[i] || "cm").trim() || "cm",
    }))
    .filter((r) => r.name && Number.isFinite(r.value));

  if (valueRows.length) {
    const { error: vErr } = await supabase
      .from("measurement_values")
      .insert(valueRows);
    if (vErr) throw new Error(vErr.message);
  }

  revalidatePath(`/persons/${personId}`);
  redirect((`/persons/${personId}`) as never);
}
