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
export type PublishStatus =
  | "draft"
  | "ready_for_review"
  | "approved"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "cancelled";
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
export type IdeaStatus = "idea" | "en_desarrollo" | "aprobado" | "calendarizado" | "publicado";
export type AiContentType =
  | "carrusel"
  | "reel"
  | "historia"
  | "post"
  | "tiktok"
  | "email"
  | "campana";
export type AiGenerationStatus = "ok" | "error";
export type BrandProductKind = "producto" | "servicio";
export type BrandLearningCategory = "estilo" | "lenguaje" | "rendimiento" | "otro";
export type IdeaDificultad = "baja" | "media" | "alta";
export type IdeaOrigen = "manual" | "ia";
export type StrategyRuleCategoria = "secuencia" | "frecuencia" | "contenido" | "otro";
export type RecommendationTipo = "balance" | "repeticion" | "frecuencia" | "oportunidad" | "otro";
export type RecommendationSeveridad = "info" | "media" | "alta";
export type RecommendationEstado = "nueva" | "aplicada" | "descartada";
export type RecommendationOrigen = "ia" | "sistema";

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
      content_objectives: {
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
        Update: Partial<Database["public"]["Tables"]["content_objectives"]["Insert"]>;
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
          publish_status: PublishStatus | null;
          scheduled_at: string | null;
          published_at: string | null;
          external_provider: string | null;
          external_post_id: string | null;
          external_submission_id: string | null;
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
          publish_status?: PublishStatus | null;
          scheduled_at?: string | null;
          published_at?: string | null;
          external_provider?: string | null;
          external_post_id?: string | null;
          external_submission_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["content_items"]["Insert"]>;
        Relationships: [];
      };
      social_accounts: {
        Row: {
          id: string;
          client_id: string | null;
          provider: string;
          platform: string;
          account_id: string;
          account_name: string | null;
          username: string | null;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          provider?: string;
          platform: string;
          account_id: string;
          account_name?: string | null;
          username?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["social_accounts"]["Insert"]>;
        Relationships: [];
      };
      scheduled_posts: {
        Row: {
          id: string;
          content_item_id: string;
          client_id: string;
          platform: string;
          social_account_id: string | null;
          scheduled_at: string | null;
          published_at: string | null;
          status: PublishStatus;
          external_provider: string;
          external_post_id: string | null;
          external_submission_id: string | null;
          error_message: string | null;
          payload_json: Record<string, unknown> | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          content_item_id: string;
          client_id: string;
          platform: string;
          social_account_id?: string | null;
          scheduled_at?: string | null;
          published_at?: string | null;
          status?: PublishStatus;
          external_provider?: string;
          external_post_id?: string | null;
          external_submission_id?: string | null;
          error_message?: string | null;
          payload_json?: Record<string, unknown> | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["scheduled_posts"]["Insert"]>;
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
          subpilar_id: string | null;
          formato_id: string | null;
          sub_formato_id: string | null;
          tipo_contenido: ContentKind;
          status: IdeaStatus;
          priority: ContentPriority;
          hook: string | null;
          guion: string | null;
          copy: string | null;
          cta: string | null;
          observaciones_internas: string | null;
          feedback_cliente: string | null;
          fecha_sugerida: string | null;
          created_by: string | null;
          promoted_content_item_id: string | null;
          objetivo: string | null;
          dificultad: IdeaDificultad | null;
          tiempo_estimado: string | null;
          origen: IdeaOrigen;
          campaign_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          title: string;
          description?: string | null;
          pilar_id?: string | null;
          subpilar_id?: string | null;
          formato_id?: string | null;
          sub_formato_id?: string | null;
          tipo_contenido?: ContentKind;
          status?: IdeaStatus;
          priority?: ContentPriority;
          hook?: string | null;
          guion?: string | null;
          copy?: string | null;
          cta?: string | null;
          observaciones_internas?: string | null;
          feedback_cliente?: string | null;
          fecha_sugerida?: string | null;
          created_by?: string | null;
          promoted_content_item_id?: string | null;
          objetivo?: string | null;
          dificultad?: IdeaDificultad | null;
          tiempo_estimado?: string | null;
          origen?: IdeaOrigen;
          campaign_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["ideas"]["Insert"]>;
        Relationships: [];
      };
      content_goals: {
        Row: {
          id: string;
          client_id: string;
          year: number;
          month: number;
          tipo_contenido: ContentKind;
          formato_id: string | null;
          target_count: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          year: number;
          month: number;
          tipo_contenido: ContentKind;
          formato_id?: string | null;
          target_count: number;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["content_goals"]["Insert"]>;
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
          mime_type: string | null;
          size_bytes: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          storage_path: string;
          asset_type?: string | null;
          mime_type?: string | null;
          size_bytes?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["brand_assets"]["Insert"]>;
        Relationships: [];
      };
      brand_memory: {
        Row: {
          id: string;
          client_id: string;
          nombre_comercial: string | null;
          rubro: string | null;
          descripcion: string | null;
          historia: string | null;
          mision: string | null;
          vision: string | null;
          valores: string[];
          publico_edad: string | null;
          publico_pais: string | null;
          publico_ciudad: string | null;
          publico_nivel_socioeconomico: string | null;
          publico_problemas: string[];
          publico_deseos: string[];
          publico_objeciones: string[];
          publico_intereses: string[];
          publico_lenguaje: string | null;
          red_instagram: string | null;
          red_facebook: string | null;
          red_tiktok: string | null;
          red_sitio_web: string | null;
          red_whatsapp: string | null;
          competidores: string[];
          objetivos_marketing: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          nombre_comercial?: string | null;
          rubro?: string | null;
          descripcion?: string | null;
          historia?: string | null;
          mision?: string | null;
          vision?: string | null;
          valores?: string[];
          publico_edad?: string | null;
          publico_pais?: string | null;
          publico_ciudad?: string | null;
          publico_nivel_socioeconomico?: string | null;
          publico_problemas?: string[];
          publico_deseos?: string[];
          publico_objeciones?: string[];
          publico_intereses?: string[];
          publico_lenguaje?: string | null;
          red_instagram?: string | null;
          red_facebook?: string | null;
          red_tiktok?: string | null;
          red_sitio_web?: string | null;
          red_whatsapp?: string | null;
          competidores?: string[];
          objetivos_marketing?: string[];
        };
        Update: Partial<Database["public"]["Tables"]["brand_memory"]["Insert"]>;
        Relationships: [];
      };
      brand_voice: {
        Row: {
          id: string;
          client_id: string;
          tono: string | null;
          personalidad: string | null;
          nivel_formalidad: string | null;
          emojis_permitidos: string[];
          emojis_prohibidos: string[];
          palabras_permitidas: string[];
          palabras_prohibidas: string[];
          frases_tipicas: string[];
          ctas_habituales: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          tono?: string | null;
          personalidad?: string | null;
          nivel_formalidad?: string | null;
          emojis_permitidos?: string[];
          emojis_prohibidos?: string[];
          palabras_permitidas?: string[];
          palabras_prohibidas?: string[];
          frases_tipicas?: string[];
          ctas_habituales?: string[];
        };
        Update: Partial<Database["public"]["Tables"]["brand_voice"]["Insert"]>;
        Relationships: [];
      };
      brand_visual_identity: {
        Row: {
          id: string;
          client_id: string;
          logo_descripcion: string | null;
          colores: string[];
          tipografias: string[];
          estilo_fotografico: string | null;
          estilo_grafico: string | null;
          estilo_carruseles: string | null;
          estilo_historias: string | null;
          estilo_reels: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          logo_descripcion?: string | null;
          colores?: string[];
          tipografias?: string[];
          estilo_fotografico?: string | null;
          estilo_grafico?: string | null;
          estilo_carruseles?: string | null;
          estilo_historias?: string | null;
          estilo_reels?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["brand_visual_identity"]["Insert"]>;
        Relationships: [];
      };
      brand_products: {
        Row: {
          id: string;
          client_id: string;
          kind: BrandProductKind;
          nombre: string;
          descripcion: string | null;
          beneficios: string[];
          caracteristicas: string[];
          diferenciales: string[];
          precio: string | null;
          promociones: string | null;
          publico_objetivo: string | null;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          kind?: BrandProductKind;
          nombre: string;
          descripcion?: string | null;
          beneficios?: string[];
          caracteristicas?: string[];
          diferenciales?: string[];
          precio?: string | null;
          promociones?: string | null;
          publico_objetivo?: string | null;
          activo?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["brand_products"]["Insert"]>;
        Relationships: [];
      };
      brand_learning: {
        Row: {
          id: string;
          client_id: string;
          contenido: string;
          categoria: BrandLearningCategory;
          activo: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          contenido: string;
          categoria?: BrandLearningCategory;
          activo?: boolean;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["brand_learning"]["Insert"]>;
        Relationships: [];
      };
      brand_examples: {
        Row: {
          id: string;
          client_id: string;
          content_item_id: string | null;
          titulo: string;
          tipo_contenido: ContentKind;
          hook: string | null;
          guion: string | null;
          copy: string | null;
          cta: string | null;
          hashtags: string[];
          notas: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          content_item_id?: string | null;
          titulo: string;
          tipo_contenido?: ContentKind;
          hook?: string | null;
          guion?: string | null;
          copy?: string | null;
          cta?: string | null;
          hashtags?: string[];
          notas?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["brand_examples"]["Insert"]>;
        Relationships: [];
      };
      ai_generations: {
        Row: {
          id: string;
          client_id: string;
          content_item_id: string | null;
          requested_by: string | null;
          tipo_contenido: AiContentType;
          tema: string;
          objetivo: string | null;
          producto_id: string | null;
          fecha_publicacion: string | null;
          seccion_regenerada: string | null;
          pilar_id: string | null;
          subpilar_id: string | null;
          formato_id: string | null;
          sub_formato_id: string | null;
          content_objetivo: string | null;
          modelo: string;
          resultado: Record<string, unknown> | null;
          status: AiGenerationStatus;
          error: string | null;
          input_tokens: number;
          output_tokens: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          content_item_id?: string | null;
          requested_by?: string | null;
          tipo_contenido: AiContentType;
          tema: string;
          objetivo?: string | null;
          producto_id?: string | null;
          fecha_publicacion?: string | null;
          seccion_regenerada?: string | null;
          pilar_id?: string | null;
          subpilar_id?: string | null;
          formato_id?: string | null;
          sub_formato_id?: string | null;
          content_objetivo?: string | null;
          modelo: string;
          resultado?: Record<string, unknown> | null;
          status?: AiGenerationStatus;
          error?: string | null;
          input_tokens?: number;
          output_tokens?: number;
        };
        Update: Partial<Database["public"]["Tables"]["ai_generations"]["Insert"]>;
        Relationships: [];
      };
      strategy_settings: {
        Row: {
          id: string;
          client_id: string;
          posts_semanales: number;
          reels_semanales: number;
          historias_semanales: number;
          notas: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          posts_semanales?: number;
          reels_semanales?: number;
          historias_semanales?: number;
          notas?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["strategy_settings"]["Insert"]>;
        Relationships: [];
      };
      strategy_rules: {
        Row: {
          id: string;
          client_id: string;
          regla: string;
          categoria: StrategyRuleCategoria;
          activo: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          regla: string;
          categoria?: StrategyRuleCategoria;
          activo?: boolean;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["strategy_rules"]["Insert"]>;
        Relationships: [];
      };
      client_objectives: {
        Row: {
          id: string;
          client_id: string;
          objetivo: string;
          prioridad: number;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          objetivo: string;
          prioridad?: number;
          activo?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["client_objectives"]["Insert"]>;
        Relationships: [];
      };
      strategy_reports: {
        Row: {
          id: string;
          client_id: string;
          resumen: string | null;
          resultado: Record<string, unknown>;
          modelo: string;
          input_tokens: number;
          output_tokens: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          resumen?: string | null;
          resultado: Record<string, unknown>;
          modelo: string;
          input_tokens?: number;
          output_tokens?: number;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["strategy_reports"]["Insert"]>;
        Relationships: [];
      };
      content_recommendations: {
        Row: {
          id: string;
          client_id: string;
          report_id: string | null;
          tipo: RecommendationTipo;
          titulo: string;
          detalle: string | null;
          severidad: RecommendationSeveridad;
          estado: RecommendationEstado;
          origen: RecommendationOrigen;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          report_id?: string | null;
          tipo?: RecommendationTipo;
          titulo: string;
          detalle?: string | null;
          severidad?: RecommendationSeveridad;
          estado?: RecommendationEstado;
          origen?: RecommendationOrigen;
        };
        Update: Partial<Database["public"]["Tables"]["content_recommendations"]["Insert"]>;
        Relationships: [];
      };
      monthly_plans: {
        Row: {
          id: string;
          client_id: string;
          mes: string;
          resumen: string | null;
          cantidad_contenidos: number;
          resultado: Record<string, unknown>;
          modelo: string;
          input_tokens: number;
          output_tokens: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          mes: string;
          resumen?: string | null;
          cantidad_contenidos?: number;
          resultado: Record<string, unknown>;
          modelo: string;
          input_tokens?: number;
          output_tokens?: number;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["monthly_plans"]["Insert"]>;
        Relationships: [];
      };
      calendar_templates: {
        Row: {
          id: string;
          client_id: string;
          nombre: string;
          slots: Record<string, unknown>[];
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          nombre: string;
          slots?: Record<string, unknown>[];
          activo?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["calendar_templates"]["Insert"]>;
        Relationships: [];
      };
      campaign_contents: {
        Row: {
          id: string;
          campaign_id: string;
          idea_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          idea_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["campaign_contents"]["Insert"]>;
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
      get_portal_stories: {
        Args: { p_story_id?: string | null };
        Returns: {
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
        }[];
      };
      submit_client_story_approval: {
        Args: {
          p_story_id: string;
          p_decision: ApprovalStatus;
          p_notes?: string | null;
        };
        Returns: void;
      };
      monthly_goals_progress: {
        Args: { p_client_id: string; p_year: number; p_month: number };
        Returns: {
          tipo_contenido: ContentKind;
          formato_id: string | null;
          formato_nombre: string | null;
          target_count: number;
          scheduled_count: number;
          published_count: number;
          remaining_count: number;
          pct_complete: number;
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
      idea_status: IdeaStatus;
      ai_content_type: AiContentType;
      ai_generation_status: AiGenerationStatus;
    };
  };
}
