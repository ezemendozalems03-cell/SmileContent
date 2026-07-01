"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth/session";
import { can } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types/database.types";

export async function signIn(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresá tu email y contraseña." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email o contraseña incorrectos." };
  }

  const profile = await getCurrentProfile();
  redirect(profile?.role === "client" ? "/portal" : "/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function inviteTeamMember(_prevState: unknown, formData: FormData) {
  const profile = await getCurrentProfile();
  if (!can(profile?.role, "manageTeam")) {
    return { error: "No tenés permiso para invitar miembros del equipo." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!email || !fullName) {
    return { error: "Completá nombre y email." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
  });

  if (error) {
    return { error: `No se pudo invitar: ${error.message}` };
  }

  revalidatePath("/settings/team");
  return { success: true };
}

export async function updateProfileRole(profileId: string, role: UserRole) {
  const profile = await getCurrentProfile();
  if (!can(profile?.role, "manageTeam")) {
    return { error: "No tenés permiso para cambiar roles." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
  if (error) return { error: error.message };

  revalidatePath("/settings/team");
  return { success: true };
}

export async function updateProfileActive(profileId: string, isActive: boolean) {
  const profile = await getCurrentProfile();
  if (!can(profile?.role, "manageTeam")) {
    return { error: "No tenés permiso para esta acción." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", profileId);
  if (error) return { error: error.message };

  revalidatePath("/settings/team");
  return { success: true };
}
