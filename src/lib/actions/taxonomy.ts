"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";

async function requireGlobalTaxonomyAccess(clientId: string | null) {
  if (clientId) return null; // client-scoped writes: RLS (has_client_access) is the real gate.
  const profile = await getCurrentProfile();
  if (!can(profile?.role, "manageGlobalTaxonomy")) {
    return "Solo un Admin puede editar los valores globales.";
  }
  return null;
}

function revalidateTaxonomyPaths(clientId: string | null) {
  revalidatePath("/settings/pillars-formats");
  if (clientId) revalidatePath(`/clients/${clientId}/configuracion`);
}

// --- Pillars -----------------------------------------------------------
export async function createPillar(clientId: string | null, _prevState: unknown, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre es obligatorio." };

  const permError = await requireGlobalTaxonomyAccess(clientId);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { error } = await supabase.from("pillars").insert({ client_id: clientId, name });
  if (error) return { error: error.code === "23505" ? "Ya existe un pilar con ese nombre." : error.message };

  revalidateTaxonomyPaths(clientId);
  return { success: true };
}

export async function deletePillar(clientId: string | null, pillarId: string) {
  const supabase = await createClient();
  await supabase.from("pillars").delete().eq("id", pillarId);
  revalidateTaxonomyPaths(clientId);
}

export async function createSubpillar(
  clientId: string | null,
  pillarId: string,
  _prevState: unknown,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.from("subpillars").insert({ pillar_id: pillarId, name });
  if (error) return { error: error.message };

  revalidateTaxonomyPaths(clientId);
  return { success: true };
}

export async function deleteSubpillar(clientId: string | null, subpillarId: string) {
  const supabase = await createClient();
  await supabase.from("subpillars").delete().eq("id", subpillarId);
  revalidateTaxonomyPaths(clientId);
}

// --- Formats -------------------------------------------------------------
export async function createFormat(clientId: string | null, _prevState: unknown, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre es obligatorio." };

  const permError = await requireGlobalTaxonomyAccess(clientId);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { error } = await supabase.from("formats").insert({ client_id: clientId, name });
  if (error) return { error: error.code === "23505" ? "Ya existe un formato con ese nombre." : error.message };

  revalidateTaxonomyPaths(clientId);
  return { success: true };
}

export async function deleteFormat(clientId: string | null, formatId: string) {
  const supabase = await createClient();
  await supabase.from("formats").delete().eq("id", formatId);
  revalidateTaxonomyPaths(clientId);
}

export async function createSubFormat(
  clientId: string | null,
  formatId: string,
  _prevState: unknown,
  formData: FormData,
) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { error } = await supabase.from("sub_formats").insert({ format_id: formatId, name });
  if (error) return { error: error.message };

  revalidateTaxonomyPaths(clientId);
  return { success: true };
}

export async function deleteSubFormat(clientId: string | null, subFormatId: string) {
  const supabase = await createClient();
  await supabase.from("sub_formats").delete().eq("id", subFormatId);
  revalidateTaxonomyPaths(clientId);
}

// --- Story types -----------------------------------------------------------
export async function createStoryType(clientId: string | null, _prevState: unknown, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "El nombre es obligatorio." };

  const permError = await requireGlobalTaxonomyAccess(clientId);
  if (permError) return { error: permError };

  const supabase = await createClient();
  const { error } = await supabase.from("story_types").insert({ client_id: clientId, name });
  if (error) return { error: error.code === "23505" ? "Ya existe un tipo con ese nombre." : error.message };

  revalidateTaxonomyPaths(clientId);
  return { success: true };
}

export async function deleteStoryType(clientId: string | null, storyTypeId: string) {
  const supabase = await createClient();
  await supabase.from("story_types").delete().eq("id", storyTypeId);
  revalidateTaxonomyPaths(clientId);
}
