import "server-only";

import { getAiProviderName, type AiProviderName } from "@/lib/env";
import { AnthropicProvider } from "@/lib/ai/providers/anthropic-provider";
import { GeminiProvider } from "@/lib/ai/providers/gemini-provider";
import { OpenAiProvider } from "@/lib/ai/providers/openai-provider";
import type { AiProvider, GenerateStructuredParams, StructuredGeneration } from "@/lib/ai/provider-types";

export type { StructuredGeneration, GenerateStructuredParams } from "@/lib/ai/provider-types";

/**
 * AI Provider Service — el unico punto de entrada a un modelo de lenguaje en
 * toda la app. Ningun action ni componente debe importar `@anthropic-ai/sdk`,
 * `@google/genai` u `openai` directamente: todos llaman a `generateStructured`
 * de aca. Cambiar de proveedor es cambiar `AI_PROVIDER` en el entorno, nunca
 * el codigo que consume IA (ver `src/lib/actions/ai.ts` y `ai-strategy.ts`).
 */
let cachedProvider: AiProvider | null = null;
let cachedProviderName: AiProviderName | null = null;

function getProvider(): AiProvider {
  const name = getAiProviderName();
  if (cachedProvider && cachedProviderName === name) return cachedProvider;

  switch (name) {
    case "gemini":
      cachedProvider = new GeminiProvider();
      break;
    case "openai":
      cachedProvider = new OpenAiProvider();
      break;
    case "anthropic":
      cachedProvider = new AnthropicProvider();
      break;
  }
  cachedProviderName = name;
  return cachedProvider;
}

/** Modelo configurado, sin necesidad de haber hecho ninguna llamada todavia (para logging de errores). */
export function currentAiModel(): string {
  return getProvider().modelId;
}

export async function generateStructured<T>(params: GenerateStructuredParams): Promise<StructuredGeneration<T>> {
  return getProvider().generateStructured<T>(params);
}
