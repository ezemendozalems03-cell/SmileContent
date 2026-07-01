import type { UserRole } from "@/lib/types/database.types";

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  project_manager: "Project Manager",
  designer: "Diseñador",
  editor: "Editor",
  copywriter: "Copywriter",
  client: "Cliente",
};

/** Roles selectable for internal team members. `client` is Stage 2 (portal), not assignable from Settings > Team yet. */
export const INTERNAL_ROLES: UserRole[] = [
  "admin",
  "project_manager",
  "designer",
  "editor",
  "copywriter",
];

const CAN_MANAGE_CLIENTS: UserRole[] = ["admin", "project_manager"];
const CAN_MANAGE_TEAM: UserRole[] = ["admin"];
const CAN_DELETE_CONTENT: UserRole[] = ["admin", "project_manager"];
const CAN_MANAGE_GLOBAL_TAXONOMY: UserRole[] = ["admin"];

/**
 * UI-gating permission matrix. This is convenience/UX only — the real
 * security boundary is Postgres RLS (see supabase/migrations/0013). Every
 * Server Action re-checks role server-side regardless of what the UI shows.
 */
export function can(role: UserRole | null | undefined, permission: "manageClients" | "manageTeam" | "deleteContent" | "manageGlobalTaxonomy") {
  if (!role) return false;
  switch (permission) {
    case "manageClients":
      return CAN_MANAGE_CLIENTS.includes(role);
    case "manageTeam":
      return CAN_MANAGE_TEAM.includes(role);
    case "deleteContent":
      return CAN_DELETE_CONTENT.includes(role);
    case "manageGlobalTaxonomy":
      return CAN_MANAGE_GLOBAL_TAXONOMY.includes(role);
    default:
      return false;
  }
}
