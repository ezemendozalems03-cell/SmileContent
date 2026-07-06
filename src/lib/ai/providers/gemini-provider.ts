import "server-only";

import { GoogleGenAI } from "@google/genai";
import { getGeminiEnv } from "@/lib/env";
import { toJsonSchema } from "@/lib/ai/schemas";
import type { AiProvider, GenerateStructuredParams, StructuredGeneration } from "@/lib/ai/provider-types";

export class GeminiProvider implements AiProvider {
  readonly modelId: string;
  private readonly client: GoogleGenAI;

  constructor() {
    const { GEMINI_API_KEY, GEMINI_MODEL } = getGeminiEnv();
    this.client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    this.modelId = GEMINI_MODEL;
  }

  /**
   * Gemini no tiene un bloque "system" con partes cacheables por separado
   * como Anthropic: staticSystem + brandContext van concatenados en
   * `systemInstruction`. El caching implicito de la API hace su trabajo solo.
   */
  async generateStructured<T>(params: GenerateStructuredParams): Promise<StructuredGeneration<T>> {
    const response = await this.client.models.generateContent({
      model: this.modelId,
      contents: params.document
        ? [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType: params.document.mediaType, data: params.document.data } },
                { text: params.userPrompt },
              ],
            },
          ]
        : params.userPrompt,
      config: {
        systemInstruction: `${params.staticSystem}\n\n${params.brandContext}`,
        responseMimeType: "application/json",
        responseJsonSchema: toJsonSchema(params.schema),
      },
    });

    if (response.promptFeedback?.blockReason) {
      throw new Error("El modelo rechazo la solicitud. Reformula el tema e intenta de nuevo.");
    }

    const text = response.text;
    if (!text) {
      throw new Error("El modelo no devolvio contenido.");
    }

    const parsed = params.schema.parse(JSON.parse(text));

    return {
      data: parsed as T,
      model: response.modelVersion ?? this.modelId,
      inputTokens: response.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }
}
