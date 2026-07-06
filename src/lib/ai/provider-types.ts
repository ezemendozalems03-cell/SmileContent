import type { z } from "zod";

/**
 * Contrato unico que expone cualquier proveedor de IA (Anthropic, Gemini,
 * OpenAI...) a la aplicacion. Ningun modulo fuera de `src/lib/ai/providers/`
 * debe importar un SDK de proveedor directamente: todo pasa por esto, para
 * que cambiar de modelo sea una variable de entorno y no un cambio de codigo.
 */

export type StructuredGeneration<T> = {
  data: T;
  /** Nombre real del modelo que respondio (lo informa el proveedor). */
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export type AiDocument = {
  /** Contenido del archivo en base64 (sin prefijo data:). */
  data: string;
  /** Por ahora solo PDF: es lo que los tres proveedores aceptan inline. */
  mediaType: "application/pdf";
  /** Nombre del archivo (algunos proveedores lo muestran al modelo). */
  name: string;
};

export type GenerateStructuredParams = {
  /** Instrucciones estaticas, identicas entre llamadas (persona, reglas fijas). */
  staticSystem: string;
  /** Memoria de marca del cliente: grande, estable durante la sesion. */
  brandContext: string;
  /** El pedido puntual de esta generacion. */
  userPrompt: string;
  /** Zod schema que la respuesta debe cumplir (validado ademas en nuestro lado). */
  schema: z.ZodType;
  /** Documento adjunto opcional (ej. brandbook PDF) que el modelo debe leer. */
  document?: AiDocument;
};

export interface AiProvider {
  /** Identificador del modelo configurado (para logging antes de tener respuesta). */
  readonly modelId: string;
  generateStructured<T>(params: GenerateStructuredParams): Promise<StructuredGeneration<T>>;
}
