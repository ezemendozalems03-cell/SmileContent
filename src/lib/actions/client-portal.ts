"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import type { ApprovalStatus } from "@/lib/types/database.types";

export async function inviteClientUser(clientId: string, _prevState: unknown, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!can(profile?.role, "manageClients")) {
    return { error: "No tenés permiso para invitar usuarios de cliente." };
  }

  const trimmedEmail = String(formData.get("email") ?? "").trim();
  const trimmedName = String(formData.get("full_name") ?? "").trim();
  if (!trimmedEmail || !trimmedName) {
    return { error: "Completá nombre y email." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(trimmedEmail, {
    data: { full_name: trimmedName },
  });

  if (error || !data.user) {
    return { error: `No se pudo invitar: ${error?.message ?? "error desconocido"}` };
  }

  const { error: roleError } = await admin
    .from("profiles")
    .update({ role: "client", full_name: trimmedName })
    .eq("id", data.user.id);

  if (roleError) {
    return { error: roleError.message };
  }

  const { error: memberError } = await admin
    .from("client_members")
    .insert({ client_id: clientId, profile_id: data.user.id });

  if (memberError) {
    return { error: memberError.message };
  }

  revalidatePath(`/clients/${clientId}/configuracion`);
  return { success: true };
}

export async function removeClientUser(clientId: string, profileId: string) {
  const profile = await getCurrentProfile();
  if (!can(profile?.role, "manageClients")) {
    return { error: "No tenés permiso para esta acción." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("client_members")
    .delete()
    .eq("client_id", clientId)
    .eq("profile_id", profileId);

  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}/configuracion`);
  return { success: true };
}

export async function submitApproval(
  contentItemId: string,
  decision: Extract<ApprovalStatus, "approved" | "changes_requested">,
  notes?: string,
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_client_approval", {
    p_content_item_id: contentItemId,
    p_decision: decision,
    p_notes: notes?.trim() || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/portal");
  revalidatePath(`/portal/contenido/${contentItemId}`);
  return { success: true };
}
