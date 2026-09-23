"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function publicAcceptAction(token: string) {
  if (!token) return { ok: false, error: "not_found" as const };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_accept", {
    p_token: token,
  });
  if (error) return { ok: false as const, error: error.message };
  const res = (data ?? {}) as { ok?: boolean; error?: string; status?: string };
  revalidatePath(`/orcamento/${token}`);
  return {
    ok: Boolean(res.ok),
    error: res.error,
    status: res.status,
  };
}

export async function publicRejectAction(token: string) {
  if (!token) return { ok: false, error: "not_found" as const };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_reject", {
    p_token: token,
  });
  if (error) return { ok: false as const, error: error.message };
  const res = (data ?? {}) as { ok?: boolean; error?: string; status?: string };
  revalidatePath(`/orcamento/${token}`);
  return {
    ok: Boolean(res.ok),
    error: res.error,
    status: res.status,
  };
}

export async function publicCommentAction(
  token: string,
  body: string,
  authorName?: string,
) {
  if (!token) return { ok: false, error: "not_found" as const };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("public_comment", {
    p_token: token,
    p_body: body,
    p_author: authorName ?? null,
  });
  if (error) return { ok: false as const, error: error.message };
  const res = (data ?? {}) as { ok?: boolean; error?: string };
  revalidatePath(`/orcamento/${token}`);
  return { ok: Boolean(res.ok), error: res.error };
}
