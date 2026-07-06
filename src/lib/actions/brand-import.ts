"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { extractAndSaveBrandbook, readBrandbookFile, readBrandbookText } from "@/lib/ai/brandbook";

/**
 * "Importar brandbook" desde la Memoria de Marca: la IA lee el manual de
 * marca (PDF adjunto en "file" o texto pegado en "texto") y carga/completa
 * todas las secciones. No pisa con vacío lo que ya estaba cargado a mano;
 * los productos se agregan solo si no existen.
 */
export async function importBrandbook(
  clientId: string,
  formData: FormData,
): Promise<{ camposCargados: number; productosCreados: number } | { error: string }> {
  const file = await readBrandbookFile(formData.get("file"));
  if (file && "error" in file) return { error: file.error };

  const text = readBrandbookText(formData.get("texto"));
  if (text && "error" in text) return { error: text.error };

  const source = file ?? text;
  if (!source) return { error: "Adjuntá un PDF o pegá el texto del brandbook." };

  const supabase = await createClient();
  try {
    const result = await extractAndSaveBrandbook(supabase, clientId, source);
    if ("error" in result) return { error: result.error };
    revalidatePath(`/clients/${clientId}/memoria`);
    return result;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo leer el brandbook." };
  }
}
