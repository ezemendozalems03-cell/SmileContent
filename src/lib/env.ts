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

// Igual que Supabase: validacion lazy, solo cuando se intenta generar con IA.
const anthropicEnvSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, "Falta ANTHROPIC_API_KEY en .env.local"),
});

export function getAnthropicEnv() {
  return anthropicEnvSchema.parse({
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  });
}
