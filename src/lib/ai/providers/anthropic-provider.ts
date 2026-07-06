import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicEnv } from "@/lib/env";
import { toJsonSchema } from "@/lib/ai/schemas";
import type { AiProvider, GenerateStructuredParams, StructuredGeneration } from "@/lib/ai/provider-types";

export class AnthropicProvider implements AiProvider {
  readonly modelId: string;
  private readonly client: Anthropic;

  constructor() {
    const { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } = getAnthropicEnv();
    this.client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    this.modelId = ANTHROPIC_MODEL;
  }

  /**
   * `staticSystem` va primero y `brandContext` segundo, ambos con
   * cache_control: generaciones consecutivas del mismo cliente reutilizan el
   * prefijo cacheado (el contexto de marca es grande y estable).
   */
  async generateStructured<T>(params: GenerateStructuredParams): Promise<StructuredGeneration<T>> {
    const response = await this.client.messages.create({
      model: this.modelId,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      // Bloques vacíos rompen la API: el contexto de marca solo va si existe.
      system: [
        { type: "text", text: params.staticSystem },
        ...(params.brandContext.trim()
          ? ([{ type: "text" as const, text: params.brandContext, cache_control: { type: "ephemeral" as const } }])
          : []),
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: toJsonSchema(params.schema),
        },
      },
      messages: [
        {
          role: "user",
          content: params.document
            ? [
                {
                  type: "document",
                  source: {
                    type: "base64",
                    media_type: params.document.mediaType,
                    data: params.document.data,
                  },
                  title: params.document.name,
                },
                { type: "text", text: params.userPrompt },
              ]
            : params.userPrompt,
        },
      ],
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
}
