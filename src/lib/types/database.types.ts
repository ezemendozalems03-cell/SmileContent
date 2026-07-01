/**
 * Hand-authored to match supabase/migrations/0001-0016 exactly, in the same
 * shape `supabase gen types typescript` produces. Once a real Supabase
 * project is linked, regenerate with `scripts/gen-types.ps1` and this file
 * becomes a mechanical, low-risk swap.
 */

export type UserRole =
  | "admin"
  | "project_manager"
  | "designer"
  | "editor"
  | "copywriter"
  | "client";

export type ContentStatus =
  | "idea"
  | "investigacion"
  | "guion"
  | "diseno"
  | "grabacion"
  | "edicion"
  | "revision_interna"
  | "enviado_al_cliente"
  | "correcciones"
  | "aprobado"
  | "programado"
  | "publicado"
  | "medido"
  | "archivado";

export type ContentPriority = "baja" | "media" | "alta" | "urgente";
export type ContentKind = "post" | "story" | "reel" | "tiktok";
export type ClientStatus = "activo" | "pausado" | "finalizado" | "prospecto";
export type FileKind = "miniatura" | "archivo_editable" | "archivo_final" | "otro";
export type CommentAuthorType = "internal" | "client";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "changes_requested";
export type NotificationType =
  | "assigned"
  | "status_changed"
  | "comment_added"
  | "due_soon"
  | "overdue"
  | "approval_requested"
  | "approval_resolved";
