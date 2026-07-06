import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getAnthropicEnv } from "@/lib/env";
import { toClaudeJsonSchema } from "@/lib/ai/schemas";

/**
 * Modelo por defecto para generacion de contenido. Centralizado para que el
 * salto a un modelo nuevo sea un cambio de una linea (y quede registrado por
 * generacion en ai_generations.modelo).
 */
export const AI_MODEL = "claude-opus-4-8";

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!cachedClient) {
    const { ANTHROPIC_API_KEY } = getAnthropicEnv();
    cachedClient = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  }
  return cachedClient;
}

export type StructuredGeneration<T> = {
  data: T;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

/**
 * Una llamada a Claude con salida estructurada (JSON garantizado por schema).
 *
 * - `staticSystem` va primero y `brandContext` segundo, ambos con
 *   cache_control: generaciones consecutivas del mismo cliente reutilizan el
 *   prefijo cacheado (el contexto de marca es grande y estable).
 * - El resultado se valida ademas con el mismo esquema zod en nuestro lado.
 */
export async function generateStructured<T>(params: {
  staticSystem: string;
  brandContext: string;
  userPrompt: string;
  schema: z.ZodType;
}): Promise<StructuredGeneration<T>> {
  const client = getClient();

  const response = await client.messages.create({
    model: AI_MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: [
      { type: "text", text: params.staticSystem },
      {
        type: "text",
        text: params.brandContext,
        cache_control: { type: "ephemeral" },
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: toClaudeJsonSchema(params.schema),
      },
    },
    messages: [{ role: "user", content: params.userPrompt }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("El modelo rechazo la solicitud. Reformula el tema e intenta de nuevo.");
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("La generacion excedio el limite de tokens. Intenta con un pedido mas acotado.");
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("El modelo no devolvio contenido.");
  }

  const parsed = params.schema.parse(JSON.parse(textBlock.text));

  return {
    data: parsed as T,
    model: response.model,
    inputTokens:
      response.usage.input_tokens +
      (response.usage.cache_read_input_tokens ?? 0) +
      (response.usage.cache_creation_input_tokens ?? 0),
    outputTokens: response.usage.output_tokens,
  };
}
