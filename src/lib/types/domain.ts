import type { Database } from "./database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientMember = Database["public"]["Tables"]["client_members"]["Row"];
export type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];
export type Pillar = Database["public"]["Tables"]["pillars"]["Row"];
export type Subpillar = Database["public"]["Tables"]["subpillars"]["Row"];
export type Format = Database["public"]["Tables"]["formats"]["Row"];
export type SubFormat = Database["public"]["Tables"]["sub_formats"]["Row"];
export type StoryType = Database["public"]["Tables"]["story_types"]["Row"];
export type ContentItem = Database["public"]["Tables"]["content_items"]["Row"];
export type ContentItemPortal = Database["public"]["Functions"]["get_portal_content_items"]["Returns"][number];
export type Story = Database["public"]["Tables"]["stories"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type FileRow = Database["public"]["Tables"]["files"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Idea = Database["public"]["Tables"]["ideas"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];

/** content_items joined with the human-readable labels the UI actually renders. */
export type ContentItemWithRelations = ContentItem & {
  client?: Pick<Client, "id" | "name" | "logo_url"> | null;
  formato?: Pick<Format, "id" | "name"> | null;
  sub_formato?: Pick<SubFormat, "id" | "name"> | null;
  pilar?: Pick<Pillar, "id" | "name"> | null;
  subpilar?: Pick<Subpillar, "id" | "name"> | null;
  assignee?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
  campaign?: Pick<Campaign, "id" | "name"> | null;
};

export type ContentItemPortalWithRelations = ContentItemPortal & {
  client?: Pick<Client, "id" | "name" | "logo_url"> | null;
  formato?: Pick<Format, "id" | "name"> | null;
  sub_formato?: Pick<SubFormat, "id" | "name"> | null;
  pilar?: Pick<Pillar, "id" | "name"> | null;
  subpilar?: Pick<Subpillar, "id" | "name"> | null;
};

export type StoryWithRelations = Story & {
  story_type?: Pick<StoryType, "id" | "name"> | null;
  assignee?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
  client?: Pick<Client, "id" | "name"> | null;
};

export type CommentWithAuthor = Comment & {
  author?: Pick<Profile, "id" | "full_name" | "avatar_url" | "role"> | null;
};

export interface DashboardStats {
  clientes_activos: number;
  contenidos_mes: number;
  pendientes_posts: number;
  pendientes_historias: number;
  pendientes_reels: number;
  en_diseno: number;
  en_edicion: number;
  esperando_aprobacion: number;
  aprobados: number;
  publicados: number;
  correcciones_pendientes: number;
  piezas_semana: number;
  avance_mensual_pct: number;
}