export type StoryStatus = "idea" | "diseno" | "lista" | "programada" | "publicada" | "archivada";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          avatar_url: string | null;
          role: UserRole;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          avatar_url?: string | null;
          role?: UserRole;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          rubro: string | null;
          status: ClientStatus;
          plan_contratado: string | null;
          fecha_inicio: string | null;
          primary_owner_id: string | null;
          instagram_url: string | null;
          tiktok_url: string | null;
          brand_manual_url: string | null;
          brand_colors: string[];
          brand_typography: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          rubro?: string | null;
          status?: ClientStatus;
          plan_contratado?: string | null;
          fecha_inicio?: string | null;
          primary_owner_id?: string | null;
          instagram_url?: string | null;
          tiktok_url?: string | null;
          brand_manual_url?: string | null;
          brand_colors?: string[];
          brand_typography?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Insert"]>;
        Relationships: [];
      };
      client_members: {
        Row: { client_id: string; profile_id: string; created_at: string };
        Insert: { client_id: string; profile_id: string };
        Update: Partial<Database["public"]["Tables"]["client_members"]["Insert"]>;
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          description: string | null;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          description?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
        Relationships: [];
      };
      pillars: {
        Row: {
          id: string;
          client_id: string | null;
          name: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          name: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["pillars"]["Insert"]>;
        Relationships: [];
      };
      subpillars: {
        Row: {
          id: string;
          pillar_id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          pillar_id: string;
          name: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["subpillars"]["Insert"]>;
        Relationships: [];
      };
      formats: {
        Row: {
          id: string;
          client_id: string | null;
          name: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          name: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["formats"]["Insert"]>;
        Relationships: [];
      };
      sub_formats: {
        Row: {
          id: string;
          format_id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          format_id: string;
          name: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["sub_formats"]["Insert"]>;
        Relationships: [];
      };
      story_types: {
        Row: {
          id: string;
          client_id: string | null;
          name: string;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          name: string;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["story_types"]["Insert"]>;
        Relationships: [];
      };
      content_items: {
        Row: {
          id: string;
          client_id: string;
          campaign_id: string | null;
          titulo: string;
          descripcion: string | null;
          formato_id: string | null;
          sub_formato_id: string | null;
          pilar_id: string | null;
          subpilar_id: string | null;
          tipo_contenido: ContentKind;
          objetivo: string | null;
          status: ContentStatus;
          priority: ContentPriority;
          assignee_id: string | null;
          created_by: string | null;
          fecha_publicacion: string | null;
          hora_sugerida: string | null;
          hook: string | null;
          guion: string | null;
          copy: string | null;
          cta: string | null;
          hashtags: string[];
          link_drive: string | null;
          link_canva: string | null;
          link_capcut: string | null;
          link_publicacion_final: string | null;
          vistas: number;
          likes: number;
          comentarios_count: number;
          compartidos: number;
          guardados: number;
          consultas_generadas: number;
          observaciones_internas: string | null;
          feedback_cliente: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          campaign_id?: string | null;
          titulo: string;
          descripcion?: string | null;
          formato_id?: string | null;
          sub_formato_id?: string | null;
          pilar_id?: string | null;
          subpilar_id?: string | null;
          tipo_contenido?: ContentKind;
          objetivo?: string | null;
          status?: ContentStatus;
          priority?: ContentPriority;
          assignee_id?: string | null;
          created_by?: string | null;
          fecha_publicacion?: string | null;
          hora_sugerida?: string | null;
          hook?: string | null;
          guion?: string | null;
          copy?: string | null;
          cta?: string | null;
          hashtags?: string[];
          link_drive?: string | null;
          link_canva?: string | null;
          link_capcut?: string | null;
          link_publicacion_final?: string | null;
          vistas?: number;
          likes?: number;
          comentarios_count?: number;
          compartidos?: number;
          guardados?: number;
          consultas_generadas?: number;
          observaciones_internas?: string | null;
          feedback_cliente?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["content_items"]["Insert"]>;
        Relationships: [];
      };
      stories: {
        Row: {
          id: string;
          client_id: string;
          nombre: string;
          fecha: string;
          hora: string | null;
          story_type_id: string | null;
          objetivo: string | null;
          status: StoryStatus;
          assignee_id: string | null;
          texto: string | null;
          sticker: string | null;
          link: string | null;
          cta: string | null;
          observacion: string | null;
          respuesta_esperada: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          nombre: string;
          fecha: string;
          hora?: string | null;
          story_type_id?: string | null;
          objetivo?: string | null;
          status?: StoryStatus;
          assignee_id?: string | null;
          texto?: string | null;
          sticker?: string | null;
          link?: string | null;
          cta?: string | null;
          observacion?: string | null;
          respuesta_esperada?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["stories"]["Insert"]>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          content_item_id: string | null;
          story_id: string | null;
          parent_comment_id: string | null;
          author_id: string;
          author_type: CommentAuthorType;
          is_client_visible: boolean;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content_item_id?: string | null;
          story_id?: string | null;
          parent_comment_id?: string | null;
          author_id: string;
          author_type?: CommentAuthorType;
          is_client_visible?: boolean;
          body: string;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
        Relationships: [];
      };
      files: {
        Row: {
          id: string;
          client_id: string;
          content_item_id: string | null;
          story_id: string | null;
          kind: FileKind;
          file_name: string;
          storage_path: string;
          mime_type: string | null;
          size_bytes: number | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          content_item_id?: string | null;
          story_id?: string | null;
          kind?: FileKind;
          file_name: string;
          storage_path: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          uploaded_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["files"]["Insert"]>;
        Relationships: [];
      };
      content_versions: {
        Row: {
          id: string;
          content_item_id: string;
          version_number: number;
          snapshot: Record<string, unknown>;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_item_id: string;
          version_number: number;
          snapshot: Record<string, unknown>;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["content_versions"]["Insert"]>;
        Relationships: [];
      };
      approvals: {
        Row: {
          id: string;
          content_item_id: string | null;
          story_id: string | null;
          version_id: string | null;
          status: ApprovalStatus;
          requested_by: string | null;
          requested_at: string;
          resolved_by: string | null;
          resolved_at: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          content_item_id?: string | null;
          story_id?: string | null;
          version_id?: string | null;
          status?: ApprovalStatus;
          requested_by?: string | null;
          resolved_by?: string | null;
          resolved_at?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["approvals"]["Insert"]>;
        Relationships: [];
      };
      content_metrics: {
        Row: {
          id: string;
          content_item_id: string;
          captured_at: string;
          vistas: number | null;
          likes: number | null;
          comentarios: number | null;
          compartidos: number | null;
          guardados: number | null;
          source: string;
        };
        Insert: {
          id?: string;
          content_item_id: string;
          captured_at?: string;
          vistas?: number | null;
          likes?: number | null;
          comentarios?: number | null;
          compartidos?: number | null;
          guardados?: number | null;
          source?: string;
        };
        Update: Partial<Database["public"]["Tables"]["content_metrics"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          type: NotificationType;
          content_item_id: string | null;
          story_id: string | null;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipient_id: string;
          type: NotificationType;
          content_item_id?: string | null;
          story_id?: string | null;
          message: string;
          is_read?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      ideas: {
        Row: {
          id: string;
          client_id: string | null;
          title: string;
          description: string | null;
          pilar_id: string | null;
          created_by: string | null;
          promoted_content_item_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          title: string;
          description?: string | null;
          pilar_id?: string | null;
          created_by?: string | null;
          promoted_content_item_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["ideas"]["Insert"]>;
        Relationships: [];
      };
      tasks: {
        Row: {
          id: string;
          content_item_id: string | null;
          story_id: string | null;
          title: string;
          is_done: boolean;
          assignee_id: string | null;
          due_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_item_id?: string | null;
          story_id?: string | null;
          title: string;
          is_done?: boolean;
          assignee_id?: string | null;
          due_date?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [];
      };
      content_days: {
        Row: {
          id: string;
          client_id: string;
          date: string;
          location: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          date: string;
          location?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["content_days"]["Insert"]>;
        Relationships: [];
      };
      content_day_shots: {
        Row: {
          id: string;
          content_day_id: string;
          content_item_id: string | null;
          shot_description: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          content_day_id: string;
          content_item_id?: string | null;
          shot_description?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["content_day_shots"]["Insert"]>;
        Relationships: [];
      };
      brand_assets: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          storage_path: string;
          asset_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          storage_path: string;
          asset_type?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["brand_assets"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      dashboard_stats: {
        Args: { p_client_id?: string | null };
        Returns: Record<string, unknown>;
      };
      global_search: {
        Args: { q: string };
        Returns: {
          kind: string;
          id: string;
          client_id: string | null;
          title: string;
          subtitle: string | null;
        }[];
      };
      submit_client_approval: {
        Args: {
          p_content_item_id: string;
          p_decision: ApprovalStatus;
          p_notes?: string | null;
        };
        Returns: void;
      };
      get_portal_content_items: {
        Args: { p_content_item_id?: string | null };
        Returns: {
          id: string;
          client_id: string;
          campaign_id: string | null;
          titulo: string;
          descripcion: string | null;
          formato_id: string | null;
          sub_formato_id: string | null;
          pilar_id: string | null;
          subpilar_id: string | null;
          tipo_contenido: ContentKind;
          objetivo: string | null;
          status: ContentStatus;
          priority: ContentPriority;
          assignee_id: string | null;
          created_by: string | null;
          fecha_publicacion: string | null;
          hora_sugerida: string | null;
          hook: string | null;
          guion: string | null;
          copy: string | null;
          cta: string | null;
          hashtags: string[];
          link_drive: string | null;
          link_canva: string | null;
          link_capcut: string | null;
          link_publicacion_final: string | null;
          vistas: number;
          likes: number;
          comentarios_count: number;
          compartidos: number;
          guardados: number;
          consultas_generadas: number;
          feedback_cliente: string | null;
          created_at: string;
          updated_at: string;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      content_status: ContentStatus;
      content_priority: ContentPriority;
      content_kind: ContentKind;
      client_status: ClientStatus;
      file_kind: FileKind;
      comment_author_type: CommentAuthorType;
      approval_status: ApprovalStatus;
      notification_type: NotificationType;
      story_status: StoryStatus;
    };
  };
}
