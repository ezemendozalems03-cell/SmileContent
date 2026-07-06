import "server-only";

import type { AiContentType } from "@/lib/types/database.types";
import { AI_SECTION_LABELS, type AiResult, type AiSection } from "@/lib/ai/schemas";

/**
 * Instrucciones estaticas (identicas para todos los clientes): primer bloque
 * del system prompt, byte-estable para maximizar prompt caching.
 */
export const STATIC_SYSTEM = `Eres el copywriter y estratega de contenido senior de una agencia de marketing. Trabajas dentro de Content OS, la plataforma interna de la agencia.

Tu trabajo: generar contenido para redes sociales de un cliente de la agencia, usando la memoria de marca que se te proporciona a continuacion. La memoria de marca es tu unica fuente de verdad sobre la marca.

Reglas fijas:
- Escribe SIEMPRE en espanol, en la variante y registro que indique la memoria de marca (seccion "Lenguaje"). Si no se indica, espanol rioplatense neutro.
- Respeta al pie de la letra la identidad de comunicacion: tono, personalidad, formalidad, emojis permitidos y prohibidos, palabras permitidas y prohibidas, frases tipicas y CTA habituales.
- Las palabras PROHIBIDAS no pueden aparecer en ninguna parte del resultado, ni siquiera conjugadas o en diminutivo.
- Respeta SIEMPRE los "Aprendizajes": son correcciones acumuladas del cliente y tienen prioridad sobre tu criterio.
- Usa las publicaciones aprobadas como referencia de estilo: imita estructura, largo y voz. Nunca copies frases enteras.
- Si hay un producto/servicio indicado en el pedido, el contenido debe venderlo o destacarlo usando sus beneficios, diferenciales y promociones reales. No inventes precios, promociones ni caracteristicas.
- No inventes datos de la marca que no esten en la memoria. Si falta informacion, escribe contenido generico bien ejecutado sin afirmar datos concretos.
- Los hashtags van sin el simbolo # y en minusculas.
- "notas_disenador" debe describir con precision que debe armar el disenador (estilo, colores y tipografias de la marca, referencias de la identidad visual).

Devuelve unicamente el JSON pedido, sin texto adicional.`;

const TYPE_INSTRUCTIONS: Record<AiContentType, string> = {
  carrusel: `Genera un CARRUSEL de Instagram:
- "titulo_interno": nombre corto de trabajo para el equipo.
- "hook": la portada (slide 1) debe frenar el scroll; el hook es su texto principal.
- "slides": 6 a 9 slides. Cada slide con "titulo" (texto grande), "texto" (bajada breve, max 2 lineas) e "idea_visual" (que se ve en el slide). El ultimo slide es el CTA.
- "copy": pie de publicacion completo (con salto de linea, sin hashtags dentro).
- "cta", "hashtags" (8-15), "notas_disenador".`,
  reel: `Genera un REEL:
- "hook": lo que se dice/muestra en los primeros 2 segundos.
- "guion": guion completo de voz en off, listo para grabar.
- "escenas": 4 a 8 escenas. Cada una con "descripcion" (que se graba), "texto_en_pantalla" y "voz_en_off" (fragmento del guion que corresponde).
- "copy": pie de publicacion. "cta", "hashtags" (5-12), "notas_disenador" (edicion, ritmo, musica sugerida).`,
  tiktok: `Genera un TIKTOK (mas crudo y nativo que un reel de Instagram):
- "hook": primeros 2 segundos, estilo conversacional TikTok.
- "guion": guion completo hablado a camara, natural.
- "escenas": 3 a 7 escenas con "descripcion", "texto_en_pantalla" y "voz_en_off".
- "copy": caption corto estilo TikTok. "cta", "hashtags" (4-8), "notas_disenador".`,
  historia: `Genera una SECUENCIA DE HISTORIAS (Instagram Stories):
- "secuencia_historia": 3 a 6 historias. Cada una con "descripcion" (que se ve), "texto" (texto sobre la imagen), "interaccion" (encuesta con opciones concretas, pregunta abierta, sticker, quiz, slider... o null si no lleva) e "idea_visual".
- "interaccion_sugerida": cual es la interaccion principal de la secuencia y por que.
- "copy": resumen interno de la secuencia. "cta": el CTA final (ultima historia). "hashtags": [] salvo que la marca los use en historias.`,
  post: `Genera un POST (imagen unica o texto):
- "hook": primera linea del copy, debe frenar el scroll.
- "copy": pie de publicacion completo, estructurado con saltos de linea.
- "cta", "hashtags" (8-15), "notas_disenador" (que se ve en la imagen).`,
  email: `Genera un EMAIL de marketing:
- "email": { "asunto" (max 50 caracteres, gancho claro), "preheader" (complementa el asunto), "cuerpo" (email completo, parrafos cortos, listo para enviar) }.
- "copy": duplicado del cuerpo del email (para vista previa en la plataforma).
- "cta": el boton/enlace principal. "hashtags": []. "hook": el asunto.`,
  campana: `Genera una CAMPANA (concepto + piezas):
- "campana_concepto": la gran idea de la campana en 2-4 frases.
- "campana_piezas": 4 a 8 piezas concretas. Cada una con "tipo" (carrusel, reel, historia, post, email...), "titulo" y "descripcion" (que comunica esa pieza).
- "hook": claim principal de la campana. "copy": mensaje central. "cta", "hashtags" (5-10), "notas_disenador" (direccion de arte general).`,
};

export function buildGenerationPrompt(params: {
  tipo: AiContentType;
  tema: string;
  objetivo?: string | null;
  productoNombre?: string | null;
  fechaPublicacion?: string | null;
}): string {
  let prompt = `# Pedido de contenido\n\n${TYPE_INSTRUCTIONS[params.tipo]}\n\n`;
  prompt += `Tema: ${params.tema}\n`;
  if (params.objetivo) prompt += `Objetivo: ${params.objetivo}\n`;
  if (params.productoNombre) prompt += `Producto/servicio a destacar: ${params.productoNombre}\n`;
  if (params.fechaPublicacion) {
    prompt += `Fecha de publicacion prevista: ${params.fechaPublicacion} (tenla en cuenta solo si el tema es estacional).\n`;
  }
  return prompt;
}

export function buildSectionPrompt(params: {
  tipo: AiContentType;
  tema: string;
  objetivo?: string | null;
  productoNombre?: string | null;
  seccion: AiSection;
  currentResult: AiResult;
}): string {
  let prompt = `# Regenerar una seccion\n\n`;
  prompt += `Este es un contenido tipo "${params.tipo}" ya generado (tema: ${params.tema}`;
  if (params.objetivo) prompt += `, objetivo: ${params.objetivo}`;
  if (params.productoNombre) prompt += `, producto: ${params.productoNombre}`;
  prompt += `):\n\n`;
  prompt += "```json\n" + JSON.stringify(params.currentResult, null, 2) + "\n```\n\n";
  prompt += `Regenera UNICAMENTE la seccion "${AI_SECTION_LABELS[params.seccion]}" con una version distinta y mejor, coherente con el resto del contenido (no cambies el enfoque general). Devuelve solo esa seccion en el JSON pedido.\n\n`;
  prompt += TYPE_INSTRUCTIONS[params.tipo];
  return prompt;
}
