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
  comments: {
    forContentItem: (contentItemId: string) => ["comments", "content-item", contentItemId] as const,
    forStory: (storyId: string) => ["comments", "story", storyId] as const,
  },
  files: {
    forContentItem: (contentItemId: string) => ["files", "content-item", contentItemId] as const,
    forStory: (storyId: string) => ["files", "story", storyId] as const,
  },
  taxonomy: (clientId?: string) => ["taxonomy", clientId ?? "global"] as const,
  profiles: ["profiles"] as const,
  clients: ["clients"] as const,
};
