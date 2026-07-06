import "server-only";

import OpenAI from "openai";
import { getOpenAiEnv } from "@/lib/env";
import { toJsonSchema } from "@/lib/ai/schemas";
import type { AiProvider, GenerateStructuredParams, StructuredGeneration } from "@/lib/ai/provider-types";

export class OpenAiProvider implements AiProvider {
  readonly modelId: string;
  private readonly client: OpenAI;

  constructor() {
    const { OPENAI_API_KEY, OPENAI_MODEL } = getOpenAiEnv();
    this.client = new OpenAI({ apiKey: OPENAI_API_KEY });
    this.modelId = OPENAI_MODEL;
  }

  async generateStructured<T>(params: GenerateStructuredParams): Promise<StructuredGeneration<T>> {
    const response = await this.client.responses.create({
      model: this.modelId,
      instructions: `${params.staticSystem}\n\n${params.brandContext}`,
      input: params.document
        ? [
            {
              role: "user",
              content: [
                {
                  type: "input_file",
                  filename: params.document.name,
                  file_data: `data:${params.document.mediaType};base64,${params.document.data}`,
                },
                { type: "input_text", text: params.userPrompt },
              ],
            },
          ]
        : params.userPrompt,
      text: {
        format: {
          type: "json_schema",
          name: "resultado",
          schema: toJsonSchema(params.schema),
          strict: true,
        },
      },
    });

    const refusal = response.output
      .flatMap((item) => (item.type === "message" ? item.content : []))
      .find((part) => part.type === "refusal");
    if (refusal) {
      throw new Error("El modelo rechazo la solicitud. Reformula el tema e intenta de nuevo.");
    }

    const text = response.output_text;
    if (!text) {
      throw new Error("El modelo no devolvio contenido.");
    }

    const parsed = params.schema.parse(JSON.parse(text));

    return {
      data: parsed as T,
      model: response.model,
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    };
  }
}
