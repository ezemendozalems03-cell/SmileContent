import { z } from "zod";

/**
 * Only validated lazily, at the call site of code paths that actually touch
 * Supabase — importing this module must never break `next build` before
 * `.env.local` exists (Supabase isn't connected yet in this pass).
 */
const supabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({ message: "Falta NEXT_PUBLIC_SUPABASE_URL en .env.local" }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Falta NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local"),
});

export function getSupabaseEnv() {
  return supabaseEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

/**
 * Capa de IA: agnostica de proveedor. `AI_PROVIDER` decide que SDK se
 * instancia (ver `src/lib/ai/provider.ts`); solo se exige la API key del
 * proveedor efectivamente elegido, para no forzar a cargar las tres.
 * Validacion lazy, igual que Supabase: recien al intentar generar con IA.
 */
const AI_PROVIDERS = ["anthropic", "gemini", "openai"] as const;
export type AiProviderName = (typeof AI_PROVIDERS)[number];

const DEFAULT_MODELS: Record<AiProviderName, string> = {
  anthropic: "claude-opus-4-8",
  gemini: "gemini-3-pro-preview",
  openai: "gpt-5.1",
};

const aiProviderEnvSchema = z.object({
  AI_PROVIDER: z.enum(AI_PROVIDERS).default("anthropic"),
});

export function getAiProviderName(): AiProviderName {
  return aiProviderEnvSchema.parse({ AI_PROVIDER: process.env.AI_PROVIDER || undefined }).AI_PROVIDER;
}

const anthropicEnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "Falta ANTHROPIC_API_KEY en .env.local (AI_PROVIDER=anthropic)"),
  ANTHROPIC_MODEL: z.string().min(1).default(DEFAULT_MODELS.anthropic),
});

export function getAnthropicEnv() {
  return anthropicEnvSchema.parse({
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || undefined,
  });
}

const geminiEnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1, "Falta GEMINI_API_KEY en .env.local (AI_PROVIDER=gemini)"),
  GEMINI_MODEL: z.string().min(1).default(DEFAULT_MODELS.gemini),
});

export function getGeminiEnv() {
  return geminiEnvSchema.parse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL || undefined,
  });
}

// Blotato (capa externa de publicación en redes) — server-only, jamás llega
// al frontend. Validación lazy: recién al usar la integración.
const blotatoEnvSchema = z.object({
  BLOTATO_API_KEY: z.string().min(1, "Falta BLOTATO_API_KEY en .env.local"),
  BLOTATO_BASE_URL: z.string().url().default("https://backend.blotato.com/v2"),
});

export function getBlotatoEnv() {
  return blotatoEnvSchema.parse({
    BLOTATO_API_KEY: process.env.BLOTATO_API_KEY,
    BLOTATO_BASE_URL: process.env.BLOTATO_BASE_URL || undefined,
  });
}

const openAiEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "Falta OPENAI_API_KEY en .env.local (AI_PROVIDER=openai)"),
  OPENAI_MODEL: z.string().min(1).default(DEFAULT_MODELS.openai),
});

export function getOpenAiEnv() {
  return openAiEnvSchema.parse({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL || undefined,
  });
}
