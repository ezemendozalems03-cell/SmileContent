export type ContentItemFilters = {
  clientId?: string;
  pilarId?: string;
  formatoId?: string;
  statuses?: string[];
  assigneeId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

export type IdeaFilters = {
  clientId?: string;
  pilarId?: string;
  subpilarId?: string;
  tipoContenido?: string;
  statuses?: string[];
  priority?: string;
  search?: string;
};

export const queryKeys = {
  contentItems: {
    all: ["content-items"] as const,
    list: (filters: ContentItemFilters) => ["content-items", "list", filters] as const,
    detail: (id: string) => ["content-items", "detail", id] as const,
  },
  stories: {
    all: ["stories"] as const,
    list: (clientId?: string) => ["stories", "list", clientId ?? "all"] as const,
  },
  ideas: {
    all: ["ideas"] as const,
    list: (filters: IdeaFilters) => ["ideas", "list", filters] as const,
  },
  brandAssets: {
    list: (clientId: string) => ["brand-assets", "list", clientId] as const,
  },
  strategy: {
    all: (clientId: string) => ["strategy", clientId] as const,
    snapshot: (clientId: string) => ["strategy", clientId, "snapshot"] as const,
    settings: (clientId: string) => ["strategy", clientId, "settings"] as const,
    rules: (clientId: string) => ["strategy", clientId, "rules"] as const,
    objectives: (clientId: string) => ["strategy", clientId, "objectives"] as const,
    recommendations: (clientId: string) => ["strategy", clientId, "recommendations"] as const,
    reports: (clientId: string) => ["strategy", clientId, "reports"] as const,
    plans: (clientId: string) => ["strategy", clientId, "plans"] as const,
    campaigns: (clientId: string) => ["strategy", clientId, "campaigns"] as const,
  },
  brandMemory: {
    all: (clientId: string) => ["brand-memory", clientId] as const,
    memory: (clientId: string) => ["brand-memory", clientId, "memory"] as const,
    voice: (clientId: string) => ["brand-memory", clientId, "voice"] as const,
    visual: (clientId: string) => ["brand-memory", clientId, "visual"] as const,
    products: (clientId: string) => ["brand-memory", clientId, "products"] as const,
    learnings: (clientId: string) => ["brand-memory", clientId, "learnings"] as const,
    examples: (clientId: string) => ["brand-memory", clientId, "examples"] as const,
  },
  comments: {
    forContentItem: (contentItemId: string) => ["comments", "content-item", contentItemId] as const,
    forStory: (storyId: string) => ["comments", "story", storyId] as const,
  },
  files: {
    forContentItem: (contentItemId: string) => ["files", "content-item", contentItemId] as const,
    forStory: (storyId: string) => ["files", "story", storyId] as const,
  },
  publishing: {
    accounts: (clientId?: string) => ["publishing", "accounts", clientId ?? "all"] as const,
    forContent: (contentItemId: string) => ["publishing", "content", contentItemId] as const,
    media: (contentItemId: string) => ["publishing", "media", contentItemId] as const,
  },
  taxonomy: (clientId?: string) => ["taxonomy", clientId ?? "global"] as const,
  profiles: ["profiles"] as const,
  clients: ["clients"] as const,
};
