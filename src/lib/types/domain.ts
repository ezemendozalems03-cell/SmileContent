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
export type ContentObjective = Database["public"]["Tables"]["content_objectives"]["Row"];
export type ContentItem = Database["public"]["Tables"]["content_items"]["Row"];
export type ContentItemPortal = Database["public"]["Functions"]["get_portal_content_items"]["Returns"][number];
export type Story = Database["public"]["Tables"]["stories"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type FileRow = Database["public"]["Tables"]["files"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type Idea = Database["public"]["Tables"]["ideas"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type BrandAsset = Database["public"]["Tables"]["brand_assets"]["Row"];
export type StoryPortal = Database["public"]["Functions"]["get_portal_stories"]["Returns"][number];
export type ContentGoal = Database["public"]["Tables"]["content_goals"]["Row"];
export type MonthlyGoalProgress = Database["public"]["Functions"]["monthly_goals_progress"]["Returns"][number];
export type BrandMemory = Database["public"]["Tables"]["brand_memory"]["Row"];
export type BrandVoice = Database["public"]["Tables"]["brand_voice"]["Row"];
export type BrandVisualIdentity = Database["public"]["Tables"]["brand_visual_identity"]["Row"];
export type BrandProduct = Database["public"]["Tables"]["brand_products"]["Row"];
export type BrandLearning = Database["public"]["Tables"]["brand_learning"]["Row"];
export type BrandExample = Database["public"]["Tables"]["brand_examples"]["Row"];
export type AiGeneration = Database["public"]["Tables"]["ai_generations"]["Row"];
export type StrategySettings = Database["public"]["Tables"]["strategy_settings"]["Row"];
export type StrategyRule = Database["public"]["Tables"]["strategy_rules"]["Row"];
export type ClientObjective = Database["public"]["Tables"]["client_objectives"]["Row"];
export type StrategyReport = Database["public"]["Tables"]["strategy_reports"]["Row"];
export type ContentRecommendation = Database["public"]["Tables"]["content_recommendations"]["Row"];
export type MonthlyPlan = Database["public"]["Tables"]["monthly_plans"]["Row"];
export type CalendarTemplate = Database["public"]["Tables"]["calendar_templates"]["Row"];
export type CampaignContent = Database["public"]["Tables"]["campaign_contents"]["Row"];
export type SocialAccount = Database["public"]["Tables"]["social_accounts"]["Row"];
export type ScheduledPost = Database["public"]["Tables"]["scheduled_posts"]["Row"];

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

export type IdeaWithRelations = Idea & {
  pilar?: Pick<Pillar, "id" | "name"> | null;
  subpilar?: Pick<Subpillar, "id" | "name"> | null;
  formato?: Pick<Format, "id" | "name"> | null;
  sub_formato?: Pick<SubFormat, "id" | "name"> | null;
  client?: Pick<Client, "id" | "name"> | null;
  creator?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
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
